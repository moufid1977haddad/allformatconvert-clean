// TIFF to JPG / PNG (30/09): a 20 MP TIFF with transparency (over iOS's 16.7 MP canvas limit -> encoded without a
// canvas) and a small one (canvas path). JPG: transparency on WHITE (it came out black before), full size; PNG:
// alpha kept, lossless; names derived from the original.
// Usage: node scripts/browser-tests/tiff-tools-big.mjs <origin> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { iosCanvasCapInit, applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tiff-'));
async function tiff(w, h, name) {
  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; raw[i] = 200; raw[i + 1] = (x * 255 / w) | 0; raw[i + 2] = 60; raw[i + 3] = x < w / 4 ? 0 : 255; }
  const p = path.join(dir, name); fs.writeFileSync(p, await sharp(raw, { raw: { width: w, height: h, channels: 4 } }).tiff({ compression: 'lzw' }).toBuffer()); return p;
}
const big = await tiff(5000, 4000, 'scan-big.tif'), small = await tiff(800, 600, 'scan-small.tif');
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
for (const [tool, fmt] of [['tiff-to-jpg', 'jpeg'], ['tiff-to-png', 'png']]) for (const f of [small, big]) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await applyIosCanvasCap(ctx); // P16: the iPhone's canvas limit, always (lib/ios-canvas-cap.mjs)
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/image-tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(f);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const link = p.locator('a[download]').filter({ hasText: /Download/ }).first();
  await link.waitFor({ timeout: 300000 });
  const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const out = path.join(dir, `${Date.now()}-${d.suggestedFilename()}`); await d.saveAs(out); await ctx.close();
  const m = await sharp(out, { limitInputPixels: false }).metadata();
  const px = await sharp(out, { limitInputPixels: false }).ensureAlpha().extract({ left: 3, top: 3, width: 1, height: 1 }).raw().toBuffer();
  const src = await sharp(f).metadata();
  const corner = fmt === 'jpeg' ? px[0] > 245 && px[1] > 245 && px[2] > 245 : px[3] === 0;
  check(`${tool} ${src.width}x${src.height}`, m.format === fmt && m.width === src.width && m.height === src.height && corner && d.suggestedFilename() === path.basename(f).replace(/\.tif$/, fmt === 'jpeg' ? '.jpg' : '.png'),
    `${m.format} ${m.width}x${m.height} transparent corner -> ${[...px]} ${d.suggestedFilename()}`);
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
