const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const config = require('./config');
const { pageInfo } = require('./render');

// P33 (05/10): one PDF page -> its text, recognized by Tesseract (Apache-2.0, Debian's tesseract-ocr 5.3 and the
// tesseract-ocr-<lang> models, used unmodified as a separate program). Called by the site's /api/pdf-ocr ONLY when an
// iPhone or iPad could not recognize a page itself (PDF OCR stayed on "Page 1 of 3, Recognizing text… 0 %" on the
// owner's iPhone, 04/10). iLovePDF, Smallpdf and PDF24 run every OCR on their servers; we keep the browser first.
//
// Same output as the browser path (Tesseract.js is the same engine compiled to WebAssembly): the recognized text and
// Tesseract's own text-only PDF of the page (textonly_pdf=1: an invisible text layer, no picture), which the page then
// lays over the visitor's ORIGINAL page with pdf-lib -- the pages themselves are never re-made. Why not OCRmyPDF: it
// returns the whole re-written PDF (too large to come back through a Vercel function, ~4.5 MB), and on a page that
// already holds text it either skips the page (--skip-text) or turns the page into a picture (--force-ocr); the
// browser path recognizes every page and leaves every page as it is.
//
// Bounds (the page comes from an untrusted PDF): one page per request; the page drawn in grey by pdftoppm at the asked
// density, at most OCR_MAX_PIXELS (density lowered and said above that); OCR_CONCURRENCY recognitions at a time on
// this service, a request that cannot start within OCR_QUEUE_MS gets 503; every child process under the same address-
// space ceiling as the renders (prlimit, Linux); Tesseract on one thread (OMP_THREAD_LIMIT=1); the request's temp dir
// is deleted by server.js on every path; no file name, no text in the logs.

const MIN_DPI = 72;
const MAX_DPI = 400;
const MAX_LANGS = 3;
const LANG_CODE = /^[a-z]{3}(?:_[a-z]{3,4})?$/;

// the models installed in this container, read once from `tesseract --list-langs` (a code not installed is refused
// with a sentence, never silently replaced by English)
let installed = null;
async function installedLanguages() {
  if (installed) return installed;
  const r = await runProcess(config.TESSERACT_BIN, ['--list-langs'], { signal: AbortSignal.timeout(15000) });
  if (r.code !== 0) throw new Error(`tesseract --list-langs exited ${r.code}`);
  const set = new Set(`${r.stdout}\n${r.stderr}`.split(/\r?\n/).map((s) => s.trim()).filter((s) => LANG_CODE.test(s) && s !== 'osd'));
  if (!set.size) throw new Error('tesseract lists no language');
  installed = set;
  return installed;
}

/** Validates the fields of an OCR request (multipart body or JSON). `langs`: the installed models. */
function parseOcrParams(src, langs) {
  const int = (v) => (typeof v === 'number' ? v : /^\d{1,9}$/.test(String(v ?? '')) ? Number(v) : NaN);
  const page = int(src.page);
  const dpi = src.dpi === undefined || src.dpi === '' ? 300 : int(src.dpi);
  const lang = String(src.lang || '');
  if (!Number.isInteger(page) || page < 1 || page > 100000) return { ok: false, error: 'Invalid page number.' };
  if (!Number.isInteger(dpi) || dpi < MIN_DPI || dpi > MAX_DPI) return { ok: false, error: `The resolution must be between ${MIN_DPI} and ${MAX_DPI} dpi.` };
  const codes = lang.split('+');
  if (!lang || codes.length > MAX_LANGS || new Set(codes).size !== codes.length || !codes.every((c) => LANG_CODE.test(c))) return { ok: false, error: `Choose one to ${MAX_LANGS} languages.` };
  const missing = codes.filter((c) => !langs.has(c));
  if (missing.length) return { ok: false, status: 422, error: `Our OCR service has no model for ${missing.join(', ')}.` };
  return { ok: true, page, dpi, lang: codes.join('+') };
}

