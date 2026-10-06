// P37 (06/10) — the black boxes of PDF Redact computed IN A BROWSER (Chromium or WebKit) with the page's own code,
// without a Next build: a small local server gives PDF.js (node_modules/pdfjs-dist) and app/lib/pdfRedact.js to a
// blank page, which does what pass 2 of app/tools/pdf-tools/pdf-redact/page.jsx does — draw the page at scale 2,
// pageGlyphGeometry with canvasInk (the glyph ink read from the browser's own drawing), redactionQuads +
// glyphTermQuads, paint the boxes — and hands the picture back. It is checked as scripts/p37/redact-real-page.mjs
// checks the real page's file: every ink pixel of the match black, neighbour ink blackened at most the margin
// max(2 % of the font size, 0.5 pt) + 0.5 pt, as redact-real-page.mjs.
// Fixtures: scripts/p37/redact-box-fit.test.mjs --keep (%TEMP%\p37-box-fit; red text, so a black box and the ink are
// told apart).
//   node scripts/p37/redact-canvas-check.mjs [--browser=chromium|webkit] [--only=id,id]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const engine = arg('browser', 'chromium');
const lib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdf-lib/cjs/index.js')).href).then((m) => m.default || m);
const BOX = path.join(os.tmpdir(), 'p37-box-fit');
const OUT = path.join(os.tmpdir(), `p37-canvas-check-${engine}`);
fs.mkdirSync(OUT, { recursive: true });

// fixtures: id → { dir, fontSize, term }
const jobs = [];
if (fs.existsSync(path.join(BOX, 'variants.json'))) for (const [id, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(BOX, 'variants.json'), 'utf8')))) jobs.push({ id, dir: BOX, ...v });
// --review: the second review's red fixtures (RED=1 scripts/p37/review/fit-adversarial.mjs, ocr-scan.mjs, ocr-variants.mjs;
// %TEMP%\p37-review-redact\fit-red and ocr-red), as scripts/p37/review/real-page-review.mjs runs them on the real page:
// the match's ink must be black (coverage only)
const RV = path.join(os.tmpdir(), 'p37-review-redact');
if (process.argv.includes('--review')) {
  const FIT = ['stroke-tr2-w2-24', 'stroke-tr1-w3-36', 'stroke-tr2-w1-12', 'negative-font-size', 'flipped-ctm-generator', 'shear-synthetic-italic', 'shadow-offset-2pt', 'fake-bold-double-0.4', 'tz-300-tc-neg', 'rise-inside-match', 'type0-narrow-widths', 'type0-accents-stacked', 'ligature-calibri', 'italic-ttf-overhang', 'type3-overhang', 'type3-bbox-too-small', 'type3-bbox-zero'];
  const TERM = { 'type0-accents-stacked': 'ỄỂỆphô', 'ligature-calibri': 'fice', 'italic-ttf-overhang': 'fjfjf' };
  for (const id of FIT) jobs.push({ id: `review-${id}`, full: path.join(RV, 'fit-red', `${id}-full.pdf`), match: path.join(RV, 'fit-red', `${id}-match.pdf`), term: TERM[id] || 'photo-2' });
  for (const [id, full, match, term] of [['ocr-times12', 'times12-ocr', 'times12-match', 'photography'], ['ocr-times12-sub', 'times12-sub-ocr', 'times12-sub-match', 'graph'], ['ocr-under-image', 'times12-ocr-under-image', 'times12-match', 'photography'], ['ocr-alpha-0', 'times12-ocr-alpha-0', 'times12-match', 'photography']]) jobs.push({ id: `review-${id}`, full: path.join(RV, 'ocr-red', `${full}.pdf`), match: path.join(RV, 'ocr-red', `${match}.pdf`), term });
}
const only = arg('only') ? arg('only').split(',') : null;

const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.html': 'text/html', '.pdf': 'application/pdf', '.pfb': 'application/octet-stream', '.ttf': 'font/ttf', '.wasm': 'application/wasm' };
const PAGE = `<!doctype html><meta charset="utf-8"><body><script type="module">
import * as pdfjs from '/nm/pdfjs-dist/legacy/build/pdf.mjs';
import * as R from '/lib/pdfRedact.js';
pdfjs.GlobalWorkerOptions.workerSrc = '/nm/pdfjs-dist/legacy/build/pdf.worker.mjs';
window.run = async (url, term) => {
  const doc = await pdfjs.getDocument({ url, standardFontDataUrl: '/nm/pdfjs-dist/standard_fonts/', cMapUrl: '/nm/pdfjs-dist/cmaps/', cMapPacked: true }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const items = content.items.filter((it) => typeof it.str === 'string');
  const spans = R.matchSpans(items.map((it) => it.str), term);
  const viewport = page.getViewport({ scale: 2, rotation: 0 });
  const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  const ic = document.createElement('canvas'); ic.width = 400; ic.height = 400;
  const inkOf = R.canvasInk(ic.getContext('2d', { willReadFrequently: true }));
  const geo = await R.pageGlyphGeometry(page, pdfjs, items, content.styles, inkOf);
  const measure = document.createElement('canvas').getContext('2d');
  const measureOf = () => ({ real: false, width: (s) => { measure.font = '100px sans-serif'; return measure.measureText(s).width; } });
  const px = 1 / viewport.scale;
  const quads = [...R.redactionQuads(items, content.styles, spans, [], measureOf, geo.geometry, px), ...R.glyphTermQuads(geo.glyphs, [term], inkOf, px)];
  ctx.fillStyle = '#000000';
  for (const q of quads) { ctx.beginPath(); q.forEach(([x, y], n) => { const [vx, vy] = viewport.convertToViewportPoint(x, y); if (n) ctx.lineTo(vx, vy); else ctx.moveTo(vx, vy); }); ctx.closePath(); ctx.fill(); }
  const unit = page.getViewport({ scale: 1, rotation: 0 });
  return { png: canvas.toDataURL('image/png'), w: unit.width, h: unit.height, rotate: page.rotate, spans: spans.length, exact: spans.filter((sp) => geo.geometry[sp.k]).length };
};
</script>`;
const server = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  let f = null;
  if (u === '/') { r.writeHead(200, { 'content-type': 'text/html' }); r.end(PAGE); return; }
  if (u.startsWith('/nm/pdfjs-dist/')) f = path.join(ROOT, 'node_modules', u.slice(4));
  else if (u === '/lib/pdfRedact.js') f = path.join(ROOT, 'app/lib/pdfRedact.js');
  else if (u.startsWith('/fx/')) { const [, , d, name] = u.split('/'); if (d === 'box') f = path.join(BOX, name); else if (d === 'rv') f = path.join(RV, decodeURIComponent(name)); }
  if (!f || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
  r.end(fs.readFileSync(f));
}).listen(0, '127.0.0.1');
await new Promise((res) => server.once('listening', res));
const origin = `http://127.0.0.1:${server.address().port}`;

