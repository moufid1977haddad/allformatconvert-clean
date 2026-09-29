// The iPhone path of app/lib/bigImage.js run by WebKit itself (Playwright's WebKit has no OffscreenCanvas, so the
// Image Converter worker can't run there): a 24 MP EXIF-rotated JPEG decoded in bands of <= 16.7 MP, compared
// pixel for pixel with WebKit's own decode of the whole image, then written by encodePngRGBA (CompressionStream)
// and reopened by sharp. Usage: node scripts/browser-tests/big-image-webkit-bands.mjs [--browser=firefox]
import { webkit, firefox } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const engine = process.argv.includes('--browser=firefox') ? firefox : webkit;
const src = fs.readFileSync(new URL('../../app/lib/bigImage.js', import.meta.url), 'utf8').replace(/^export /gm, '');
const w = 5712, h = 4284, raw = Buffer.alloc(w * h * 3);
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; raw[i] = x & 255; raw[i + 1] = y & 255; raw[i + 2] = (x < w / 8 && y < h / 8) ? 255 : 0; }
const jpg = await sharp(raw, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 95 }).withMetadata({ orientation: 6 }).toBuffer();
import { iosCanvasCapInit, iosCapLabel } from './lib/ios-canvas-cap.mjs';
const b = await engine.launch(); const page = await b.newPage();
await page.addInitScript(iosCanvasCapInit); // P16: the iPhone's canvas limit, always
await page.goto('about:blank'); // (init scripts run on navigation)
await page.addScriptTag({ content: src + '\nwindow.__big = { decodeToRaster, encodePngRGBA, bandDecodeWorks, CANVAS_MAX_PIXELS };' });
const r = await page.evaluate(async (bytes) => {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
  const B = window.__big;
  const probe = await B.bandDecodeWorks();
  const dims = { width: 4284, height: 5712 };
  const t0 = performance.now();
  const bands = await B.decodeToRaster(blob, dims, { forceBands: true });
  const t1 = performance.now();
  const full = await createImageBitmap(blob);
  // reference: the whole bitmap, copied through canvases under the limit (one canvas of the full size is refused here)
  const ref = new Uint8ClampedArray(full.width * full.height * 4), rows = Math.floor(16777216 / full.width);
  const c = document.createElement('canvas'); c.width = full.width; c.height = rows; const ctx = c.getContext('2d', { willReadFrequently: true });
  for (let y = 0; y < full.height; y += rows) { const hh = Math.min(rows, full.height - y); ctx.clearRect(0, 0, c.width, rows); ctx.drawImage(full, 0, y, full.width, hh, 0, 0, full.width, hh); ref.set(ctx.getImageData(0, 0, full.width, hh).data, y * full.width * 4); }
  const a = bands.rgba(); let diff = 0, maxd = 0;
  for (let i = 0; i < ref.length; i++) { const d = Math.abs(ref[i] - a[i]); if (d) diff++; if (d > maxd) maxd = d; }
  const png = await B.encodePngRGBA(a, bands.width, bands.height);
  return { probe, path: bands.canvas ? 'canvas' : 'bands', w: bands.width, h: bands.height, fullW: full.width, fullH: full.height, diff, maxd, ms: Math.round(t1 - t0), png: [...new Uint8Array(await png.arrayBuffer())] };
}, [...jpg]);
const out = Buffer.from(r.png); delete r.png;
const m = await sharp(out).metadata();
const { data } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
const ok = r.probe && r.path === 'bands' && r.w === 4284 && r.h === 5712 && r.diff === 0 && m.format === 'png' && m.width === 4284 && data[(5 * 4284 + 4284 - 6) * 3 + 2] > 200;
console.log(ok ? 'PASS' : 'FAIL', engine.name(), iosCapLabel(), JSON.stringify(r), `png ${m.width}x${m.height}`, `marker (top-right after rotation) blue=${data[(5 * 4284 + 4284 - 6) * 3 + 2]}`);
await b.close(); process.exit(ok ? 0 : 1);
