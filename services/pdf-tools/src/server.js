const fs = require('fs');
const express = require('express');
const multer = require('multer');

const config = require('./config');
const { corsMiddleware } = require('./cors');
const { requireApiKey } = require('./auth');
const { logMetric } = require('./metrics');
const { makeRequestDir, cleanupDir, sweepStaleTempDirs } = require('./tempfiles');
const { checkAllBinaries } = require('./binaries');
const { repairPdf } = require('./repair');
const { convertToPdfALevel, ADVANCED_LEVELS } = require('./pdfa');
const { docxToDoc } = require('./docConvert');
const { runProcess } = require('./runProcess');
const compress = require('./compress');
const { parseRenderParams, renderPage } = require('./render');
const { parseOcrParams, ocrAcquired, queue: ocrQueue, installedLanguages } = require('./ocr');

sweepStaleTempDirs();

const app = express();
app.use(corsMiddleware);

// Creates this request's own temp dir before multer needs a destination for
// it, and guarantees cleanup exactly once, on every path out of the route
// (success, validation failure, thrown error, or timeout).
function withTempDir(handler) {
  return async (req, res) => {
    const dir = makeRequestDir();
    req.tempDir = dir;
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`Unhandled error in ${req.path}:`, err?.message || err);
      if (!res.headersSent) {
        res.status(500).json({ ok: false, error: 'Internal error while processing the file.' });
      }
    } finally {
      cleanupDir(dir);
    }
  };
}

