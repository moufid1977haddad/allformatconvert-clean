// AI Image Upscaler, the LARGEST image on our server (point 6, 28/09): a photo-like 2990x2000 (5.98 Mpx) source,
// x4 in Firefox (no WebGPU -> server path), must come back within the route's 290 s as a 11960x8000 PNG faithful to
// the source. Measures the time the visitor waits. One real server upscale (~0.03 $, within the upscaler's cap).
// Since 28/09 the page sends such an image in bands (each call well within 290 s): every call is timed, and with
// --ref=<png> (the single-call result of the same source) the banded result is compared to it.
// Usage: node scripts/browser-tests/upscaler-6mpx-server.mjs <origin> [--cors-shim] [--scale=2] [--ref=<png>]
import { firefox } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const origin = new URL(process.argv[2]).origin;
const scale = Number((process.argv.find((a) => a.startsWith('--scale=')) || '--scale=4').slice(8));
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'up6-'));
const W = 2990, H = 2000, raw = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3;
  raw[i] = (x * 255) / W; raw[i + 1] = 128 + 100 * Math.sin(x / 23) * Math.cos(y / 31); raw[i + 2] = (((x >> 2) ^ (y >> 2)) & 63) * 4;
}
const src = path.join(tmp, 'six.jpg');
await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toFile(src);

const b = await firefox.launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--cors-shim')) await ctx.route(/railway\.app/, async (r) => {
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'access-control-expose-headers': '*' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const resp = await r.fetch();
  return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
});
const p = await ctx.newPage();
p.setDefaultTimeout(600000);
let api = null;
const calls = [];
p.on('request', (r) => { if (r.url().includes('/api/image-upscale')) r._t0 = Date.now(); });
p.on('response', async (r) => { if (r.url().includes('/api/image-upscale')) { api = { status: r.status(), body: (await r.text().catch(() => '')).slice(0, 300) }; calls.push({ status: r.status(), s: Math.round((Date.now() - r.request()._t0) / 1000) }); } });
await p.goto(`${origin}/tools/ai-tools/image-upscaler`, { waitUntil: 'networkidle' });
await p.locator('input[type=file]').setInputFiles(src);
await p.getByRole('button', { name: `${scale}×`, exact: false }).first().click();
const t0 = Date.now();
await p.getByRole('button', { name: 'Upscale Image' }).click();
const done = await p.locator('a[download]', { hasText: 'Download' }).waitFor({ timeout: 600000 }).then(() => true, () => false);
const secs = ((Date.now() - t0) / 1000).toFixed(0);
if (!done) {
  check(`x${scale} of 5.98 Mpx: a result`, false, `${secs} s; api ${JSON.stringify(api)}; page: ${(await p.locator('p.text-red-600').allInnerTexts()).join(' ')}`);
} else {
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[download]', { hasText: 'Download' }).click()]);
  const f = path.join(tmp, 'out.png'); await d.saveAs(f);
  const meta = await sharp(f).metadata();
  const back = await sharp(f).resize(W, H, { kernel: 'lanczos3' }).removeAlpha().raw().toBuffer();
  const ref = await sharp(src).removeAlpha().raw().toBuffer();
  let se = 0; for (let i = 0; i < ref.length; i += 7) se += (back[i] - ref[i]) ** 2;
  const psnr = 10 * Math.log10(255 * 255 / (se / Math.ceil(ref.length / 7)));
  check(`every server call answered well within the route's 290 s: ${JSON.stringify(calls)}`, calls.length > 0 && calls.every((c) => c.status === 200 && c.s < 200));
  const refArg = process.argv.find((a) => a.startsWith('--ref='));
  if (refArg) {
    const a = await sharp(f).removeAlpha().raw().toBuffer(), r2 = await sharp(refArg.slice(6)).removeAlpha().raw().toBuffer();
    let e2 = 0, mx = 0; for (let i = 0; i < a.length; i += 13) { const d = Math.abs(a[i] - r2[i]); e2 += d * d; if (d > mx) mx = d; }
    const ps = 10 * Math.log10(255 * 255 / Math.max(1e-9, e2 / Math.ceil(a.length / 13)));
    check(`banded result = single-call result (PSNR ${ps.toFixed(1)} dB, max difference ${mx}/255)`, a.length === r2.length && ps > 45);
  }
  check(`x${scale} of 5.98 Mpx on our server: PNG ${meta.width}x${meta.height}, ${(fs.statSync(f).size / 1048576).toFixed(0)} MB, PSNR ${psnr.toFixed(1)} dB, ${secs} s from click to result`, meta.width === W * scale && meta.height === H * scale && psnr > 30, JSON.stringify(api));
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
