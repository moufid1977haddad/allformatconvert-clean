// P37 (06/10) — PDF Redact on the REAL page (production build, Playwright): the two P37 changes checked on the
// browser's own drawing and measures.
//  1. Box fit: each fixture of scripts/p37/redact-box-fit.test.mjs (run it first with --keep: %TEMP%\p37-box-fit; red
//     text) is redacted ("photo-2"; "مارس" for the Arabic one), the downloaded file drawn by Poppler at 288 dpi in
//     colour, and compared with Poppler's drawing of the match alone and of its neighbours alone:
//       - every ink pixel of the match must be black in the result (covered);
//       - neighbour ink turned black: how many pixels, and how deep inside the black (pt); must be at most the stated
//         margin, max(2 % of the font size, one pixel of the page's picture = 0.5 pt), + 0.5 pt (one pixel of the
//         result's 144 dpi picture).
//  2. Arabic layer: the graded fixtures of scripts/p37/redact-arabic-layer.test.mjs (%TEMP%\p37-arabic, made by
//     scripts/p37/make-arabic-fixtures.mjs): "مارس" must be absent (pdftotext, PDF.js, raw streams) and the other lines
//     present in reading order (pdftotext and PDF.js).
//   node scripts/p37/redact-real-page.mjs <origin> [--browser=chromium|webkit] [--device=desktop|iphone]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'chromium');
const device = arg('device', 'desktop');
const BOX = path.join(os.tmpdir(), 'p37-box-fit'), AR = path.join(os.tmpdir(), 'p37-arabic');
const OUT = path.join(os.tmpdir(), `p37-real-page-${engine}-${device}`);
fs.mkdirSync(OUT, { recursive: true });
const pdfjs = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
let fails = 0;
const check = (ok, line) => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${line}`); };

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } } : {}) });
async function runPage(pdf, term, out) {
  const p = await ctx.newPage();
  try {
    await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
    await p.waitForTimeout(500);
    await p.locator('input[type=file]').first().setInputFiles(pdf);
    await p.locator('#rd-terms').fill(term);
    await p.getByRole('button', { name: 'Redact PDF' }).click();
    await p.waitForSelector('[data-summary], p[role=alert]', { timeout: 180000 });
    const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
    if (alert) return { error: alert.slice(0, 200) };
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
    await dl.saveAs(out);
    return { summary: await p.locator('[data-summary]').innerText() };
  } finally { await p.close(); }
}

// ---- pictures: Poppler at 288 dpi; PGM (grey) or PPM (colour) ----
function picture(file, color) {
  const base = path.join(OUT, `${path.basename(file, '.pdf')}-${color ? 'rgb' : 'grey'}`);
  execFileSync('pdftoppm', ['-r', '288', ...(color ? [] : ['-gray']), '-singlefile', file, base], { stdio: 'ignore' });
  const f = `${base}.${color ? 'ppm' : 'pgm'}`;
  const buf = fs.readFileSync(f);
  let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(buf[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]); tok.push(s); }
  pos++;
  fs.rmSync(f);
  return { w: +tok[1], h: +tok[2], ch: color ? 3 : 1, px: buf.subarray(pos) };
}

const META = fs.existsSync(path.join(BOX, 'variants.json')) ? JSON.parse(fs.readFileSync(path.join(BOX, 'variants.json'), 'utf8')) : {};
const VARIANTS = Object.keys(META);
if (!VARIANTS.length) check(false, `no box-fit fixtures in ${BOX}: run node scripts/p37/redact-box-fit.test.mjs --keep first`);
for (const id of VARIANTS) {
  const { term, fontSize } = META[id];
  const out = path.join(OUT, `${id}-redacted.pdf`);
  const r = await runPage(path.join(BOX, `${id}-full.pdf`), term, out);
  if (r.error) { check(false, `${engine} ${id}: ${r.error}`); continue; }
  const res = picture(out, true), m = picture(path.join(BOX, `${id}-match.pdf`), false), o = picture(path.join(BOX, `${id}-others.pdf`), false);
  if (res.w !== m.w || res.h !== m.h) { check(false, `${engine} ${id}: picture sizes differ (${res.w}×${res.h} vs ${m.w}×${m.h})`); continue; }
  const black = (i) => res.px[3 * i] < 90 && res.px[3 * i + 1] < 90 && res.px[3 * i + 2] < 90;
  let ink = 0, uncovered = 0, nb = 0, deep = 0;
  for (let i = 0; i < m.w * m.h; i++) {
    if (m.px[i] < 128) { ink++; if (!black(i)) uncovered++; }
    if (o.px[i] < 128 && black(i)) {
      nb++;
      // depth: distance to the nearest pixel that is not black, searched up to 40 px (10 pt)
      const x = i % m.w, y = (i / m.w) | 0;
      let d = 40;
      for (let rr = 1; rr < d; rr++) { let hit = false; for (let dx = -rr; dx <= rr && !hit; dx++) for (const dy of [-rr, rr]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < m.w && Y < m.h && !black(Y * m.w + X)) { hit = true; break; } } for (let dy = -rr; dy <= rr && !hit; dy++) for (const dx of [-rr, rr]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < m.w && Y < m.h && !black(Y * m.w + X)) { hit = true; break; } } if (hit) { d = rr; break; } }
      deep = Math.max(deep, d / 4);
    }
  }
  const allowed = Math.max(0.02 * fontSize, 0.5) + 0.5;
  check(uncovered === 0 && deep <= allowed, `${engine} ${id}: match ink ${ink} px, not black ${uncovered}; neighbour ink blackened ${nb} px, deepest ${deep.toFixed(2)} pt (allowed ${allowed.toFixed(2)})`);
}

// ---- Arabic layer ----
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, '');
const WORD = 'مارس';
const LINES = fs.existsSync(path.join(AR, 'lines.json')) ? JSON.parse(fs.readFileSync(path.join(AR, 'lines.json'), 'utf8')) : [];
const pieces = LINES.filter((l) => !/[ً-ْ]/.test(l)).flatMap((l) => (l.includes(WORD) ? l.split(WORD).map((s) => s.trim()).filter(Boolean) : [l]));
if (!LINES.length) check(false, `no Arabic fixtures in ${AR}: run node scripts/p37/make-arabic-fixtures.mjs first`);
for (const name of LINES.length ? ['lo-Arial', 'lo-Tahoma', 'lo-TimesNewRoman', 'lo-SegoeUI'] : []) {
  const src = path.join(AR, `${name}.pdf`);
  if (!fs.existsSync(src)) { check(false, `${engine} ${name}: missing`); continue; }
  const out = path.join(OUT, `ar-${name}-redacted.pdf`);
  const r = await runPage(src, WORD, out);
  if (r.error) { check(false, `${engine} ${name}: ${r.error}`); continue; }
  const pt = execFileSync('pdftotext', ['-enc', 'UTF-8', out, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const d = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(out)), standardFontDataUrl: SFD, verbosity: 0 }).promise;
  let pj = '';
  for (let i = 1; i <= d.numPages; i++) for (const it of (await (await d.getPage(i)).getTextContent()).items) pj += it.str + (it.hasEOL ? '\n' : ' ');
  await d.destroy();
  const raw = fs.readFileSync(out); const chunks = [raw.toString('latin1')];
  for (let i = raw.indexOf('stream'); i >= 0; i = raw.indexOf('stream', i + 6)) { let s = i + 6; if (raw[s] === 13) s++; if (raw[s] === 10) s++; const e = raw.indexOf('endstream', s); if (e < 0) break; try { chunks.push(zlib.inflateSync(raw.subarray(s, e)).toString('latin1')); } catch { /* not flate */ } }
  const blob = chunks.join('\n');
  const rawHit = [WORD, [...WORD].reverse().join('')].some((w) => blob.includes(Buffer.from(w, 'utf8').toString('latin1')) || blob.toLowerCase().includes(Buffer.from(w, 'utf16le').swap16().toString('hex')));
  const has = (text) => { const ls = text.split(/\r?\n/).map(N); return pieces.filter((p) => ls.some((l) => l.includes(N(p)))).length; };
  const gone = !N(pt).includes(WORD) && !N(pj).includes(WORD) && !rawHit;
  const np = has(pt), nj = has(pj);
  check(gone && np === pieces.length && nj === pieces.length, `${engine} ${name}: "${WORD}" gone ${gone}; lines in reading order: pdftotext ${np}/${pieces.length}, PDF.js ${nj}/${pieces.length}; summary: ${r.summary.slice(0, 120)}`);
}
await b.close();
console.log(`\n${engine} [${device}]: ${fails ? `${fails} FAIL` : 'all PASS'}`);
process.exit(fails ? 1 : 0);