function makeUpload() {
  return multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => cb(null, req.tempDir),
      filename: (_req, _file, cb) => cb(null, 'input.pdf'),
    }),
    limits: { fileSize: config.MAX_FILE_SIZE_BYTES, files: 1 },
  }).single('file');
}
const upload = makeUpload();

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          ok: false,
          error: `File is too large. Maximum size is ${config.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
        });
        return reject(new Error('handled'));
      }
      if (err) return reject(err);
      resolve();
    });
  });
}

// Wraps a handler with the request-level timeout: an AbortSignal is passed
// through to every child process spawned for this request, so a stuck
// qpdf/gs/verapdf invocation gets killed rather than left running after we
// respond (or after cleanupDir deletes files out from under it). Also
// destroys the request socket on timeout so a stalled/slow-loris upload
// (still inside multer, before any child process even starts) gets cut off
// too, rather than only bounding the processing phase.
function withTimeout(fn, ms = config.REQUEST_TIMEOUT_MS) {
  return async (req, res) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      if (!req.complete) req.destroy();
    }, ms);
    try {
      await fn(req, res, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  };
}

app.get('/health', async (_req, res) => {
  const binaries = await checkAllBinaries();
  // soffice (P26, .doc only) is reported but does not decide the service's health: a LibreOffice problem must not
  // mark repair, PDF/A and compression down (nor block a deploy on Railway's health check).
  // P33: tesseract (OCR only) is reported the same way: an OCR problem must not mark the other endpoints down; the OCR
  // endpoint answers 503 by itself (security review 05/10)
  const allOk = Object.entries(binaries).every(([name, b]) => name === 'soffice' || name === 'tesseract' || b.ok);
  // P33: the OCR models installed (codes only), so the site's language list can be checked against them
  let ocrLanguages = null;
  try { ocrLanguages = [...(await installedLanguages())].sort(); } catch { /* reported by binaries.tesseract */ }
  // P35: the OCR slots (how many at a time; the line exists) — no count of visitors
  res.status(allOk ? 200 : 503).json({ ok: allOk, binaries, ocrLanguages, ocr: { concurrency: config.OCR_CONCURRENCY, line: true } });
});

// P28: repair reads the text of the damaged file and of every candidate (two readers each) and can try four methods,
// so it has its own outer limit (REPAIR_TIMEOUT_MS); REQUEST_TIMEOUT_MS still bounds the upload itself, as for PDF/A.
app.post('/v1/repair', requireApiKey, withTempDir(withTimeout(async (req, res, outerSignal) => {
  const inner = new AbortController();
  outerSignal.addEventListener('abort', () => inner.abort(), { once: true });
  const signal = inner.signal;
  res.on('finish', () => clearTimeout(uploadLimit));
  res.on('close', () => clearTimeout(uploadLimit));
  const uploadLimit = setTimeout(() => {
    inner.abort();
    if (!req.complete) req.destroy();
  }, config.REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file provided.' });
  }

  const bytesIn = req.file.size;

  if (signal.aborted) {
    res.status(504).json({ ok: false, error: 'Request timed out before processing could start.' });
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, durationMs: Date.now() - startedAt, verdict: 'timeout' });
    return;
  }

  clearTimeout(uploadLimit);
  const report = await repairPdf(req.tempDir, signal);
  const durationMs = Date.now() - startedAt;

  if (signal.aborted) {
    res.status(504).json({ ok: false, error: 'Repair timed out.' });
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, durationMs, verdict: 'timeout' });
    return;
  }

  if (!report.ok) {
    res.status(422).json(report);
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, durationMs, verdict: report.textCheck === 'differs' ? 'text_would_change' : 'unrecoverable' });
    return;
  }

  const outBytes = fs.readFileSync(report.outputPath);
  res.status(200).json({
    ok: true,
    method: report.method,
    textCheck: report.textCheck,
    checkedWith: report.checkedWith,
    warnings: report.warnings,
    pageCount: report.pageCount,
    file: outBytes.toString('base64'),
  });
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, bytesOut: outBytes.length, durationMs, verdict: `repaired_${report.method}_${report.textCheck}` });
}, config.REPAIR_TIMEOUT_MS)));

// The outer limit is PDFA_ADVANCED_TIMEOUT_MS for every level since P27 (up to three conversions + validations and
// the text checks); REQUEST_TIMEOUT_MS still bounds the upload itself.
app.post('/v1/pdfa', requireApiKey, withTempDir(withTimeout(async (req, res, outerSignal) => {
  const inner = new AbortController();
  outerSignal.addEventListener('abort', () => inner.abort(), { once: true });
  const signal = inner.signal;
  res.on('finish', () => clearTimeout(oldLimit));
  res.on('close', () => clearTimeout(oldLimit));
  // Armed at the start: an upload still running at REQUEST_TIMEOUT_MS is cut. Cleared once the file is in (below).
  const oldLimit = setTimeout(() => {
    inner.abort();
    if (!req.complete) req.destroy();
  }, config.REQUEST_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No file provided.' });
  }

  const bytesIn = req.file.size;
  const requestedConformance = /^[123][ab]$/i.test(req.body?.conformance || '')
    ? req.body.conformance.toLowerCase()
    : config.DEFAULT_PDFA_FLAVOUR;

  if (signal.aborted) {
    res.status(504).json({ ok: false, error: 'Request timed out before processing could start.' });
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/pdfa', bytesIn, durationMs: Date.now() - startedAt, verdict: 'timeout' });
    return;
  }

  // P27: every level takes the same path (pdfa.js convertToPdfALevel): 1b/2b/3b are no longer Ghostscript's output
  // as it comes -- the source kept first, Ghostscript only if its text is unchanged (see attemptB). That can take
  // two veraPDF runs and two text reads more than before, so all levels have the longer limit of the P26 levels.
  clearTimeout(oldLimit);
  const advanced = ADVANCED_LEVELS.includes(String(req.body?.conformance || '').toLowerCase());
  const level = advanced ? req.body.conformance.toLowerCase() : requestedConformance;
  const report = await convertToPdfALevel(req.tempDir, level, advanced && req.body?.allowDowngrade === 'true', signal);
  clearTimeout(oldLimit);
  const durationMs = Date.now() - startedAt;

  if (signal.aborted) {
    res.status(504).json({ ok: false, error: 'Conversion timed out.' });
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/pdfa', bytesIn, durationMs, verdict: 'timeout' });
    return;
  }

  if (!report.ok) {
    res.status(report.compliant === false ? 422 : 500).json(report);
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/pdfa', bytesIn, durationMs, verdict: report.compliant === false ? 'non_compliant' : 'conversion_failed' });
    return;
  }

  const outBytes = fs.readFileSync(report.outputPath);
  res.status(200).json({
    ok: true,
    compliant: true,
    conformance: report.conformance,
    requested: report.requested,
    downgraded: report.downgraded,
    attempts: report.attempts,
    method: report.method,
    verapdf: report.verapdf,
    file: outBytes.toString('base64'),
  });
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/pdfa', bytesIn, bytesOut: outBytes.length, durationMs, verdict: 'compliant' });
}, config.PDFA_ADVANCED_TIMEOUT_MS)));

// ---- /v1/compress: small files, multipart in, the PDF itself out (no base64) ------------------------------
function sendCompressResult(res, r) {
  const stats = { inBytes: r.inBytes, outBytes: r.outBytes, ...r.stats };
  if (r.notSmaller) return res.status(200).json({ ok: true, notSmaller: true, ...stats });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Compress-Stats', JSON.stringify(stats));
  return res.status(200).send(fs.readFileSync(r.outputPath));
}

app.post('/v1/compress', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
  const startedAt = Date.now();
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided.' });
  const level = req.body?.level;
  if (!compress.LEVELS.includes(level)) return res.status(400).json({ ok: false, error: 'Unknown compression level.' });
  const r = await compress.compressPdf(req.tempDir, level, signal);
  const durationMs = Date.now() - startedAt;
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/compress', bytesIn: req.file.size, bytesOut: r.outBytes, durationMs, verdict: r.ok ? (r.notSmaller ? 'not_smaller' : `compressed_${level}`) : `failed_${r.status}` });
  if (!r.ok) return res.status(r.status).json({ ok: false, error: r.error });
  return sendCompressResult(res, r);
}, config.COMPRESS_TIMEOUT_MS)));

// ---- /v1/compress-staged: the file is on the media service (up to MAX_COMPRESS_BYTES) ---------------------
// Body: {jid, ticket, level}. The file never crosses the site's own functions, whose memory would otherwise
// be the ceiling (docs/audit/RAPPORT-ecarts-marche.md).
app.post('/v1/compress-staged', requireApiKey, express.json({ limit: '4kb' }), withTempDir(withTimeout(async (req, res, signal) => {
  const startedAt = Date.now();
  if (!config.MEDIA_SERVICE_URL) {
    console.error('[compress-staged] MEDIA_SERVICE_URL is not set');
    return res.status(503).json({ ok: false, error: 'Large-file compression is not available right now.' });
  }
  const { jid, ticket, level } = req.body || {};
  if (typeof jid !== 'string' || !/^[0-9a-zA-Z]{16,64}$/.test(jid) || typeof ticket !== 'string' || ticket.length > 2048) {
    return res.status(400).json({ ok: false, error: 'Invalid request.' });
  }
  if (!compress.LEVELS.includes(level)) return res.status(400).json({ ok: false, error: 'Unknown compression level.' });
  const stop = compress.keepAlive(jid, ticket);
  try {
    const src = await compress.fetchSource(req.tempDir, jid, ticket, signal);
    if (!src.ok) return res.status(src.status).json({ ok: false, error: src.error });
    const bytesIn = fs.statSync(require('path').join(req.tempDir, compress.INPUT_NAME)).size;
    const r = await compress.compressPdf(req.tempDir, level, signal);
    const verdict = r.ok ? (r.notSmaller ? 'not_smaller' : `compressed_${level}`) : `failed_${r.status}`;
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/compress-staged', bytesIn, bytesOut: r.outBytes, durationMs: Date.now() - startedAt, verdict });
    if (!r.ok) return res.status(r.status).json({ ok: false, error: r.error });
    const stats = { inBytes: r.inBytes, outBytes: r.outBytes, ...r.stats };
    if (r.notSmaller) return res.status(200).json({ ok: true, notSmaller: true, ...stats });
    const dep = await compress.depositOutput(jid, ticket, r.outputPath, signal);
    if (!dep.ok) return res.status(dep.status).json({ ok: false, error: dep.error });
    return res.status(200).json({ ok: true, notSmaller: false, outputBytes: dep.outputBytes, ...stats });
  } finally {
    stop();
  }
}, config.COMPRESS_TIMEOUT_MS)));

// ---- /v1/docx-to-doc (P26, E1): a DOCX in, the Word 97-2003 .doc out (LibreOffice, src/docConvert.js) ---------
app.post('/v1/docx-to-doc', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
  const startedAt = Date.now();
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided.' });
  const bytesIn = req.file.size;
  const r = await docxToDoc(req.tempDir, signal);
  const durationMs = Date.now() - startedAt;
  if (!r.ok) {
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/docx-to-doc', bytesIn, durationMs, verdict: `failed_${r.status}` });
    return res.status(r.status).json({ ok: false, error: r.error });
  }
  const out = fs.readFileSync(r.outputPath);
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/docx-to-doc', bytesIn, bytesOut: out.length, durationMs, verdict: 'converted' });
  res.setHeader('Content-Type', 'application/msword');
  return res.status(200).send(out);
}, config.DOC_TIMEOUT_MS)));

// ---- /v1/unicode-from-actualtext (P27): a PDF in; out the same PDF where accent glyphs without Unicode text get the
// accent their own /ActualText says (py/actualtext.py: that measured case only), or 204 when there is nothing to add. Called before a PDF goes to
// ConvertAPI (PDF to Word/Excel/PowerPoint), which ignores ActualText: measured, "données" came out "donne% es".
const ACTUALTEXT_SCRIPT = require('path').join(__dirname, '..', 'py', 'actualtext.py');
app.post('/v1/unicode-from-actualtext', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
  const startedAt = Date.now();
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided.' });
  const bytesIn = req.file.size;
  const r = await runProcess(config.PDFPY_BIN, [ACTUALTEXT_SCRIPT, 'input.pdf', 'output.pdf'], { cwd: req.tempDir, signal });
  let added = null;
  try { added = JSON.parse(r.stdout.trim().split(/\r?\n/).pop()).added; } catch { /* reported below */ }
  const outPath = require('path').join(req.tempDir, 'output.pdf');
  const durationMs = Date.now() - startedAt;
  if (r.code !== 0 || typeof added !== 'number') {
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/unicode-from-actualtext', bytesIn, durationMs, verdict: signal.aborted ? 'timeout' : 'failed' });
    return res.status(signal.aborted ? 504 : 422).json({ ok: false, error: 'This PDF could not be read.' });
  }
  if (!added || !fs.existsSync(outPath)) {
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/unicode-from-actualtext', bytesIn, durationMs, verdict: 'unchanged' });
    return res.status(204).end();
  }
  const out = fs.readFileSync(outPath);
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/unicode-from-actualtext', bytesIn, bytesOut: out.length, durationMs, verdict: `added_${added}` });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('X-Unicode-Added', String(added));
  return res.status(200).send(out);
}, config.ACTUALTEXT_TIMEOUT_MS)));

// P33 (security review 05/10): at most STAGED_FETCH_CONCURRENCY staged sources (up to 44 MB each) copied into /tmp at
// the same time, render and OCR together; a request that cannot start within STAGED_FETCH_QUEUE_MS gets 503.
let stagedRunning = 0;
const stagedWaiting = [];
async function fetchStagedBounded(dir, jid, ticket, signal, max) {
  const got = stagedRunning < config.STAGED_FETCH_CONCURRENCY ? (stagedRunning++, true) : await new Promise((resolve) => {
    const entry = { resolve, timer: setTimeout(() => { const i = stagedWaiting.indexOf(entry); if (i >= 0) stagedWaiting.splice(i, 1); resolve(false); }, config.STAGED_FETCH_QUEUE_MS) };
    stagedWaiting.push(entry);
  });
  if (!got) return { ok: false, status: 503, error: 'Our PDF service is busy right now. Please try again in a minute.' };
  try {
    return await compress.fetchSource(dir, jid, ticket, signal, max);
  } finally {
    const next = stagedWaiting.shift();
    if (next) { clearTimeout(next.timer); next.resolve(true); } else stagedRunning--;
  }
}

// ---- /v1/render-page (P32): one PDF page -> one image (pdftoppm, src/render.js) --------------------------------
// For an iPhone / iPad whose browser could not draw the page. Multipart: file + page, dpi, format, quality[, maxPixels].
// Answer: the image itself, with X-Render-* headers (density really used, page count, why it was reduced). Nothing is
// kept: the request's temp dir goes in withTempDir's finally, as for every endpoint.
function sendRender(res, r) {
  res.setHeader('Content-Type', r.mime);
  res.setHeader('X-Render-Dpi', String(r.dpi));
  res.setHeader('X-Render-Pages', String(r.pages));
  if (r.reduced) res.setHeader('X-Render-Reduced', r.reduced);
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(fs.readFileSync(r.outputPath));
}
function renderVerdict(r, signal) {
  return r.ok ? `rendered_${r.reduced || 'full'}` : signal.aborted ? 'timeout' : `failed_${r.status}`;
}

app.post('/v1/render-page', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
  const startedAt = Date.now();
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided.' });
  if (req.file.size > config.MAX_RENDER_INPUT_BYTES) return res.status(413).json({ ok: false, error: `Files up to ${Math.floor(config.MAX_RENDER_INPUT_BYTES / 1048576)} MB are accepted.` });
  const p = parseRenderParams(req.body || {});
  if (!p.ok) return res.status(400).json({ ok: false, error: p.error });
  const r = await renderPage(req.tempDir, p, signal);
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/render-page', bytesIn: req.file.size, bytesOut: r.ok ? r.bytes : null, durationMs: Date.now() - startedAt, verdict: renderVerdict(r, signal) });
  if (!r.ok) return res.status(r.status).json({ ok: false, error: r.error });
  return sendRender(res, r);
}, config.RENDER_TIMEOUT_MS)));

// ---- /v1/render-page-staged (P32): same, the PDF is on the media service (files above the Vercel body ceiling) ----
// Body: {jid, ticket, page, dpi, format, quality[, maxPixels]}; ticket = the server-role ticket minted by the site. The
// staged file stays on the media service for the next page (the site deletes it when the visitor is done; the media
// service's TTL otherwise); this service only keeps it in this request's temp dir.
app.post('/v1/render-page-staged', requireApiKey, express.json({ limit: '4kb' }), withTempDir(withTimeout(async (req, res, signal) => {
  const startedAt = Date.now();
  if (!config.MEDIA_SERVICE_URL) {
    console.error('[render-page-staged] MEDIA_SERVICE_URL is not set');
    return res.status(503).json({ ok: false, error: 'Large-file rendering is not available right now.' });
  }
  const { jid, ticket } = req.body || {};
  if (typeof jid !== 'string' || !/^[0-9a-zA-Z]{16,64}$/.test(jid) || typeof ticket !== 'string' || ticket.length > 2048) {
    return res.status(400).json({ ok: false, error: 'Invalid request.' });
  }
  const p = parseRenderParams(req.body);
  if (!p.ok) return res.status(400).json({ ok: false, error: p.error });
  const src = await fetchStagedBounded(req.tempDir, jid, ticket, signal, config.MAX_RENDER_INPUT_BYTES);
  if (!src.ok) return res.status(src.status).json({ ok: false, error: src.error });
  const bytesIn = fs.statSync(require('path').join(req.tempDir, compress.INPUT_NAME)).size;
  const r = await renderPage(req.tempDir, p, signal);
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/render-page-staged', bytesIn, bytesOut: r.ok ? r.bytes : null, durationMs: Date.now() - startedAt, verdict: renderVerdict(r, signal) });
  if (!r.ok) return res.status(r.status).json({ ok: false, error: r.error });
  return sendRender(res, r);
}, config.RENDER_TIMEOUT_MS)));

// ---- /v1/ocr-page (P33): one PDF page -> its text + Tesseract's text-only PDF of it (src/ocr.js) ---------------------
// For an iPhone / iPad whose browser could not recognize the page. Multipart: file + page, lang ("eng", "eng+fra", at
// most 3), dpi. Answer: JSON {ok, text, pdf (base64), dpi, reduced, pages}. Nothing is kept (withTempDir).
//
// P35 (owner's decision D1): OCR_CONCURRENCY (2) recognitions at a time, ONE per visitor (header X-Client-Key: the hash
// of the visitor's IP, computed by the site — never the IP itself, never logged), the others wait in line
// (src/ocrQueue.js). With X-OCR-Stream: 1 (the site since P35), a request that has to wait gets a stream of JSON lines:
// {"queued":true,"position":n} each time its place in line changes (repeated every 10 s, so that no proxy closes a
// quiet connection), {"started":true} when its recognition starts, then ONE last line, the result: {ok:true, …} or
// {ok:false, status, error}. A request that starts at once gets the plain JSON answer of P33. Without the header (the
// site before P35), the request waits at most OCR_QUEUE_MS and the answer is P33's JSON, unchanged.
const OCR_LINE_ERRORS = {
  line_full: { status: 503, error: 'Our OCR service has too many pages waiting right now. Please try again in a few minutes, or use a computer for this PDF.' },
  visitor_line_full: { status: 429, error: 'Pages from your connection are already waiting for our OCR service. Please let them finish first.' },
  timeout: { status: 503, error: 'Our OCR service is still busy with other pages. Please try again in a few minutes, or use a computer for this PDF.' },
  aborted: { status: 499, error: 'Cancelled.' },
};
const CLIENT_KEY = /^[0-9a-f]{64}$/;

// the fields are checked BEFORE a staged file is fetched (a malformed request costs nothing)
async function ocrParams(req, res) {
  let langs;
  try {
    langs = await installedLanguages();
  } catch (e) {
    console.error('[ocr-page] tesseract unavailable:', e?.message || e);
    res.status(503).json({ ok: false, error: 'Our OCR service is not available right now.' });
    return null;
  }
  const p = parseOcrParams(req.body || {}, langs);
  if (!p.ok) { res.status(p.status || 400).json({ ok: false, error: p.error }); return null; }
  return p;
}

/**
 * Waits for an OCR slot, then runs `work(signal)` (fetch of a staged source, recognition) and answers. `outerSignal`:
 * the endpoint's deadline; with the line, the recognition keeps its own OCR_TIMEOUT_MS from the moment it starts.
 */
async function ocrRequest(req, res, outerSignal, endpoint, work) {
  const startedAt = Date.now();
  const stream = req.get('x-ocr-stream') === '1';
  const key = CLIENT_KEY.test(req.get('x-client-key') || '') ? req.get('x-client-key') : null;
  // the visitor leaving (page closed, request cancelled) takes the request out of the line / stops Tesseract
  const gone = new AbortController();
  const onClose = () => { if (!res.writableFinished) gone.abort(); };
  res.on('close', onClose);
  const lineSignal = AbortSignal.any([outerSignal, gone.signal]);
  let beat = null;
  let lastPosition = 0;
  const writeLine = (obj) => { if (!res.writableEnded && !res.destroyed) res.write(`${JSON.stringify(obj)}\n`); };
  const startStream = () => {
    if (res.headersSent) return;
    res.status(200);
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    beat = setInterval(() => writeLine({ queued: true, position: lastPosition }), config.OCR_LINE_HEARTBEAT_MS);
  };
  const finish = (status, body) => {
    clearInterval(beat);
    if (res.headersSent) { writeLine(body.ok ? body : { ...body, status }); res.end(); return undefined; }
    if (body.ok) res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json(body);
  };
  try {
    const slot = await ocrQueue.acquire(key, {
      maxWaitMs: stream ? config.OCR_QUEUE_MAX_WAIT_MS : config.OCR_QUEUE_MS,
      signal: lineSignal,
      onPosition: stream ? (n) => { lastPosition = n; startStream(); writeLine({ queued: true, position: n }); } : undefined,
    });
    if (!slot.ok) {
      logMetric({ apiKeyName: req.apiKey.name, endpoint, durationMs: Date.now() - startedAt, verdict: `line_${slot.reason}` });
      if (gone.signal.aborted || res.destroyed) return undefined;
      const e = OCR_LINE_ERRORS[slot.reason];
      // a caller without the line keeps P33's sentence for a busy service
      return finish(e.status, { ok: false, reason: slot.reason, error: !stream && slot.reason === 'timeout' ? 'Our OCR service is busy right now. Please try again in a minute.' : e.error });
    }
    let r;
    try {
      // with the line, the recognition has its own deadline from the moment it starts (a long wait does not shorten
      // it); a caller without the line keeps P33's single deadline from the request's start (outerSignal)
      const signal = stream ? AbortSignal.any([lineSignal, AbortSignal.timeout(config.OCR_TIMEOUT_MS)]) : lineSignal;
      if (res.headersSent) {
        // from now on the keep-alive line says "started" (review 06/10: repeating the last place would show the visitor
        // "number 2 in line" while the page is being recognized)
        clearInterval(beat);
        writeLine({ started: true });
        beat = setInterval(() => writeLine({ started: true }), config.OCR_LINE_HEARTBEAT_MS);
      }
      try {
        r = await work(signal);
      } catch (err) {
        // review 06/10: once the stream has started, withTempDir can no longer answer — the error goes in the last line
        console.error(`Unhandled error in ${endpoint}:`, err?.message || err);
        r = { ok: false, status: 500, error: 'Internal error while processing the file.' };
      }
    } finally {
      slot.release();
    }
    logMetric({ apiKeyName: req.apiKey.name, endpoint, bytesIn: r.bytesIn ?? null, bytesOut: r.ok ? r.pdf.length : null, durationMs: Date.now() - startedAt, verdict: r.ok ? `ocr_${r.reduced ? 'reduced' : 'full'}${slot.waited ? '_after_line' : ''}` : lineSignal.aborted ? 'timeout' : `failed_${r.status}` });
    if (gone.signal.aborted || res.destroyed) return undefined;
    if (!r.ok) return finish(r.status, { ok: false, error: r.error });
    return finish(200, { ok: true, text: r.text, pdf: r.pdf.toString('base64'), dpi: r.dpi, reduced: r.reduced, pages: r.pages });
  } finally {
    clearInterval(beat);
    res.off('close', onClose);
  }
}

// the endpoints' deadline covers the longest wait in line plus the recognition; a caller without the line is held to
// P33's single OCR_TIMEOUT_MS from the request's start (legacyDeadline)
const OCR_ENDPOINT_MS = config.OCR_QUEUE_MAX_WAIT_MS + config.OCR_TIMEOUT_MS + 5_000;
const legacyDeadline = (req, signal) => (req.get('x-ocr-stream') === '1' ? signal : AbortSignal.any([signal, AbortSignal.timeout(config.OCR_TIMEOUT_MS)]));

app.post('/v1/ocr-page', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
  const deadline = legacyDeadline(req, signal);
  try {
    await runUpload(req, res);
  } catch (err) {
    if (err.message !== 'handled') throw err;
    return;
  }
  if (!req.file) return res.status(400).json({ ok: false, error: 'No file provided.' });
  if (req.file.size > config.MAX_RENDER_INPUT_BYTES) return res.status(413).json({ ok: false, error: `Files up to ${Math.floor(config.MAX_RENDER_INPUT_BYTES / 1048576)} MB are accepted.` });
  const p = await ocrParams(req, res);
  if (!p) return;
  const bytesIn = req.file.size;
  return ocrRequest(req, res, deadline, '/v1/ocr-page', async (s) => ({ ...(await ocrAcquired(req.tempDir, p, s)), bytesIn }));
}, OCR_ENDPOINT_MS)));

// ---- /v1/ocr-page-staged (P33): same, the PDF is on the media service (files above the Vercel body ceiling) -------
// P35: the staged copy is fetched once the OCR slot is obtained (a request waiting in line holds no copy in /tmp)
app.post('/v1/ocr-page-staged', requireApiKey, express.json({ limit: '4kb' }), withTempDir(withTimeout(async (req, res, signal) => {
  const deadline = legacyDeadline(req, signal);
  if (!config.MEDIA_SERVICE_URL) {
    console.error('[ocr-page-staged] MEDIA_SERVICE_URL is not set');
    return res.status(503).json({ ok: false, error: 'Large-file recognition is not available right now.' });
  }
  const { jid, ticket } = req.body || {};
  if (typeof jid !== 'string' || !/^[0-9a-zA-Z]{16,64}$/.test(jid) || typeof ticket !== 'string' || ticket.length > 2048) {
    return res.status(400).json({ ok: false, error: 'Invalid request.' });
  }
  const p = await ocrParams(req, res);
  if (!p) return;
  return ocrRequest(req, res, deadline, '/v1/ocr-page-staged', async (s) => {
    const src = await fetchStagedBounded(req.tempDir, jid, ticket, s, config.MAX_RENDER_INPUT_BYTES);
    if (!src.ok) return src;
    const bytesIn = fs.statSync(require('path').join(req.tempDir, compress.INPUT_NAME)).size;
    return { ...(await ocrAcquired(req.tempDir, p, s)), bytesIn };
  });
}, OCR_ENDPOINT_MS)));

app.listen(config.PORT, () => {
  console.log(`pdf-tools-service listening on :${config.PORT}`);
});
