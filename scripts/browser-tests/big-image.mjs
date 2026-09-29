// Image Converter on photos beyond Safari iOS's 16.7 MP canvas limit (owner's iPhone, 30/09): 12.2 MP, 24 MP
// (EXIF-rotated, as iPhone portrait shots are) and 48 MP, plus a big transparent PNG. Each download is reopened
// with sharp: real format, size as displayed (rotation applied), pixels compared with the source (PSNR).
// Desktop browsers use one canvas; --bands forces the iPhone path (band decode + WebAssembly encoders).
// Usage: node scripts/browser-tests/big-image.mjs <origin> [--browser=firefox|webkit] [--only=fmt,fmt] [--sizes=12,24,48,20] [--bands]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { iosCanvasCapInit, applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const engine = arg('browser') === 'firefox' ? firefox : arg('browser') === 'webkit' ? webkit : chromium;
const only = arg('only')?.split(',');
const sizes = (arg('sizes') || '12,24,48').split(',').map(Number);
const dir = path.join(os.tmpdir(), 'big-image-fixtures'); fs.mkdirSync(dir, { recursive: true });

async function photo(w, h, orientation, file) {
  const p = path.join(dir, file);
  if (fs.existsSync(p)) return p;
  // photo-like: smooth gradients + mild grain + a few hard edges, so both lossy and lossless encoders have work
  const raw = Buffer.alloc(w * h * 3);
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 3, g = (rnd() - 0.5) * 12;
    raw[i] = Math.min(255, Math.max(0, 255 * x / w + g)); raw[i + 1] = Math.min(255, Math.max(0, 255 * y / h + g));
    raw[i + 2] = ((x >> 8) + (y >> 8)) % 2 ? 200 : 60;
  }
  // top-left marker (so a wrong rotation or mirrored band shows): 1/8 of the width, pure green
  for (let y = 0; y < h / 8; y++) for (let x = 0; x < w / 8; x++) { const i = (y * w + x) * 3; raw[i] = 0; raw[i + 1] = 255; raw[i + 2] = 0; }
  let s = sharp(raw, { raw: { width: w, height: h, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 92 });
  if (orientation) s = s.withMetadata({ orientation });
  fs.writeFileSync(p, await s.toBuffer());
  return p;
}
async function transparentPng(w, h, file) {
  const p = path.join(dir, file);
  if (fs.existsSync(p)) return p;
  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, d = Math.hypot(x - w / 2, y - h / 2) / (h / 2); raw[i] = 255 * x / w; raw[i + 1] = 80; raw[i + 2] = 255 * y / h; raw[i + 3] = d < 0.8 ? 255 : d < 1 ? 255 * (1 - d) / 0.2 : 0; }
  fs.writeFileSync(p, await sharp(raw, { raw: { width: w, height: h, channels: 4 }, limitInputPixels: false }).png({ compressionLevel: 3 }).toBuffer());
  return p;
}
async function psnr(src, buf) {
  const A = await sharp(src, { limitInputPixels: false }).rotate().flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(buf, { limitInputPixels: false }).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return -1;
  let se = 0; for (let i = 0; i < A.data.length; i++) se += (A.data[i] - B.data[i]) ** 2;
  return 10 * Math.log10(255 * 255 / (se / A.data.length));
}

const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await applyIosCanvasCap(ctx); // P16: the iPhone's canvas limit, always (lib/ios-canvas-cap.mjs)
// --bands: the iPhone path (no canvas over 16.7 MP) forced, in a browser that could have used one big canvas
if (process.argv.includes('--bands')) await ctx.addInitScript(() => { window.__forceBands = true; });
const page = await ctx.newPage();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function convert(file, fmt) {
  await page.goto(origin + '/tools/image-tools/image-converter', { waitUntil: 'networkidle' });
  const decoded = page.waitForEvent('console', { predicate: () => false, timeout: 1 }).catch(() => {});
  await page.locator('input[type=file]').setInputFiles(file);
  await page.locator('select').filter({ has: page.locator('option[value="ico"]') }).selectOption(fmt);
  const t0 = Date.now();
  await page.getByRole('button', { name: /^Convert \d+ file/ }).click();
  const btn = page.locator('div.bg-green-50 button', { hasText: 'Download' }).first();
  const err = page.locator('p.text-red-500');
  await Promise.race([btn.waitFor({ timeout: 600000 }), err.waitFor({ timeout: 600000 })]);
  if (await err.count()) return { error: await err.innerText() };
  const secs = (Date.now() - t0) / 1000;
  const [dl] = await Promise.all([page.waitForEvent('download'), btn.click()]);
  return { buf: fs.readFileSync(await dl.path()), name: dl.suggestedFilename(), secs };
}
const fixtures = [];
if (sizes.includes(12)) fixtures.push({ label: '12.2 MP iPhone', file: await photo(4032, 3024, 0, 'p12.jpg'), w: 4032, h: 3024 });
if (sizes.includes(24)) fixtures.push({ label: '24 MP rotated (EXIF 6)', file: await photo(5712, 4284, 6, 'p24-rot6.jpg'), w: 4284, h: 5712 });
if (sizes.includes(48)) fixtures.push({ label: '48 MP', file: await photo(8064, 6048, 0, 'p48.jpg'), w: 8064, h: 6048 });
if (sizes.includes(20)) fixtures.push({ label: '20 MP transparent PNG', file: await transparentPng(5000, 4000, 't20.png'), w: 5000, h: 4000, alpha: true });
const FMT = { webp: 'webp', jpg: 'jpeg', png: 'png', avif: 'heif', gif: 'gif', tiff: 'tiff', bmp: null, pdf: null, ico: null };
for (const f of fixtures) {
  for (const fmt of only || ['webp', 'jpg', 'png', 'avif', 'tiff', 'pdf', 'ico']) {
    const r = await convert(f.file, fmt);
    if (r.error) { check(`${f.label} -> ${fmt}`, false, r.error.replace(/\n/g, ' | ')); continue; }
    if (fmt === 'pdf') { const d = await PDFDocument.load(r.buf); const s = d.getPage(0).getSize(); check(`${f.label} -> pdf`, Math.round(s.width) === f.w && Math.round(s.height) === f.h, `${s.width}x${s.height} pt, ${(r.buf.length / 1e6).toFixed(1)} MB, ${r.secs.toFixed(1)} s`); continue; }
    if (fmt === 'ico') { const n = r.buf.readUInt16LE(4); check(`${f.label} -> ico`, r.buf.readUInt16LE(2) === 1 && n === 6, `${n} sizes, ${r.secs.toFixed(1)} s`); continue; }
    const m = await sharp(r.buf, { limitInputPixels: false }).metadata();
    const p = await psnr(f.file, r.buf);
    const ext = r.name.split('.').pop();
    const min = fmt === 'png' || fmt === 'tiff' ? (f.alpha ? 55 : 60) : 28; // alpha: canvas premultiplication rounding on the soft edge
    // green marker at the top-left of the image as displayed
    const px = await sharp(r.buf, { limitInputPixels: false }).extract({ left: 5, top: 5, width: 1, height: 1 }).raw().toBuffer();
    check(`${f.label} -> ${fmt}`, m.format === FMT[fmt] && m.width === f.w && m.height === f.h && p >= min && ext === (fmt === 'jpg' ? 'jpg' : fmt) && (f.alpha || (px[1] > 200 && px[0] < 60)),
      `${m.format} ${m.width}x${m.height}, PSNR ${p.toFixed(1)} dB, ${(r.buf.length / 1e6).toFixed(1)} MB, ${r.secs.toFixed(1)} s, .${ext}`);
  }
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
