// AI Image Upscaler, hybrid (28/09): on this device through WebGPU when the browser has it, else our server.
// Checks on the real page: which path runs, that the on-device path sends NOTHING to a server, the output size
// (x2 and x4), a valid PNG that matches the source (downscaled back, PSNR), and the 6-megapixel limit.
// WebGPU needs a real GPU: Chromium is launched with a window (--headed) for the device path.
// Usage: node scripts/browser-tests/upscaler-hybrid.mjs <origin> [--browser=firefox|webkit] [--headed] [--server-only]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const headed = process.argv.includes('--headed');
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${browserName} ${n}`, info); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'upscale-'));

// A small photo-like source (gradients + detail), 320x200 = 2 tiles, and a 6.2 Mpx one for the limit.
const src = path.join(tmp, 'small.jpg');
const W = 320, H = 200, raw = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[i] = (x * 255) / W; raw[i + 1] = 128 + 100 * Math.sin(x / 7) * Math.cos(y / 9); raw[i + 2] = ((x ^ y) & 63) * 4; }
await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 92 }).toFile(src);
const big = path.join(tmp, 'big.jpg');
await sharp({ create: { width: 3100, height: 2000, channels: 3, background: '#88aacc' } }).jpeg().toFile(big);

const engine = { chromium, firefox, webkit }[browserName];
const b = await engine.launch(browserName === 'chromium' ? { headless: !headed, args: ['--enable-unsafe-webgpu'] } : {});
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
const sent = [];
p.on('request', (r) => { if (/\/api\/(media\/ticket|image-upscale)|railway\.app/.test(r.url())) sent.push(r.url()); });
await p.goto(`${origin}/tools/ai-tools/image-upscaler`, { waitUntil: 'networkidle' });
const gpu = await p.evaluate(async () => { try { const a = navigator.gpu && (await navigator.gpu.requestAdapter()); return !!a && !a.isFallbackAdapter; } catch { return false; } });
console.log('WebGPU in this browser:', gpu);

// Limit: 6.2 Mpx refused before any work, with the 6-megapixel wording.
await p.locator('input[type=file]').setInputFiles(big);
const refusal = await p.locator('text=/accepts images up to 6 megapixels/').first().waitFor({ timeout: 10000 }).then(() => true, () => false);
check('an image of 6.2 Mpx is refused before any work, "up to 6 megapixels"', refusal && sent.length === 0);

for (const scale of [4, 2]) {
  sent.length = 0;
  await p.locator('input[type=file]').setInputFiles(src);
  await p.getByRole('button', { name: `${scale}×`, exact: false }).first().click();
  const t0 = Date.now();
  await p.getByRole('button', { name: 'Upscale Image' }).click();
  const where = await p.locator('[data-where="device"], [data-where="server"]').first().getAttribute('data-where', { timeout: 60000 }).catch(() => '');
  const done = await p.locator('a[download]', { hasText: 'Download' }).waitFor({ timeout: 600000 }).then(() => true, () => false);
  const err = (await p.locator('p.text-red-600').allInnerTexts()).join(' ');
  if (!done) { check(`x${scale}: a result`, false, `where=${where} error: ${err}`); continue; }
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]', { hasText: 'Download' }).click()]);
  const f = path.join(tmp, `out-x${scale}.png`); await d.saveAs(f);
  const meta = await sharp(f).metadata();
  const back = await sharp(f).resize(W, H, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  const ref = await sharp(src).removeAlpha().raw().toBuffer();
  let se = 0; for (let i = 0; i < ref.length; i++) se += (back[i] - ref[i]) ** 2;
  const psnr = 10 * Math.log10(255 * 255 / (se / ref.length));
  const madeOn = (await p.locator('text=/made on (your device|our server)/').first().innerText().catch(() => '')).match(/made on (your device|our server)/)?.[1];
  if (gpu) check(`x${scale}: runs on this device, nothing sent to a server`, where === 'device' && madeOn === 'your device' && sent.length === 0, `where=${where}, requests: ${sent.join(' ')}`);
  else check(`x${scale}: no WebGPU -> our server`, where === 'server', `where=${where}`);
  check(`x${scale}: PNG ${meta.width}x${meta.height} = ${W * scale}x${H * scale}, faithful to the source (PSNR ${psnr.toFixed(1)} dB back at its size) in ${((Date.now() - t0) / 1000).toFixed(0)} s`, meta.format === 'png' && meta.width === W * scale && meta.height === H * scale && psnr > 28);
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${browserName})`);
process.exit(fails ? 1 : 0);
