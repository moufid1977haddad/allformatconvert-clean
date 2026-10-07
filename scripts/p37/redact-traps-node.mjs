// P37 (06/10) — the Node replay of PDF Redact (scripts/p35/harness.mjs, same code as the page) over a list of PDFs,
// with the leak checks of the real-page bench (scripts/p35/redact-bench.mjs): pdftotext of the whole file, every
// stream inflated and searched as text / hex / UTF-16BE ("raw"), PDF.js text + annotations. With --ocr, the black
// boxes the replay computed are painted on Poppler's 144 dpi picture of each redacted page of the ORIGINAL (the page
// paints them on PDF.js's picture) and Tesseract reads it: the term must not be read there ("ocr"); the same picture
// without the boxes is read too, to show the term was readable before ("ocr-before": yes / no).
// Known false positive of "raw" (P33 report §7): a term that is part of a font's /Registry (Adobe) (r2/g5).
// A line may give several terms, separated by "|" (fourth review: a leak seen only with two terms).
//   node scripts/p37/redact-traps-node.mjs --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact [--ocr]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const from = (p) => pathToFileURL(path.join(ROOT, p)).href;
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
// --harness=<file>: another replay exporting redact(file, terms) (P37: an older version of the page, to show what leaked)
const { redact } = await import(arg('harness') ? pathToFileURL(path.resolve(arg('harness'))).href : from('scripts/p35/harness.mjs'));
const pdfjs = await import(from('node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const TESS = process.env.TESSERACT_BIN || 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
const OUT = path.join(os.tmpdir(), 'p37-traps-node');
fs.mkdirSync(OUT, { recursive: true });
const ocr = process.argv.includes('--ocr');
// P37 fifth review: Arabic letters folded as app/lib/pdfRedact.js norm does (ی ى → ي, ک → ك, ں → ن, ھ ہ ە ۀ → ه, no tatweel)
const norm = (s) => s.normalize('NFKD').replace(/[\p{M}¨´]/gu, '').replace(/[\u0640\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/[\u06CC\u0649]/g, '\u064A').replace(/\u06A9/g, '\u0643').replace(/\u06BA/g, '\u0646').replace(/[\u06BE\u06C1\u06D5\u06C0]/g, '\u0647').toLowerCase().replace(/\s+/g, '').replace(/[-­‐-―−]/g, '');
const jobs = fs.readFileSync(arg('list'), 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [pdf, term] = l.split('\t'); return { pdf: path.resolve(arg('root', '.'), pdf), term }; });
const pdftotext = (f) => { try { return execFileSync('pdftotext', ['-enc', 'UTF-8', f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };

function rawHit(bytes, term) {
  const raw = Buffer.from(bytes);
  const chunks = [raw.toString('latin1')];
  for (let i = raw.indexOf('stream'); i >= 0; i = raw.indexOf('stream', i + 6)) {
    let s = i + 6; if (raw[s] === 13) s++; if (raw[s] === 10) s++;
    const e = raw.indexOf('endstream', s); if (e < 0) break;
    try { chunks.push(zlib.inflateSync(raw.subarray(s, e)).toString('latin1')); } catch { /* not flate */ }
  }
  const blob = chunks.join('\n').toLowerCase(), t = term.toLowerCase();
  return blob.includes(t) || blob.includes(Buffer.from(term, 'latin1').toString('hex')) || blob.includes(Buffer.from(term, 'utf16le').swap16().toString('hex'));
}

const readPgm = (f) => {
  const b = fs.readFileSync(f); let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(b[pos]))) s += String.fromCharCode(b[pos++]); tok.push(s); }
  pos++;
  return { w: +tok[1], h: +tok[2], head: b.subarray(0, pos), px: Buffer.from(b.subarray(pos)) };
};
const inside = (q, [x, y]) => { let s = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };
const tess = (img) => { const base = img.replace(/\.pgm$/, ''); execFileSync(TESS, [img, base, '-l', 'eng'], { stdio: 'ignore' }); return fs.readFileSync(`${base}.txt`, 'utf8'); };

let leaks = 0;
const tally = {};
for (const { pdf, term } of jobs) {
  const name = path.relative(arg('root', '.'), pdf);
  let r;
  const terms = term.split('|').filter(Boolean);
  const has = (s) => terms.some((x) => norm(s).includes(norm(x)));
  try { r = await redact(pdf, terms); } catch (e) { tally.ERROR = (tally.ERROR || 0) + 1; console.log(`${name} [${term}] ERROR ${e.message}`); continue; }
  tally[r.status] = (tally[r.status] || 0) + 1;
  const L = [], notes = [];
  // only a file the page would hand over is checked (a refused file is never given)
  if (r.bytes && r.status === 'ok') {
    const out = path.join(OUT, name.replace(/[\\/]/g, '_'));
    fs.writeFileSync(out, r.bytes);
    if (has(pdftotext(out))) L.push('pdftotext');
    if (terms.some((x) => rawHit(r.bytes, x))) L.push('raw');
    const d = await pdfjs.getDocument({ data: new Uint8Array(r.bytes), standardFontDataUrl: SFD, verbosity: 0 }).promise;
    let s = '';
    for (let i = 1; i <= d.numPages; i++) { const pg = await d.getPage(i); s += (await pg.getTextContent()).items.map((x) => x.str).join(' ') + ' ' + (await pg.getAnnotations()).map((a) => [a.fieldValue, a.contentsObj?.str, a.url].filter(Boolean).join(' ')).join(' '); }
    await d.destroy();
    if (has(s)) L.push('pdfjs');
    if (ocr) {
      const src = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(pdf)), standardFontDataUrl: SFD, verbosity: 0 }).promise;
      for (const pg of r.hits) {
        const base = path.join(OUT, `ocr-${name.replace(/[\\/]/g, '_')}-p${pg}`);
        execFileSync('pdftoppm', ['-r', '144', '-gray', '-singlefile', '-f', String(pg), '-l', String(pg), pdf, base], { stdio: 'ignore' });
        const before = has(tess(`${base}.pgm`));
        const img = readPgm(`${base}.pgm`);
        const page = await src.getPage(pg);
        const vp = page.getViewport({ scale: 2, rotation: page.rotate });
        const quads = r.quads[pg] || [];
        for (let j = 0; j < img.h; j++) for (let i = 0; i < img.w; i++) { const p = vp.convertToPdfPoint(i + 0.5, j + 0.5); if (quads.some((q) => inside(q, p))) img.px[j * img.w + i] = 0; }
        fs.writeFileSync(`${base}-boxes.pgm`, Buffer.concat([img.head, img.px]));
        if (has(tess(`${base}-boxes.pgm`))) L.push(`ocr-p${pg}`);
        notes.push(`ocr-before p${pg}: ${before ? 'yes' : 'no'}`);
      }
      await src.destroy();
    }
  }
  if (L.length) leaks++;
  console.log(`${name} [${term}] ${r.status}${L.length ? ` LEAK:${L.join(',')}` : ''}${r.exact ? ` exact ${r.exact.placed}/${r.exact.spans}` : ''} words kept ${JSON.stringify(r.kept || {})}${notes.length ? ` (${notes.join(', ')})` : ''}${r.reason ? ` — ${r.reason}` : ''}`);
}
console.log(`\n${jobs.length} PDFs: ${JSON.stringify(tally)}; files with a leak signal: ${leaks}`);
