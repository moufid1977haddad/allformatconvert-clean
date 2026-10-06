// P35 (05/10) — PDF Redact with the invisible text layer (D3), run on the REAL page (production build, Playwright) over
// a list of PDFs, each output checked for leaks the way the P33 review's replay did (%TEMP%\p33-review-redact\replay.sh):
//   pdftotext of the whole file; every Form XObject redrawn on a page of its own and read by pdftotext ("forms");
//   every stream inflated, searched as text, hex and UTF-16BE ("raw"); PDF.js text + annotations ("pdfjs");
//   and with --ocr, Tesseract on each redacted page at 300 dpi ("ocr").
// Prints one line per PDF: status (ok / REFUSED / nomatch / ERROR), leaks, words of selectable text on the redacted
// pages (pdftotext), and a total.
//   node scripts/p35/redact-bench.mjs <origin> --list=<file: "pdf<TAB>term" per line> [--root=<dir>] [--browser=chromium] [--ocr]
//   (the 31 trap PDFs of the P33 reviews: --list=scripts/p35/traps.txt --root=%TEMP%\p33-review-redact)
//   node scripts/p35/redact-bench.mjs <origin> --corpus=<file: one pdf per line> --term=the|auto [--root=<dir>]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'chromium');
const ocr = process.argv.includes('--ocr');
const TESS = process.env.TESSERACT_BIN || 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
const OUT = path.join(os.tmpdir(), 'p35-redact-bench');
fs.mkdirSync(OUT, { recursive: true });
// P37 fifth review: Arabic letters folded as app/lib/pdfRedact.js norm does (ی ى → ي, ک → ك, ھ ہ ە ۀ → ه, no tatweel)
const norm = (s) => s.normalize('NFKD').replace(/[\p{M}¨´]/gu, '').replace(/[\u0640\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/[\u06CC\u0649]/g, '\u064A').replace(/\u06A9/g, '\u0643').replace(/[\u06BE\u06C1\u06D5\u06C0]/g, '\u0647').toLowerCase().replace(/\s+/g, '').replace(/[-­‐-―−]/g, '');

let jobs;
if (arg('list')) jobs = fs.readFileSync(arg('list'), 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [pdf, term] = l.split('\t'); return { pdf: path.resolve(arg('root', '.'), pdf), term }; });
else jobs = fs.readFileSync(arg('corpus'), 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((pdf) => ({ pdf: path.resolve(arg('root', '.'), pdf), term: arg('term', 'the') }));

const pdftotext = (f, extra = []) => { try { return execFileSync('pdftotext', ['-enc', 'UTF-8', ...extra, f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };
// --term=auto: the file's most frequent word of 4 letters or more (a common word of its own language)
for (const j of jobs) if (j.term === 'auto') {
  const count = new Map();
  for (const w of pdftotext(j.pdf).toLowerCase().match(/\p{L}{4,}/gu) || []) count.set(w, (count.get(w) || 0) + 1);
  j.term = [...count].sort((a, b) => b[1] - a[1])[0]?.[0] || 'the';
}

async function formsText(file) {
  // every Form XObject drawn on a page of its own (as the review's recover.cjs did), then read by pdftotext
  const { PDFDocument, PDFName, PDFRawStream } = await import('pdf-lib');
  const src = await PDFDocument.load(fs.readFileSync(file), { updateMetadata: false });
  const forms = [];
  for (const [ref, o] of src.context.enumerateIndirectObjects()) if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype'))?.toString() === '/Form') forms.push(ref);
  if (!forms.length) return '';
  for (const ref of forms) {
    const p = src.addPage([600, 200]);
    p.node.set(PDFName.of('Resources'), src.context.obj({ XObject: { X: ref } }));
    p.node.set(PDFName.of('Contents'), src.context.register(src.context.stream('q 1 0 0 1 20 80 cm /X Do Q')));
  }
  const rec = file.replace(/\.pdf$/, '.forms.pdf');
  fs.writeFileSync(rec, await src.save());
  return pdftotext(rec);
}

function rawHit(file, term) {
  const raw = fs.readFileSync(file);
  const chunks = [raw.toString('latin1')];
  for (let i = raw.indexOf('stream'); i >= 0; i = raw.indexOf('stream', i + 6)) {
    let s = i + 6;
    if (raw[s] === 13) s++;
    if (raw[s] === 10) s++;
    const e = raw.indexOf('endstream', s);
    if (e < 0) break;
    try { chunks.push(zlib.inflateSync(raw.subarray(s, e)).toString('latin1')); } catch { /* not flate */ }
  }
  const blob = chunks.join('\n').toLowerCase();
  const t = term.toLowerCase();
  return blob.includes(t) || blob.includes(Buffer.from(term, 'latin1').toString('hex').toLowerCase()) || blob.includes(Buffer.from(term, 'utf16le').swap16().toString('hex').toLowerCase());
}

async function pdfjsText(file) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/', verbosity: 0 }).promise;
  let s = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    s += (await pg.getTextContent()).items.map((x) => x.str).join(' ') + ' ' + (await pg.getAnnotations()).map((a) => [a.fieldValue, a.contentsObj?.str, a.url].filter(Boolean).join(' ')).join(' ') + '\n';
  }
  await doc.destroy();
  return s;
}

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true });
const totals = { ok: 0, REFUSED: 0, nomatch: 0, ERROR: 0, leaks: 0, words: 0, pages: 0 };
for (const { pdf, term } of jobs) {
  const name = path.basename(path.dirname(pdf)) + '/' + path.basename(pdf);
  const p = await ctx.newPage();
  let status = 'ERROR', reason = '', summary = '', hitPages = [];
  const leaks = [];
  let words = [];
  try {
    await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    await p.locator('input[type=file]').first().setInputFiles(pdf);
    await p.locator('#rd-terms').fill(term);
    await p.getByRole('button', { name: 'Redact PDF' }).click();
    await p.waitForSelector('[data-summary], p[role=alert]', { timeout: 300000 });
    summary = await p.locator('[data-summary]').innerText().catch(() => '');
    const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
    if (alert) { status = /could not be redacted safely/.test(alert) ? 'REFUSED' : /No match found/.test(alert) ? 'nomatch' : 'ERROR'; reason = alert.slice(0, 220); }
    else {
      status = 'ok';
      const out = path.join(OUT, `${engine}-${path.basename(pdf)}`);
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
      await dl.saveAs(out);
      hitPages = (/\(([^)]*)\)/.exec(summary)?.[1] || '').split(', ').map((x) => Number(/page (\d+)/.exec(x)?.[1])).filter(Boolean);
      const t = norm(term);
      if (norm(pdftotext(out)).includes(t)) leaks.push('pdftotext');
      if (norm(await formsText(out)).includes(t)) leaks.push('forms');
      if (rawHit(out, term)) leaks.push('raw');
      if (norm(await pdfjsText(out)).includes(t)) leaks.push('pdfjs');
      for (const pg of hitPages) {
        words.push(pdftotext(out, ['-f', String(pg), '-l', String(pg)]).split(/\s+/).filter(Boolean).length);
        if (ocr) {
          const base = path.join(OUT, `ocr-${path.basename(pdf, '.pdf')}-p${pg}`);
          execFileSync('pdftoppm', ['-r', '300', '-f', String(pg), '-l', String(pg), '-singlefile', '-gray', '-png', out, base]);
          execFileSync(TESS, [`${base}.png`, base, '-l', 'eng'], { stdio: 'ignore' });
          if (norm(fs.readFileSync(`${base}.txt`, 'utf8')).includes(t)) leaks.push(`ocr-p${pg}`);
        }
      }
    }
  } catch (e) { reason = e.message.slice(0, 200); }
  await p.close();
  totals[status]++;
  if (leaks.length) totals.leaks++;
  totals.words += words.reduce((a, c) => a + c, 0);
  totals.pages += words.length;
  console.log(`${name} [${term}] ${status}${leaks.length ? ` LEAK:${leaks.join(',')}` : ''}${hitPages.length ? ` pages ${hitPages.join(',')} words kept ${words.join(',')}` : ''}${reason ? ` — ${reason}` : ''}`);
}
await b.close();
console.log(`\n${engine}: ${jobs.length} PDFs — ok ${totals.ok}, REFUSED ${totals.REFUSED}, nomatch ${totals.nomatch}, ERROR ${totals.ERROR}; files with a leak signal: ${totals.leaks}; selectable words on ${totals.pages} redacted pages: ${totals.words}`);
