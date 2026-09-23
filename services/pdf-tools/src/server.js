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
const { convertToPdfA } = require('./pdfa');
const compress = require('./compress');

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
  const allOk = Object.values(binaries).every((b) => b.ok);
  res.status(allOk ? 200 : 503).json({ ok: allOk, binaries });
});

app.post('/v1/repair', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
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

  const report = await repairPdf(req.tempDir, signal);
  const durationMs = Date.now() - startedAt;

  if (signal.aborted) {
    res.status(504).json({ ok: false, error: 'Repair timed out.' });
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, durationMs, verdict: 'timeout' });
    return;
  }

  if (!report.ok) {
    res.status(422).json(report);
    logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, durationMs, verdict: 'unrecoverable' });
    return;
  }

  const outBytes = fs.readFileSync(report.outputPath);
  res.status(200).json({
    ok: true,
    method: report.method,
    warnings: report.warnings,
    pageCount: report.pageCount,
    file: outBytes.toString('base64'),
  });
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/repair', bytesIn, bytesOut: outBytes.length, durationMs, verdict: `repaired_${report.method}` });
})));

app.post('/v1/pdfa', requireApiKey, withTempDir(withTimeout(async (req, res, signal) => {
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

  const report = await convertToPdfA(req.tempDir, requestedConformance, signal);
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
    conformance: requestedConformance,
    verapdf: report.verapdf,
    file: outBytes.toString('base64'),
  });
  logMetric({ apiKeyName: req.apiKey.name, endpoint: '/v1/pdfa', bytesIn, bytesOut: outBytes.length, durationMs, verdict: 'compliant' });
})));

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

app.listen(config.PORT, () => {
  console.log(`pdf-tools-service listening on :${config.PORT}`);
});