// at most OCR_CONCURRENCY recognitions at a time on this service (separate from the renders: an OCR holds its slot
// for seconds, a render for a fraction of one)
let running = 0;
const waiting = [];
function acquire(ms) {
  if (running < config.OCR_CONCURRENCY) { running++; return Promise.resolve(true); }
  return new Promise((resolve) => {
    const entry = { resolve, timer: setTimeout(() => { const i = waiting.indexOf(entry); if (i >= 0) waiting.splice(i, 1); resolve(false); }, ms) };
    waiting.push(entry);
  });
}
function release() {
  const next = waiting.shift();
  if (next) { clearTimeout(next.timer); next.resolve(true); } else running--;
}

function run(bin, args, opts) {
  if (process.platform === 'linux' && config.RENDER_MEMORY_LIMIT_BYTES > 0) {
    return runProcess(config.PRLIMIT_BIN, [`--as=${config.RENDER_MEMORY_LIMIT_BYTES}`, '--', bin, ...args], opts);
  }
  return runProcess(bin, args, opts);
}

/**
 * Recognizes page `p.page` of <workDir>/input.pdf. Returns {ok, text, pdf (Buffer, text-only page), dpi, reduced,
 * pages} or {ok:false, status, error}.
 */
async function ocrPage(workDir, p, signal) {
  if (!(await acquire(config.OCR_QUEUE_MS))) return { ok: false, status: 503, error: 'Our OCR service is busy right now. Please try again in a minute.' };
  try {
    return await ocrAcquired(workDir, p, signal);
  } finally {
    release();
  }
}

async function ocrAcquired(workDir, p, signal) {
  const info = await pageInfo(workDir, p.page, signal);
  if (!info.ok) return info;
  let dpi = p.dpi;
  let reduced = false;
  const pixelsAt = (d) => Math.ceil((info.widthPt * d) / 72) * Math.ceil((info.heightPt * d) / 72);
  if (pixelsAt(dpi) > config.OCR_MAX_PIXELS) {
    dpi = Math.floor(72 * Math.sqrt(config.OCR_MAX_PIXELS / (info.widthPt * info.heightPt)));
    while (dpi > 1 && pixelsAt(dpi) > config.OCR_MAX_PIXELS) dpi--;
    reduced = true;
  }
  if (dpi < 20) return { ok: false, status: 422, error: 'This page is too large to be recognized.' };
  // grey, as OCRmyPDF and Tesseract.js feed the engine (colour adds nothing to recognition, triples the memory)
  const r = await run(config.PDFTOPPM_BIN, ['-gray', '-png', '-r', String(dpi), '-cropbox', '-f', String(p.page), '-l', String(p.page), '-singlefile', 'input.pdf', 'page'], { cwd: workDir, signal });
  if (r.aborted) return { ok: false, status: 504, error: 'Recognition timed out.' };
  if (r.code !== 0 || !fs.existsSync(path.join(workDir, 'page.png'))) return { ok: false, status: 422, error: 'This page could not be drawn. The PDF may be damaged.' };
  const t = await run(config.TESSERACT_BIN, ['page.png', 'out', '-l', p.lang, '--dpi', String(dpi), '-c', 'textonly_pdf=1', 'txt', 'pdf'], { cwd: workDir, signal, env: { ...process.env, OMP_THREAD_LIMIT: '1' } });
  if (t.aborted) return { ok: false, status: 504, error: 'Recognition timed out. A page this dense may need a computer.' };
  const txtPath = path.join(workDir, 'out.txt');
  const pdfPath = path.join(workDir, 'out.pdf');
  if (t.code !== 0 || !fs.existsSync(txtPath) || !fs.existsSync(pdfPath)) return { ok: false, status: 422, error: 'Our OCR service could not recognize this page.' };
  const pdf = fs.readFileSync(pdfPath);
  const text = fs.readFileSync(txtPath, 'utf8');
  // the layer AND the whole answer (text + base64 layer) must fit the way back (review 05/10)
  if (pdf.length > config.MAX_OCR_OUTPUT_BYTES || Buffer.byteLength(text) + Math.ceil(pdf.length / 3) * 4 > config.MAX_OCR_ANSWER_BYTES) return { ok: false, status: 422, error: 'This page holds too much text to send back.' };
  return { ok: true, text, pdf, dpi, reduced, pages: info.pages };
}

module.exports = { parseOcrParams, ocrPage, installedLanguages, MAX_LANGS };
