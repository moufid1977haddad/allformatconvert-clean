// P33 (05/10) — is PDF Redact a REAL removal? Runs the page (Playwright) on a PDF + terms, then checks the file it
// produced four independent ways:
//   1. pdftotext (Poppler) of every page: no term left;
//   2. PDF.js (node, legacy build) getTextContent of every page + annotations: no term left;
//   3. the raw file: every stream inflated (zlib), searched for the term (as text, hex-encoded and UTF-16BE);
//   4. the redacted page drawn by pdftoppm at 300 dpi and read by Tesseract (this machine): no term left in the picture
//      (and the control: Tesseract DOES read it on the original page).
// Also says what is kept: text of the other pages, links, file size.
//   node scripts/p33/redact-truth.mjs <origin> [--browser=webkit|chromium] [--device=iphone|desktop]
//        [--pdf=…] [--terms="photo-2"] [--force-server] (iPhone: __localPageLimitMs=1, needs --route-origin)
//        [--route-origin=http://127.0.0.1:3498]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'webkit');
const device = arg('device', 'iphone');
const PDF = arg('pdf') || path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const terms = arg('terms', 'photo-2').split('|');
const forceServer = process.argv.includes('--force-server');
const routeOrigin = arg('route-origin');
const TESS = process.env.TESSERACT_BIN || 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
const OUT = path.join(os.tmpdir(), 'p33-redact-truth');
fs.mkdirSync(OUT, { recursive: true });
const tag = `${engine} [${device}]${forceServer ? ' server-drawn' : ''} ${path.basename(PDF)}`;
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const norm = (s) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');

// ---- 0. run the page ----
const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } } : {}) });
if (routeOrigin) await ctx.addInitScript((o) => { const f = window.fetch.bind(window); window.fetch = (u, init) => f(typeof u === 'string' && u.startsWith('/api/pdf-render') ? o + u : u, init); }, routeOrigin);
const p = await ctx.newPage();
if (forceServer) await p.addInitScript(() => { window.__localPageLimitMs = 1; });
await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(PDF);
await p.locator('#rd-terms').fill(terms.join('\n'));
const progress = new Set();
const t0 = Date.now();
await p.getByRole('button', { name: 'Redact PDF' }).click();
for (let s = 0; s < 240; s++) {
  const st = await p.evaluate(() => ({ pr: document.querySelector('[data-redact-progress]')?.innerText || '', done: !!document.querySelector('[data-summary], p[role=alert]') }));
  if (st.pr) progress.add(st.pr);
  if (st.done) break;
  await p.waitForTimeout(250);
}
const summary = await p.locator('[data-summary]').innerText().catch(() => '');
const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
check(`summary in ${Date.now() - t0} ms: "${summary.slice(0, 160)}"`, !!summary && !alert, alert);
check(`progress shown (${[...progress].join(' / ').slice(0, 200)})`, progress.size >= 1);
const out = path.join(OUT, `redacted-${engine}-${device}${forceServer ? '-server' : ''}-${path.basename(PDF)}`);
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
await dl.saveAs(out);
await b.close();
const hitPages = (/\(([^)]*)\)/.exec(summary)?.[1] || '').split(', ').map((x) => Number(/page (\d+)/.exec(x)?.[1])).filter(Boolean);

// ---- 1. pdftotext ----
const pdftotext = (f, pg) => execFileSync('pdftotext', ['-f', String(pg), '-l', String(pg), f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
const pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [out]).toString())[1]);
const srcPages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [PDF]).toString())[1]);
check(`same page count (${pages})`, pages === srcPages);
const poppler = Array.from({ length: pages }, (_, i) => pdftotext(out, i + 1));
for (const t of terms) check(`pdftotext: "${t}" nowhere`, !poppler.some((x) => norm(x).includes(norm(t))), poppler.join(' | ').slice(0, 200));

// ---- 2. PDF.js ----
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(out)), standardFontDataUrl: path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/' }).promise;
const pdfjsText = [];
let links = 0;
for (let i = 1; i <= doc.numPages; i++) {
  const pg = await doc.getPage(i);
  const tc = await pg.getTextContent();
  const an = await pg.getAnnotations();
  links += an.filter((a) => a.subtype === 'Link').length;
  pdfjsText.push(tc.items.map((x) => x.str).join(' ') + ' ' + an.map((a) => [a.fieldValue, a.contentsObj?.str, a.url].filter(Boolean).join(' ')).join(' '));
}
for (const t of terms) check(`PDF.js text + annotations: "${t}" nowhere`, !pdfjsText.some((x) => norm(x).includes(norm(t))));

// ---- 3. raw bytes, every stream inflated ----
const raw = fs.readFileSync(out);
const chunks = [raw.toString('latin1')];
for (let i = raw.indexOf('stream'); i >= 0; i = raw.indexOf('stream', i + 6)) {
  let s = i + 6;
  if (raw[s] === 13) s++;
  if (raw[s] === 10) s++;
  const e = raw.indexOf('endstream', s);
  if (e < 0) break;
  try { chunks.push(zlib.inflateSync(raw.subarray(s, e)).toString('latin1')); } catch { /* not flate (image) */ }
}
const blob = chunks.join('\n');
for (const t of terms) {
  const hex = Buffer.from(t, 'latin1').toString('hex');
  const u16 = Buffer.from(t, 'utf16le').swap16().toString('hex');
  check(`raw file (${chunks.length - 1} streams inflated): "${t}" not as text, hex or UTF-16`, !blob.toLowerCase().includes(t.toLowerCase()) && !blob.toLowerCase().includes(hex) && !blob.toLowerCase().includes(u16));
}

// ---- 4. the picture of each redacted page, read by Tesseract ----
const ocrPage = (f, pg, name) => {
  const base = path.join(OUT, name);
  execFileSync('pdftoppm', ['-r', '300', '-f', String(pg), '-l', String(pg), '-singlefile', '-gray', '-png', f, base]);
  execFileSync(TESS, [`${base}.png`, base, '-l', 'eng'], { stdio: 'ignore' });
  return fs.readFileSync(`${base}.txt`, 'utf8');
};
for (const pg of hitPages) {
  const before = ocrPage(PDF, pg, `orig-p${pg}`);
  const after = ocrPage(out, pg, `red-p${pg}`);
  for (const t of terms) {
    const control = norm(before).includes(norm(t));
    check(`page ${pg} picture: Tesseract reads "${t}" on the original (control: ${control}) and NOT on the redacted page`, !norm(after).includes(norm(t)), after.slice(0, 200));
  }
  const rest = norm(before).replace(new RegExp(terms.map((t) => norm(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g'), '');
  const kept = [...new Set(rest.split(/[^a-z0-9]+/).filter((w) => w.length >= 4))];
  const seen = kept.filter((w) => norm(after).includes(w));
  console.log(`  page ${pg}: ${seen.length}/${kept.length} other words still readable in the picture`);
}

// ---- what is kept ----
const srcPoppler = Array.from({ length: srcPages }, (_, i) => pdftotext(PDF, i + 1));
const keptText = srcPoppler.map((x, i) => (hitPages.includes(i + 1) ? null : norm(x) === norm(poppler[i]))).filter((x) => x !== null);
check(`pages without a match keep their text exactly (${keptText.filter(Boolean).length}/${keptText.length})`, keptText.every(Boolean));
console.log(`  kept: links ${links}; size ${fs.statSync(PDF).size} → ${fs.statSync(out).size} B; redacted pages ${hitPages.join(', ')} have ${hitPages.map((pg) => poppler[pg - 1].trim().length).join(', ')} characters of selectable text`);
console.log(`\n${tag}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
