const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');
const { runProcess } = require('./runProcess');
const config = require('./config');

const LEVELS = ['low', 'recommended', 'extreme'];
const SCRIPT = path.join(__dirname, '..', 'py', 'compress.py');
const INPUT_NAME = 'input.pdf';
const OUTPUT_NAME = 'compressed.pdf';

// Runs py/compress.py (pikepdf + Adobe's tx, see that file for why this and not
// a Ghostscript rewrite) on <workDir>/input.pdf. Never reports a file that is not
// smaller than the source: `notSmaller` instead, and no output.
async function compressPdf(workDir, level, signal) {
  const inBytes = fs.statSync(path.join(workDir, INPUT_NAME)).size;
  let result;
  try {
    result = await runProcess(config.PDFPY_BIN, [SCRIPT, INPUT_NAME, OUTPUT_NAME, level], { cwd: workDir, signal });
  } catch (err) {
    return { ok: false, status: 500, error: 'The compression engine could not be started.', detail: err.code || err.message };
  }
  if (result.aborted) return { ok: false, status: 504, error: 'Compression timed out. Try a smaller file.' };
  let stats = null;
  try {
    stats = JSON.parse(result.stdout.trim().split(/\r?\n/).pop());
  } catch { /* handled below */ }
  const outPath = path.join(workDir, OUTPUT_NAME);
  if (result.code !== 0 || !stats || !stats.ok || !fs.existsSync(outPath)) {
    // pikepdf could not open or write the file: a damaged or encrypted PDF.
    const encrypted = /PasswordError|encrypted/i.test(result.stderr);
    return {
      ok: false,
      status: 422,
      error: encrypted
        ? 'This PDF is password-protected. Remove the password first (Unlock PDF), then compress it.'
        : 'This PDF could not be read. If it is damaged, run it through Repair PDF first.',
      detail: result.stderr.slice(-500),
    };
  }
  // A file that does not stand up to re-parsing is never handed back.
  const check = await runProcess(config.QPDF_BIN, ['--check', OUTPUT_NAME], { cwd: workDir, signal }).catch(() => ({ code: -1 }));
  if (check.code !== 0 && check.code !== 3) {
    return { ok: false, status: 500, error: 'Compression produced an invalid file; nothing was returned.' };
  }
  const outBytes = fs.statSync(outPath).size;
  if (outBytes >= inBytes) return { ok: true, notSmaller: true, inBytes, outBytes, stats };
  return { ok: true, notSmaller: false, inBytes, outBytes, stats, outputPath: outPath };
}

// ---- staged path: the file lives on the media-processing service -----------------------------------------
// The media service URL comes from THIS service's configuration, never from the request, so a caller cannot
// make this service fetch an arbitrary address. The ticket is the server-role ticket the site minted after
// verifying the visitor's own ticket (lib/media/staged.js); the media service checks it.
function mediaUrl(jid, suffix) {
  if (!/^[0-9a-zA-Z]{16,64}$/.test(jid)) throw new Error('bad_jid');
  return `${config.MEDIA_SERVICE_URL.replace(/\/+$/, '')}/v1/jobs/${jid}${suffix}`;
}

async function fetchSource(workDir, jid, ticket, signal) {
  const res = await fetch(mediaUrl(jid, '/source'), { headers: { Authorization: 'Bearer ' + ticket }, signal });
  if (!res.ok || !res.body) {
    return { ok: false, status: res.status === 404 || res.status === 409 ? 410 : 502, error: 'Your uploaded file is no longer available. Please upload it again.' };
  }
  const expected = Number(res.headers.get('content-length') || 0);
  if (expected > config.MAX_COMPRESS_BYTES) {
    return { ok: false, status: 413, error: `Files up to ${Math.floor(config.MAX_COMPRESS_BYTES / 1048576)} MB are accepted.` };
  }
  const dest = path.join(workDir, INPUT_NAME);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(dest));
  const got = fs.statSync(dest).size;
  if (got === 0 || (expected && got !== expected)) {
    return { ok: false, status: 502, error: 'Your uploaded file arrived incomplete. Please try again.' };
  }
  return { ok: true };
}

async function depositOutput(jid, ticket, outputPath, signal) {
  const size = fs.statSync(outputPath).size;
  const sha = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(outputPath), sha);
  const res = await fetch(mediaUrl(jid, '/output'), {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + ticket,
      'X-Output-Ext': 'pdf',
      'X-Output-Sha256': sha.digest('hex'),
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(size),
    },
    body: Readable.toWeb(fs.createReadStream(outputPath)),
    duplex: 'half',
    signal,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, status: 502, error: 'The compressed file could not be stored for download. Please try again.' };
  return { ok: true, outputBytes: j.outputBytes };
}

// The media service sleeps when idle and keeps jobs in memory (docs/audit/RAPPORT-plafonds-mesures.md):
// one cheap status request every 45 s keeps it awake while we work, like the site's own routes do.
function keepAlive(jid, ticket) {
  const timer = setInterval(() => {
    fetch(mediaUrl(jid, ''), { headers: { Authorization: 'Bearer ' + ticket } }).catch(() => {});
  }, 45_000);
  timer.unref();
  return () => clearInterval(timer);
}

module.exports = { compressPdf, fetchSource, depositOutput, keepAlive, LEVELS, INPUT_NAME };
