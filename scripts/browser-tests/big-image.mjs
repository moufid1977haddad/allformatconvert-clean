// Image Converter on photos beyond Safari iOS's 16.7 MP canvas limit (owner's iPhone, 30/09): 12.2 MP, 24 MP
// (EXIF-rotated, as iPhone portrait shots are) and 48 MP, plus a big transparent PNG. Each download is reopened
// with sharp: real format, size as displayed (rotation applied), pixels compared with the source (PSNR).
// Desktop browsers use one canvas; --bands forces the iPhone path (band decode + WebAssembly encoders).
// P23 (02/10): brought up to date — the result is the shared FileDownload row ([data-file-download], read in the page,
// staged /zipdl/ link on iPhone / iPad), the format is chosen by its label; --device=iphone|ipad gives the phone's
// user agent and touch (so the 50 MP phone limit applies). This is also the bench of the only cause found in the
// visitors' errors (tool_errors, D2): on 28/09 an iPhone's 12 MP photos were refused "more than the 12-megapixel
// limit" (fixed by cd0c2ad9 on 29/09: 50 MP on a phone): the 12.2 MP case must convert with --device=iphone.
// Usage: node scripts/browser-tests/big-image.mjs <origin> [--browser=firefox|webkit] [--only=fmt,fmt] [--sizes=12,24,48,20] [--bands] [--device=iphone|ipad]
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

const device = arg('device');
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15',
};
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device ? { userAgent: UA[device], hasTouch: true, viewport: device === 'iphone' ? { width: 390, height: 844 } : { width: 820, height: 1180 } } : {}) });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
if (device) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5, configurable: true }); });
await applyIosCanvasCap(ctx); // P16: the iPhone's canvas limit, always (lib/ios-canvas-cap.mjs)
// --bands: the iPhone path (no canvas over 16.7 MP) forced, in a browser that could have used one big canvas
if (process.argv.includes('--bands')) await ctx.addInitScript(() => { window.__forceBands = true; });
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
// Bytes of the first result, read in the page (blob: link, or the staged /zipdl/ link served from Cache Storage)
async function resultBytes(p) {
  const n = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await (async () => { for (let i = 0; i < 100 && !a.getAttribute('href'); i++) await new Promise((r) => setTimeout(r, 100)); return fetch(a.href); })();
    window.__res = new Uint8Array(await res.arrayBuffer()); return window.__res.length;
  });
  const parts = [];
  for (let o = 0; o < n; o += 8e6) parts.push(Buffer.from(await p.evaluate(([o]) => { let s = ''; const u = window.__res.subarray(o, o + 8e6); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); }, [o]), 'base64'));
  return Buffer.concat(parts);
}
async function convert(file, fmt) {
  const page = await ctx.newPage();
  try {
    await page.goto(origin + '/tools/image-tools/image-converter', { waitUntil: 'load' });
    await page.waitForTimeout(800);
    await page.locator('input[type=file]').first().setInputFiles(file);
    await page.getByLabel('Output format').selectOption(fmt);
    const t0 = Date.now();
    await page.getByRole('button', { name: /^Convert \d+ file/ }).click();
    const r = await Promise.race([
      page.locator('[data-file-download]').first().waitFor({ timeout: 600000 }).then(() => 'ok'),
      page.getByText(/failed to convert|megapixel limit/).first().waitFor({ timeout: 600000 }).then(() => 'error'),
    ]).catch(() => 'timeout');
    if (r !== 'ok') return { error: r === 'timeout' ? 'no result after 10 min' : (await page.locator('main').innerText()).match(/(failed to convert|megapixel limit)[\s\S]{0,300}/)?.[0].replace(/\n/g, ' | ') || 'error' };
    const secs = (Date.now() - t0) / 1000;
    if (device) await page.locator('[data-file-download] [data-download][data-retyped="1"]').first().waitFor({ timeout: 15000 }).catch(() => {});
    const name = await page.locator('[data-file-download]').first().getAttribute('data-name');
    return { buf: await resultBytes(page), name, secs };
  } finally { await page.close(); }
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
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()}${device ? ' ' + device : ''})`); process.exit(fails ? 1 : 0);