function picture(file, color) {
  const base = path.join(OUT, `${path.basename(file, '.pdf')}-${color ? 'rgb' : 'grey'}`);
  execFileSync('pdftoppm', ['-r', '288', ...(color ? [] : ['-gray']), '-singlefile', file, base], { stdio: 'ignore' });
  const fn = `${base}.${color ? 'ppm' : 'pgm'}`;
  const buf = fs.readFileSync(fn);
  let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(buf[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) s += String.fromCharCode(buf[pos++]); tok.push(s); }
  pos++;
  fs.rmSync(fn);
  return { w: +tok[1], h: +tok[2], px: buf.subarray(pos) };
}

const b = await { chromium, webkit }[engine].launch();
const p = await b.newPage();
await p.goto(origin);
await p.waitForFunction(() => window.run);
let fails = 0;
for (const j of jobs.filter((x) => !only || only.includes(x.id))) {
  const name = j.id;
  const r = await p.evaluate(([u, t]) => window.run(u, t), [j.full ? `/fx/rv/${encodeURIComponent(path.relative(RV, j.full))}` : `/fx/box/${name}-full.pdf`, j.term]);
  const d = await lib.PDFDocument.create();
  const img = await d.embedPng(Buffer.from(r.png.split(',')[1], 'base64'));
  const pg = d.addPage([r.w, r.h]);
  pg.drawImage(img, { x: 0, y: 0, width: r.w, height: r.h });
  if (r.rotate) pg.setRotation(lib.degrees(r.rotate));
  const out = path.join(OUT, `${j.id.replace(/\//g, '_')}-boxes.pdf`);
  fs.writeFileSync(out, await d.save());
  const res = picture(out, true), m = picture(j.match || path.join(j.dir, `${name}-match.pdf`), false), o = j.full ? null : picture(path.join(j.dir, `${name}-others.pdf`), false);
  if (res.w !== m.w || res.h !== m.h) { fails++; console.log(`FAIL ${engine} ${j.id}: picture sizes differ`); continue; }
  const black = (i) => res.px[3 * i] < 90 && res.px[3 * i + 1] < 90 && res.px[3 * i + 2] < 90;
  let ink = 0, uncovered = 0, nb = 0, deep = 0, where = null;
  for (let i = 0; i < m.w * m.h; i++) {
    if (m.px[i] < 128) { ink++; if (!black(i)) uncovered++; }
    if (o && o.px[i] < 128 && black(i)) {
      nb++;
      const x = i % m.w, y = (i / m.w) | 0;
      let dd = 40;
      for (let rr = 1; rr < dd; rr++) { let hit = false; for (let dx = -rr; dx <= rr && !hit; dx++) for (const dy of [-rr, rr]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < m.w && Y < m.h && !black(Y * m.w + X)) { hit = true; break; } } for (let dy = -rr; dy <= rr && !hit; dy++) for (const dx of [-rr, rr]) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < m.w && Y < m.h && !black(Y * m.w + X)) { hit = true; break; } } if (hit) { dd = rr; break; } }
      if (dd / 4 > deep) { deep = dd / 4; where = [x / 4, y / 4]; }
    }
  }
  const allowed = Math.max(0.02 * (j.fontSize || 12), 0.5) + 0.5;
  const ok = ink > 0 && uncovered === 0 && deep <= allowed;
  if (!ok) fails++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${engine} ${j.id}: spans ${r.spans} (exact ${r.exact}); match ink ${ink} px, not black ${uncovered}; neighbour ink blackened ${nb} px, deepest ${deep.toFixed(2)} pt (allowed ${allowed.toFixed(2)})${where ? ` at ${where.map((v) => v.toFixed(1)).join(',')}` : ''}`);
}
await b.close();
server.close();
console.log(`\n${engine}: ${fails ? `${fails} FAIL` : 'all PASS'}`);
process.exit(fails ? 1 : 0);
