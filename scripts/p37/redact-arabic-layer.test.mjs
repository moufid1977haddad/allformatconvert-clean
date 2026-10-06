// P37 (06/10) — PDF Redact keeps the Arabic words outside the black boxes as selectable text. Before: the invisible
// text layer of a redacted page was Helvetica only, so every Arabic word was lost.
// The Node replay of the page (scripts/p35/harness.mjs, same app/lib code) redacts "مارس" in Arabic PDFs made by
// scripts/p37/make-arabic-fixtures.mjs, then reads the result with Poppler (pdftotext) and PDF.js:
//   - the redacted word is nowhere: pdftotext, PDF.js, and every stream inflated, as UTF-8, UTF-16BE hex and its
//     presentation forms (raw);
//   - the other words are back, in reading order: each line (Arabic with digits, Latin, an e-mail address, lam-alef)
//     must be found whole in the extracted text, and the line with the redacted word as its two pieces around the gap.
//     The line in full vowel marks (basmala) is reported, not required.
// Graded fixtures: the PDFs whose Arabic text PDF.js reads right (LibreOffice: Arial, Tahoma, Times New Roman, Segoe UI;
// the layer is written from PDF.js's reading). Reported, not graded: LibreOffice Noto Naskh Arabic and this site's
// Text to PDF (PDF.js already misreads their letters: wrong ToUnicode), Chromium (PDF.js reads one glyph per run in
// drawing order: Redact finds no Arabic word at all, "No match found").
//   node scripts/p37/redact-arabic-layer.test.mjs [fixtures dir, default %TEMP%\p37-arabic] [--harness=<harness.mjs>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const DIR = process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(os.tmpdir(), 'p37-arabic');
const harness = arg('harness', path.join(ROOT, 'scripts/p35/harness.mjs'));
const { redact } = await import(pathToFileURL(harness).href);
const pdfjs = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const LINES = JSON.parse(fs.readFileSync(path.join(DIR, 'lines.json'), 'utf8'));
const WORD = 'مارس';
const GRADED = ['lo-Arial', 'lo-Tahoma', 'lo-TimesNewRoman', 'lo-SegoeUI'];
const REPORTED = ['lo-NotoNaskhArabic', 'site-text-to-pdf', 'chrome-NotoNaskhArabic', 'chrome-Tahoma', 'chrome-Arial'];

// compared without vowel marks, tatweel, direction marks, and with presentation forms folded
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
// expected pieces: every line whole, the redacted line as its two sides of the gap, the basmala aside
const pieces = [];
for (const l of LINES) {
  if (/[ً-ْ]/.test(l)) continue;
  if (l.includes(WORD)) pieces.push(...l.split(WORD).map((s) => s.trim()).filter(Boolean));
  else pieces.push(l);
}

const poppler = (f) => execFileSync('pdftotext', ['-enc', 'UTF-8', f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
async function pdfjsText(bytes) {
  const d = await pdfjs.getDocument({ data: new Uint8Array(bytes), standardFontDataUrl: SFD, verbosity: 0 }).promise;
  let s = '';
  for (let i = 1; i <= d.numPages; i++) { const p = await d.getPage(i); for (const it of (await p.getTextContent()).items) s += it.str + (it.hasEOL ? '\n' : ' '); s += '\n'; }
  await d.destroy();
  return s;
}
function rawHit(bytes) {
  const raw = Buffer.from(bytes);
  const chunks = [raw.toString('latin1')];
  for (let i = raw.indexOf('stream'); i >= 0; i = raw.indexOf('stream', i + 6)) {
    let s = i + 6; if (raw[s] === 13) s++; if (raw[s] === 10) s++;
    const e = raw.indexOf('endstream', s); if (e < 0) break;
    try { chunks.push(zlib.inflateSync(raw.subarray(s, e)).toString('latin1')); } catch { /* not flate */ }
  }
  const blob = chunks.join('\n').toLowerCase();
  const forms = [WORD, [...WORD].reverse().join('')];
  return forms.some((w) => blob.includes(Buffer.from(w, 'utf8').toString('latin1').toLowerCase()) || blob.includes(Buffer.from(w, 'utf16le').swap16().toString('hex')));
}
// is each piece found whole, in order, on one line of the text? Spaces are not compared: Poppler writes a Latin run
// inside Arabic with its spaces moved ("شركة ‪ Microsoft‬في"), on the original file as well
const S = (s) => N(s).replace(/ /g, '');
const found = (text) => { const lines = text.split(/\r?\n/).map(S); return pieces.map((p) => [p, lines.some((l) => l.includes(S(p)))]); };

let fails = 0;
for (const name of [...GRADED, ...REPORTED]) {
  const file = path.join(DIR, `${name}.pdf`);
  if (!fs.existsSync(file)) { console.log(`MISSING ${name} (run scripts/p37/make-arabic-fixtures.mjs)`); if (GRADED.includes(name)) fails++; continue; }
  const graded = GRADED.includes(name);
  const r = await redact(file, [WORD]);
  if (!r.bytes) { console.log(`${graded ? 'FAIL' : 'INFO'} ${name}: ${r.status}${r.reason ? ` (${r.reason})` : ''}`); if (graded) fails++; continue; }
  const out = path.join(DIR, `redacted-${name}.pdf`);
  fs.writeFileSync(out, r.bytes);
  const pt = poppler(out), pj = await pdfjsText(r.bytes);
  const gone = { pdftotext: !N(pt).includes(WORD), pdfjs: !N(pj).includes(WORD), raw: !rawHit(r.bytes) };
  const fp = found(pt), fj = found(pj);
  const okGone = r.status === 'ok' && Object.values(gone).every(Boolean);
  const okKept = fp.every(([, k]) => k) && fj.every(([, k]) => k);
  const ok = okGone && okKept;
  if (graded && !ok) fails++;
  console.log(`${graded ? (ok ? 'PASS' : 'FAIL') : 'INFO'} ${name}: status ${r.status}; "${WORD}" absent: pdftotext ${gone.pdftotext}, PDF.js ${gone.pdfjs}, raw ${gone.raw}; pieces in reading order: pdftotext ${fp.filter(([, k]) => k).length}/${pieces.length}, PDF.js ${fj.filter(([, k]) => k).length}/${pieces.length}; words in the layer ${JSON.stringify(r.kept)}`);
  for (const [p, k] of fp) if (!k) console.log(`    pdftotext lacks: ${p}`);
  for (const [p, k] of fj) if (!k) console.log(`    PDF.js lacks: ${p}`);
}
console.log(`\n${fails ? `${fails} graded fixture(s) FAIL` : `all ${GRADED.length} graded fixtures PASS`}`);
process.exit(fails ? 1 : 0);
