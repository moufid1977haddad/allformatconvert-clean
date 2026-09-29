// Image Compressor on a 24 MP EXIF-rotated iPhone-size photo (30/09: one canvas the size of the photo failed on
// iPhone). --bands forces the iPhone decode (bands, no canvas over 16.7 MP) in Firefox. The download must be a JPEG
// at the displayed size (rotation applied), smaller than the source, close to it (PSNR).
// Usage: node scripts/browser-tests/image-compressor-big.mjs <origin> [--browser=firefox|webkit] [--bands]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = path.join(os.tmpdir(), 'compressor-big'); fs.mkdirSync(dir, { recursive: true });
const src = path.join(dir, 'IMG_24MP.jpg');
if (!fs.existsSync(src)) {
  const W = 5712, H = 4284, raw = Buffer.alloc(W * H * 3);
  let seed = 3; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3, g = (rnd() - 0.5) * 10; raw[i] = 255 * x / W + g; raw[i + 1] = 255 * y / H + g; raw[i + 2] = 120 + g; }
  for (let y = 0; y < H / 8; y++) for (let x = 0; x < W / 8; x++) { const i = (y * W + x) * 3; raw[i] = 0; raw[i + 1] = 255; raw[i + 2] = 0; }
  fs.writeFileSync(src, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 97 }).withMetadata({ orientation: 6 }).toBuffer());
}
const b = await engine.launch(); const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--bands')) await ctx.addInitScript(() => { window.__forceBands = true; });
const p = await ctx.newPage();
await p.goto(origin + '/tools/image-tools/image-compressor', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles(src);
await p.getByRole('button', { name: /^Compress/ }).first().click();
const link = p.locator('a[download]').filter({ hasText: /Download/ }).first();
await link.waitFor({ timeout: 600000 });
const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
const out = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out);
const m = await sharp(out).metadata();
const A = await sharp(src).rotate().raw().toBuffer(), B = await sharp(out).rotate().raw().toBuffer();
let se = 0; for (let i = 0; i < A.length; i++) se += (A[i] - B[i]) ** 2; const psnr = 10 * Math.log10(255 * 255 / (se / A.length));
const g = await sharp(out).rotate().extract({ left: 4284 - 20, top: 10, width: 1, height: 1 }).raw().toBuffer();
const ok = m.format === 'jpeg' && (m.orientation && m.orientation >= 5 ? m.height === 4284 && m.width === 5712 : m.width === 4284 && m.height === 5712) && fs.statSync(out).size < fs.statSync(src).size && psnr > 33 && g[1] > 200;
console.log(ok ? 'PASS' : 'FAIL', `24 MP rotated photo compressed (${engine.name()}${process.argv.includes('--bands') ? ', iPhone band decode' : ''}): ${m.width}x${m.height} orientation ${m.orientation || 1}, ${(fs.statSync(src).size / 1e6).toFixed(1)} -> ${(fs.statSync(out).size / 1e6).toFixed(1)} MB, PSNR ${psnr.toFixed(1)} dB, green marker top-right ${[...g]}`);
await b.close(); process.exit(ok ? 0 : 1);
