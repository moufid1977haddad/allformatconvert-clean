// Image Resizer, result bigger than iOS's 16.7 MP canvas limit (30/09): a 48 MP photo resized to 7000 px wide
// (36.75 MP). Normal path, then the iPhone path (window.__forceSafariCanvasCap: bands, no canvas over the cap); both
// must give a 7000x5250 JPEG, and the same pixels (PSNR between them), plus a WebP source kept WebP.
// Usage: node scripts/browser-tests/image-resizer-big.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iosCanvasCapInit, applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = path.join(os.tmpdir(), 'resizer-big'); fs.mkdirSync(dir, { recursive: true });
const W = 8064, H = 6048;
const src = path.join(dir, 'p48.jpg');
if (!fs.existsSync(src)) {
  const raw = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[i] = (x * 255 / W) | 0; raw[i + 1] = (y * 255 / H) | 0; raw[i + 2] = ((x >> 7) + (y >> 7)) % 2 ? 200 : 40; }
  fs.writeFileSync(src, await sharp(raw, { raw: { width: W, height: H, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 90 }).toBuffer());
}
const webp = path.join(dir, 'p20.webp');
if (!fs.existsSync(webp)) fs.writeFileSync(webp, await sharp(src, { limitInputPixels: false }).resize(5200, 3900).webp({ quality: 85 }).toBuffer());
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function resize(file, width, ios) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (ios) await ctx.addInitScript(iosCanvasCapInit);
  const p = await ctx.newPage();
  await p.goto(origin + '/tools/image-tools/image-resizer', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(file);
  const wField = p.locator('input[type=number]').first();
  await wField.waitFor(); await p.waitForFunction(() => !document.querySelector('input[type=number]').disabled);
  await wField.fill(String(width));
  const t0 = Date.now();
  await p.getByRole('button', { name: 'Resize', exact: true }).click();
  const link = p.getByRole('link', { name: 'Download' });
  await link.waitFor({ timeout: 300000 });
  const [dl] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const out = path.join(dir, `${ios ? 'ios' : 'n'}-${Date.now()}-${dl.suggestedFilename()}`); await dl.saveAs(out);
  await ctx.close();
  return { out, name: dl.suggestedFilename(), secs: (Date.now() - t0) / 1000 };
}
async function psnr(a, c) {
  const A = await sharp(a, { limitInputPixels: false }).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(c, { limitInputPixels: false }).raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return -1;
  let se = 0; for (let i = 0; i < A.data.length; i++) se += (A.data[i] - B.data[i]) ** 2;
  return 10 * Math.log10(255 * 255 / (se / A.data.length));
}
const n = await resize(src, 7000, false);
const i = await resize(src, 7000, true);
const mn = await sharp(n.out, { limitInputPixels: false }).metadata(), mi = await sharp(i.out, { limitInputPixels: false }).metadata();
check('48 MP -> 7000 px wide, desktop reference (no iPhone limit)', mn.format === 'jpeg' && mn.width === 7000 && mn.height === 5250 && n.name === 'p48-7000x5250.jpg', `${mn.width}x${mn.height} ${n.name} ${n.secs.toFixed(1)} s`);
const p = await psnr(n.out, i.out);
check('same, iPhone path (bands, 36.75 MP > 16.7 MP): same size, same picture', mi.format === 'jpeg' && mi.width === 7000 && mi.height === 5250 && p > 38, `PSNR between paths ${p.toFixed(1)} dB (two JPEG encoders), ${i.secs.toFixed(1)} s`);
const w = await resize(webp, 5000, true);
const mw = await sharp(w.out, { limitInputPixels: false }).metadata();
check('WebP 20 MP -> 5000 px, iPhone path: stays WebP (libwebp WebAssembly where the browser has none)', mw.format === 'webp' && mw.width === 5000 && /\.webp$/.test(w.name), `${mw.format} ${mw.width}x${mw.height} ${w.name}`);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
