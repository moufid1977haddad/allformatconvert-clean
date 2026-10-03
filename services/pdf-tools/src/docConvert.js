const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const config = require('./config');

// P26 (E1): DOCX -> legacy Word 97-2003 .doc, with LibreOffice (what CloudConvert and iLovePDF use for .doc;
// ConvertAPI writes no .doc at all). The site turns a PDF into DOCX first (ConvertAPI, as for "Word (.docx)") and
// sends that DOCX here. Why this service: it runs all the time anyway, so a conversion only costs its own seconds
// (the media service sleeps and every wake-up would bill its idle minutes too); Gotenberg's LibreOffice only
// writes PDF. soffice is started per request with its own profile directory, so conversions never share state and
// nothing stays in memory between them.
const INPUT_NAME = 'input.docx';
const OUTPUT_NAME = 'input.doc';
const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // Compound File: what a .doc is
const MAX_PARALLEL = 2; // each soffice takes ~150-300 MB while it runs
let running = 0;
const waiting = [];

// Resolves true once a slot is taken, false if the request was aborted while waiting (it then leaves the queue).
async function slot(signal) {
  if (signal?.aborted) return false;
  if (running < MAX_PARALLEL) { running++; return true; }
  const got = await new Promise((resolve) => {
    const entry = () => { signal?.removeEventListener('abort', onAbort); resolve(true); };
    const onAbort = () => { const i = waiting.indexOf(entry); if (i >= 0) waiting.splice(i, 1); resolve(false); };
    signal?.addEventListener('abort', onAbort, { once: true });
    waiting.push(entry);
  });
  if (got) running++;
  return got;
}
function release() {
  running--;
  const next = waiting.shift();
  if (next) next();
}

async function docxToDoc(workDir, signal) {
  const src = path.join(workDir, 'input.pdf'); // multer's fixed name for the upload
  const head = Buffer.alloc(4);
  const fd = fs.openSync(src, 'r');
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (head[0] !== 0x50 || head[1] !== 0x4b) return { ok: false, status: 400, error: 'This is not a DOCX file.' };
  fs.renameSync(src, path.join(workDir, INPUT_NAME));
  const profile = path.join(workDir, 'lo-profile');
  if (!(await slot(signal))) return { ok: false, status: 504, error: 'Conversion to .doc timed out.' };
  let r;
  try {
    r = await runProcess(config.SOFFICE_BIN, [
      `-env:UserInstallation=${pathToFileUrl(profile)}`,
      '--headless', '--norestore', '--nolockcheck', '--nodefault', '--nologo',
      '--convert-to', 'doc:MS Word 97', '--outdir', workDir, path.join(workDir, INPUT_NAME),
    ], { cwd: workDir, signal, killGroup: true });
  } catch (err) {
    return { ok: false, status: 500, error: 'The Word converter could not be started.', detail: err.code || err.message };
  } finally {
    release();
  }
  if (r.aborted) return { ok: false, status: 504, error: 'Conversion to .doc timed out.' };
  const out = path.join(workDir, OUTPUT_NAME);
  if (r.code !== 0 || !fs.existsSync(out) || fs.statSync(out).size < 512) {
    return { ok: false, status: 422, error: 'This document could not be converted to .doc.', detail: (r.stderr || '').slice(-300) };
  }
  const magic = Buffer.alloc(8);
  const ofd = fs.openSync(out, 'r');
  fs.readSync(ofd, magic, 0, 8, 0);
  fs.closeSync(ofd);
  if (!magic.equals(OLE_MAGIC)) return { ok: false, status: 500, error: 'The converter returned something other than a .doc file.' };
  return { ok: true, outputPath: out };
}

function pathToFileUrl(p) {
  const abs = path.resolve(p).replace(/\\/g, '/');
  return 'file://' + (abs.startsWith('/') ? '' : '/') + abs;
}

module.exports = { docxToDoc };
