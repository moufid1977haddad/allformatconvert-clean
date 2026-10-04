const fs = require('fs');
const path = require('path');
const { runProcess } = require('./runProcess');
const config = require('./config');

// P32 (04/10): one PDF page -> one image, with Poppler's pdftoppm (poppler-utils, GPL-2, used unmodified as a separate
// program, like pdftotext and pdfunite). Called by the site's /api/pdf-render ONLY when an iPhone or iPad could not
// draw a page itself (PDF to JPG / PDF to Image / PDF Redact: pdf.js stayed on "Page 1 of 3" for a minute on the
// owner's iPhone). iLovePDF, Smallpdf and PDF24 render every page on their servers; we keep the browser path first.
//
// Bounds (a page is rendered from an untrusted PDF):
// - one page per request, at most MAX_RENDER_PIXELS (a page larger than that at the asked density is drawn at the
//   highest density that fits, and the answer says so -- as the browser path does on a phone);
// - the image must travel back through a Vercel function (~4.5 MB answer ceiling): above MAX_RENDER_OUTPUT_BYTES the
//   page is drawn again at a lower density (twice at most), and the answer says the density really used;
// - RENDER_CONCURRENCY renders at a time on this service; a request that cannot start within RENDER_QUEUE_MS gets 503;
// - the request's temp dir (input, image) is deleted by server.js on every path.

const FORMATS = {
  jpg: { args: (q) => ['-jpeg', '-jpegopt', `quality=${q},optimize=y`], ext: 'jpg', mime: 'image/jpeg' },
  png: { args: () => ['-png'], ext: 'png', mime: 'image/png' },
  tiff: { args: () => ['-tiff', '-tiffcompression', 'lzw'], ext: 'tif', mime: 'image/tiff' },
};
const MIN_DPI = 36;

// Each Poppler process gets an address-space ceiling on Linux (independent review 04/10): a PDF whose JPEG 2000 or
// JBIG2 picture announces 50,000 × 50,000 pixels would otherwise be decoded in full and could take the container (and
// the repairs, PDF/A, compressions running beside it) down. prlimit (util-linux, in every Debian image) execs the tool,
// so the abort kill still reaches it.
function run(bin, args, opts) {
  if (process.platform === 'linux' && config.RENDER_MEMORY_LIMIT_BYTES > 0) {
    return runProcess(config.PRLIMIT_BIN, [`--as=${config.RENDER_MEMORY_LIMIT_BYTES}`, '--', bin, ...args], opts);
  }
  return runProcess(bin, args, opts);
}
const MAX_DPI = 600;

/** Validates the fields of a render request (multipart body or JSON). */
function parseRenderParams(src) {
  const int = (v) => (typeof v === 'number' ? v : /^\d{1,9}$/.test(String(v ?? '')) ? Number(v) : NaN);
  const page = int(src.page);
  const dpi = int(src.dpi);
  const quality = src.quality === undefined || src.quality === '' ? 92 : int(src.quality);
  const maxPixels = src.maxPixels === undefined || src.maxPixels === '' ? config.MAX_RENDER_PIXELS : int(src.maxPixels);
  const format = String(src.format || '');
  if (!Number.isInteger(page) || page < 1 || page > 100000) return { ok: false, error: 'Invalid page number.' };
  if (!Number.isInteger(dpi) || dpi < MIN_DPI || dpi > MAX_DPI) return { ok: false, error: `The resolution must be between ${MIN_DPI} and ${MAX_DPI} dpi.` };
  if (!FORMATS[format]) return { ok: false, error: 'Unknown image format.' };
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) return { ok: false, error: 'Invalid quality.' };
  if (!Number.isInteger(maxPixels) || maxPixels < 100000) return { ok: false, error: 'Invalid size limit.' };
  return { ok: true, page, dpi, format, quality, maxPixels: Math.min(maxPixels, config.MAX_RENDER_PIXELS) };
}

