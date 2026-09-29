// Image Editor on a 24.5 MP photo (30/09: one full-size canvas fails on iPhone, and the download was a data: link).
// Rotate 90 + pixelate 8 + border 20, Apply, Download: normal path vs the iPhone path (window.__forceSafariCanvasCap:
// preview scaled under 16.7 MP, export painted band by band at full size). Same size, same pixels, a Blob named
// after the original, JPEG kept.
// Usage: node scripts/browser-tests/image-editor-big.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iosCanvasCapInit, applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = path.join(os.tmpdir(), 'editor-big'); fs.mkdirSync(dir, { recursive: true });
const W = 5712, H = 4284, src = path.join(dir, 'IMG_EDIT.jpg');
if (!fs.existsSync(src)) {
  const raw = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[i] = (x * 255 / W) | 0; raw[i + 1] = (y * 255 / H) | 0; raw[i + 2] = ((x >> 6) + (y >> 6)) % 2 ? 190 : 50; }
  fs.writeFileSync(src, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 92 }).toBuffer());
}
const b = await engine.launch();
async function run(ios) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (ios) await ctx.addInitScript(iosCanvasCapInit);
  const p = await ctx.newPage();
  await p.goto(origin + '/tools/image-tools/image-editor', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(src);
  await p.waitForFunction(() => (document.querySelector('canvas')?.width || 0) > 1, null, { timeout: 60000 });
  await p.getByRole('button', { name: /Transform/ }).click();
  await p.locator('input[type="range"]').first().fill('90');
  await p.locator('input[type="range"]').nth(1).fill('8'); // pixelate: bands must start on a block edge
  await p.getByRole('button', { name: /Decorate/ }).click();
  await p.locator('input[type="range"]').nth(1).fill('20'); // border width
  await p.getByRole('button', { name: 'Apply', exact: true }).click();
  await p.waitForTimeout(3000);
  const preview = await p.evaluate(() => { const c = document.querySelector('canvas'); return [c.width, c.height]; });
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 300000 }), p.getByRole('button', { name: 'Download', exact: true }).click()]);
  const out = path.join(dir, `${ios ? 'ios' : 'n'}-${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out);
  await ctx.close();
  return { out, name: d.suggestedFilename(), preview };
}
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const n = await run(false), i = await run(true);
const mn = await sharp(n.out).metadata(), mi = await sharp(i.out).metadata();
check('desktop reference (no iPhone limit): rotated full size, JPEG, named after the original', mn.format === 'jpeg' && mn.width === H && mn.height === W && n.name === 'IMG_EDIT-edited.jpg', `${mn.width}x${mn.height} ${n.name} preview ${n.preview}`);
const A = await sharp(n.out).raw().toBuffer(), B = await sharp(i.out).raw().toBuffer();
let se = 0; for (let k = 0; k < A.length; k++) se += (A[k] - B[k]) ** 2; const psnr = 10 * Math.log10(255 * 255 / (se / A.length));
check('iPhone path: preview under 16.7 MP, download full size and the same picture', i.preview[0] * i.preview[1] <= 16777216 && mi.width === H && mi.height === W && psnr > 34, `preview ${i.preview}, ${mi.width}x${mi.height}, PSNR vs normal ${psnr.toFixed(1)} dB (two JPEG encoders on hard pixel blocks)`);
const border = await sharp(i.out).extract({ left: 5, top: Math.round(W / 2), width: 1, height: 1 }).raw().toBuffer();
check('iPhone path: the border is on the full-size image edge', border[2] > 150 && border[0] < 120, `${[...border]}`);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
