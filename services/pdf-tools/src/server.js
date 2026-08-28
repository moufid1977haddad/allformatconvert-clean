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
function withTimeout(fn) {
  return async (req, res) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      if (!req.complete) req.destroy();
    }, config.REQUEST_TIMEOUT_MS);
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

app.listen(config.PORT, () => {
  console.log(`pdf-tools-service listening on :${config.PORT}`);
});
