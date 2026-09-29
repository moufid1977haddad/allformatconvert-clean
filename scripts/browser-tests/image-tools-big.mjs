// The 20 canvas image tools moved to app/lib/imageOutput.js (30/09, owner's iPhone): each result is a Blob link named
// after the original (no data: URL), in the source's format, at full resolution -- and, with --ios, on the iPhone
// path (no canvas over 16.7 MP: window.__forceSafariCanvasCap) on a 24.5 MP photo, whose result must match the
// normal path's pixel for pixel (lossless outputs) or closely (lossy ones).
// Usage: node scripts/browser-tests/image-tools-big.mjs <origin> [--browser=firefox|webkit] [--ios] [--only=tool,tool] [--small]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const engine = arg('browser') === 'firefox' ? firefox : arg('browser') === 'webkit' ? webkit : chromium;
const IOS = process.argv.includes('--ios');
const only = arg('only')?.split(',');
const dir = path.join(os.tmpdir(), 'image-tools-big'); fs.mkdirSync(dir, { recursive: true });
const [W, H] = process.argv.includes('--small') ? [900, 600] : [5712, 4284];
async function fixture(ext) {
  const p = path.join(dir, `photo-${W}.${ext}`);
  if (fs.existsSync(p)) return p;
  const raw = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[i] = (x * 255 / W) | 0; raw[i + 1] = (y * 255 / H) | 0; raw[i + 2] = ((x >> 6) + (y >> 6)) % 2 ? 190 : 50; }
  for (let y = 0; y < H / 8; y++) for (let x = 0; x < W / 8; x++) { const i = (y * W + x) * 3; raw[i] = 0; raw[i + 1] = 255; raw[i + 2] = 0; }
  let s = sharp(raw, { raw: { width: W, height: H, channels: 3 } });
  s = ext === 'png' ? s.png({ compressionLevel: 1 }) : ext === 'jpg' ? s.jpeg({ quality: 92 }) : ext === 'webp' ? s.webp({ quality: 90 }) : s.png();
  let buf = await s.toBuffer();
  if (ext === 'bmp') { // 24-bit BMP written by hand (sharp has no BMP writer)
    const row = Math.ceil(W * 3 / 4) * 4; buf = Buffer.alloc(54 + row * H); buf.write('BM'); buf.writeUInt32LE(buf.length, 2); buf.writeUInt32LE(54, 10); buf.writeUInt32LE(40, 14); buf.writeInt32LE(W, 18); buf.writeInt32LE(H, 22); buf.writeUInt16LE(1, 26); buf.writeUInt16LE(24, 28);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s0 = (y * W + x) * 3, d = 54 + (H - 1 - y) * row + x * 3; buf[d] = raw[s0 + 2]; buf[d + 1] = raw[s0 + 1]; buf[d + 2] = raw[s0]; }
  }
  fs.writeFileSync(p, buf); return p;
}
// tool, button, input ext, expected output format (sharp name), output size fn, lossless?
const TOOLS = [
  ['image-inverter', 'Invert Colors', 'png', 'png', (w, h) => [w, h], true],
  ['add-noise', 'Add Noise', 'png', 'png', (w, h) => [w, h], null],
  ['grayscale-converter', 'Convert to Grayscale', 'png', 'png', (w, h) => [w, h], true],
  ['sepia-filter', 'Apply Sepia', 'png', 'png', (w, h) => [w, h], true],
  ['brightness-contrast', 'Apply', 'png', 'png', (w, h) => [w, h], true],
  ['image-blur', 'Apply Blur', 'png', 'png', (w, h) => [w, h], true],
  ['add-vignette', 'Add Vignette', 'png', 'png', (w, h) => [w, h], true],
  ['add-border-to-image', 'Add Border', 'png', 'png', (w, h) => [w + 20, h + 20], true],
  ['add-text-to-image', 'Apply Text', 'png', 'png', (w, h) => [w, h], true],
  ['round-corners', 'Apply Round Corners', 'jpg', 'png', (w, h) => [w, h], false],
  ['image-flip', 'Flip Vertical', 'png', 'png', (w, h) => [w, h], true],
  ['image-pixelator', 'Apply Pixelate', 'png', 'png', (w, h) => [w, h], true],
  ['image-rotate', 'Rotate', 'png', 'png', (w, h) => [h, w], true],
  ['png-to-jpg', 'Convert', 'png', 'jpeg', (w, h) => [w, h], false],
  ['webp-to-jpg', 'Convert', 'webp', 'jpeg', (w, h) => [w, h], false],
  ['jpg-to-png', 'Convert', 'jpg', 'png', (w, h) => [w, h], false],
  ['webp-to-png', 'Convert', 'webp', 'png', (w, h) => [w, h], false],
  ['jpg-to-webp', 'Convert', 'jpg', 'webp', (w, h) => [w, h], false],
  ['png-to-webp', 'Convert', 'png', 'webp', (w, h) => [w, h], false],
  ['bmp-to-png', 'Convert', 'bmp', 'png', (w, h) => [w, h], true],
  ['image-cropper', 'Crop Image', 'png', 'png', (w, h) => [w, h], true], // whole picture selected (ranges at their max)
];
const b = await engine.launch();
async function runTool(tool, button, file, ios) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (ios) await ctx.addInitScript(() => { window.__forceSafariCanvasCap = true; });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${origin}/tools/image-tools/${tool}`, { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').first().setInputFiles(file);
  if (tool === 'image-cropper') {
    await page.locator('input[type=range]').nth(3).waitFor();
    await page.waitForFunction(() => { const r = document.querySelectorAll('input[type=range]'); return r.length >= 4 && Number(r[2].max) > 1 && Number(r[3].max) > 1; });
    await page.waitForTimeout(300);
    for (const i of [2, 3]) await page.locator('input[type=range]').nth(i).evaluate((r) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, r.max); r.dispatchEvent(new Event('input', { bubbles: true })); });
  }
  const t0 = Date.now();
  await page.getByRole('button', { name: button, exact: true }).click();
  const link = page.getByRole('link', { name: 'Download', exact: true });
  const err = page.locator('p.text-red-400, p.text-red-500');
  await Promise.race([link.waitFor({ timeout: 600000 }), err.first().waitFor({ timeout: 600000 })]);
  if (!(await link.count())) { const e = await err.first().innerText(); await ctx.close(); return { error: e }; }
  const secs = (Date.now() - t0) / 1000;
  const href = await link.getAttribute('href');
  const [dl] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const buf = fs.readFileSync(await dl.path());
  await ctx.close();
  return { buf, href, name: dl.suggestedFilename(), secs, errs };
}
async function psnr(a, bb) {
  const A = await sharp(a, { limitInputPixels: false }).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(bb, { limitInputPixels: false }).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  if (A.info.width !== B.info.width || A.info.height !== B.info.height) return -1;
  let se = 0; for (let i = 0; i < A.data.length; i++) se += (A.data[i] - B.data[i]) ** 2;
  return se === 0 ? Infinity : 10 * Math.log10(255 * 255 / (se / A.data.length));
}
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
for (const [tool, button, inExt, fmt, size, lossless] of TOOLS) {
  if (only && !only.includes(tool)) continue;
  const file = await fixture(inExt);
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  const r = await runTool(tool, button, file, false);
  if (r.error) { check(`${tool}`, false, r.error); continue; }
  const m = await sharp(r.buf, { limitInputPixels: false }).metadata();
  const [ew, eh] = size(W, H);
  const ext = { jpeg: 'jpg', png: 'png', webp: 'webp' }[fmt];
  check(`${tool}`, r.href.startsWith('blob:') && m.format === fmt && m.width === ew && m.height === eh && r.name.startsWith(base) && r.name.endsWith(`.${ext}`) && !r.errs.length,
    `${m.format} ${m.width}x${m.height} ${r.name} (${r.secs.toFixed(1)} s)${r.errs.length ? ' pageerror: ' + r.errs[0] : ''}`);
  if (!IOS) continue;
  const q = await runTool(tool, button, file, true);
  if (q.error) { check(`${tool} [iPhone path]`, false, q.error); continue; }
  const mq = await sharp(q.buf, { limitInputPixels: false }).metadata();
  // lossy outputs: two different JPEG/WebP encoders (browser's, WebAssembly) -- each compared with the source instead
  const lossy = fmt === 'jpeg' || fmt === 'webp';
  const p = lossless === null ? null : lossy ? await psnr(file, q.buf) : await psnr(r.buf, q.buf); // WebP q80 on this synthetic chart: 34.7 dB
  const ok = q.href.startsWith('blob:') && mq.format === fmt && mq.width === ew && mq.height === eh && (p === null || (lossless ? p >= 50 : p >= (fmt === 'webp' ? 33 : 35)));
  check(`${tool} [iPhone path]`, ok, `${mq.format} ${mq.width}x${mq.height}, ${lossy ? 'vs source' : 'same as normal path'}: PSNR ${p === null ? 'n/a (random)' : p.toFixed(1)} dB (${q.secs.toFixed(1)} s)`);
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()}${IOS ? ', iPhone path' : ''})`); process.exit(fails ? 1 : 0);