/** Page count and the page's crop box (what pdf.js and pdftoppm -cropbox draw), from pdfinfo. */
async function pageInfo(workDir, page, signal) {
  const unreadable = { ok: false, status: 422, error: 'This file could not be read as a PDF. It may be damaged, or not a PDF despite its name.' };
  // page count first: pdfinfo -f/-l beyond the last page is an error, not a count
  const all = await run(config.PDFINFO_BIN, ['input.pdf'], { cwd: workDir, signal });
  if (all.aborted) return { ok: false, status: 504, error: 'Rendering timed out.' };
  if (all.code !== 0) {
    if (/password/i.test(all.stderr)) return { ok: false, status: 422, error: 'This PDF is protected by a password. Remove the password with our PDF Unlock tool (you need to know it), then convert the unlocked file.' };
    return unreadable;
  }
  const pages = Number((/^Pages:\s+(\d+)/m.exec(all.stdout || '') || [])[1]);
  if (!pages) return unreadable;
  if (page > pages) return { ok: false, status: 400, error: `This PDF has ${pages} page${pages > 1 ? 's' : ''}.` };
  const r = await run(config.PDFINFO_BIN, ['-box', '-f', String(page), '-l', String(page), 'input.pdf'], { cwd: workDir, signal });
  if (r.aborted) return { ok: false, status: 504, error: 'Rendering timed out.' };
  if (r.code !== 0) return unreadable;
  const out = r.stdout || '';
  const box = new RegExp(`^Page\\s+${page}\\s+CropBox:\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)`, 'm').exec(out)
    || new RegExp(`^Page\\s+${page}\\s+MediaBox:\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)\\s+([-\\d.]+)`, 'm').exec(out);
  let w = 0, h = 0;
  if (box) { w = Math.abs(Number(box[3]) - Number(box[1])); h = Math.abs(Number(box[4]) - Number(box[2])); }
  if (!(w > 0 && h > 0)) {
    const size = new RegExp(`^Page\\s+${page}\\s+size:\\s+([\\d.]+)\\s+x\\s+([\\d.]+)`, 'm').exec(out);
    if (size) { w = Number(size[1]); h = Number(size[2]); }
  }
  if (!(w > 0 && h > 0)) return { ok: false, status: 422, error: 'This page has no size; it cannot be drawn.' };
  return { ok: true, pages, widthPt: w, heightPt: h };
}

// at most RENDER_CONCURRENCY pdftoppm at a time on this service
let running = 0;
const waiting = [];
function acquire(ms) {
  if (running < config.RENDER_CONCURRENCY) { running++; return Promise.resolve(true); }
  return new Promise((resolve) => {
    const entry = { resolve, timer: setTimeout(() => { const i = waiting.indexOf(entry); if (i >= 0) waiting.splice(i, 1); resolve(false); }, ms) };
    waiting.push(entry);
  });
}
function release() {
  const next = waiting.shift();
  if (next) { clearTimeout(next.timer); next.resolve(true); } else running--;
}

/**
 * Renders page `p.page` of <workDir>/input.pdf. Returns {ok, outputPath, mime, dpi, reduced, pages, bytes} or
 * {ok:false, status, error}. `reduced`: null, 'page' (page too large for the pixel cap) or 'output' (image too large
 * to send back).
 */
async function renderPage(workDir, p, signal) {
  // pdfinfo inside the same two-at-a-time limit as pdftoppm (review 04/10)
  if (!(await acquire(config.RENDER_QUEUE_MS))) return { ok: false, status: 503, error: 'Our PDF service is busy right now. Please try again in a minute.' };
  try {
    return await renderAcquired(workDir, p, signal);
  } finally {
    release();
  }
}

async function renderAcquired(workDir, p, signal) {
  const info = await pageInfo(workDir, p.page, signal);
  if (!info.ok) return info;
  const fmt = FORMATS[p.format];
  let dpi = p.dpi;
  let reduced = null;
  const pixelsAt = (d) => Math.ceil((info.widthPt * d) / 72) * Math.ceil((info.heightPt * d) / 72);
  if (pixelsAt(dpi) > p.maxPixels) {
    dpi = Math.floor(72 * Math.sqrt(p.maxPixels / (info.widthPt * info.heightPt)));
    while (dpi > 1 && pixelsAt(dpi) > p.maxPixels) dpi--;
    reduced = 'page';
  }
  if (dpi < 1) return { ok: false, status: 422, error: 'This page is too large to be drawn as an image.' };
  {
    for (let attempt = 0; attempt < 3; attempt++) {
      const base = `page-${attempt}`;
      const out = path.join(workDir, `${base}.${fmt.ext}`);
      const r = await run(config.PDFTOPPM_BIN, [...fmt.args(p.quality), '-r', String(dpi), '-cropbox', '-f', String(p.page), '-l', String(p.page), '-singlefile', 'input.pdf', base], { cwd: workDir, signal });
      if (r.aborted) return { ok: false, status: 504, error: 'Rendering timed out.' };
      if (r.code !== 0 || !fs.existsSync(out)) return { ok: false, status: 422, error: 'This page could not be drawn. The PDF may be damaged.' };
      const bytes = fs.statSync(out).size;
      if (bytes === 0) return { ok: false, status: 422, error: 'This page could not be drawn. The PDF may be damaged.' };
      if (bytes <= config.MAX_RENDER_OUTPUT_BYTES) return { ok: true, outputPath: out, mime: fmt.mime, dpi, reduced, pages: info.pages, bytes };
      fs.rmSync(out, { force: true });
      const next = Math.floor(dpi * Math.sqrt(config.MAX_RENDER_OUTPUT_BYTES / bytes) * 0.9);
      if (next < 1 || next >= dpi) break;
      dpi = next;
      reduced = 'output';
    }
    return { ok: false, status: 422, error: 'This page makes an image too large to send at this resolution. Choose a lower resolution or JPG.' };
  }
}

module.exports = { parseRenderParams, renderPage, pageInfo, FORMATS };
