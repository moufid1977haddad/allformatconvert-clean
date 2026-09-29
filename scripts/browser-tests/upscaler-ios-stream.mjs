// Image Upscaler on iPhone (30/09): a 6 Mpx photo x4 = 96 Mpx, far over iOS's 16.7 Mpx canvas limit, used to be
// refused on the device and sent whole to the server (too slow for the route's 290 s). Now the banded server path
// runs there too and writes the result straight into one PNG (no big canvas). Firefox (no WebGPU -> server path),
// window.__forceSafariCanvasCap = the iPhone path. The local media service stores the bands; /api/image-upscale is
// played here as the real route does (read the staged band, "upscale" it with sharp's Lanczos, deposit the PNG):
// no paid call, no production service. The streamed result must equal the canvas-stitched one (same bands).
// Usage: node scripts/browser-tests/upscaler-ios-stream.mjs <origin>   (site run with NEXT_PUBLIC_MEDIA_SERVICE_URL=http://localhost:8621, MEDIA_FFMPEG)
import { firefox } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startLocalMediaService } from './lib/local-media-service.mjs';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'upscale-ios-'));
const W = 2990, H = 2000, SCALE = 4;
const raw = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[i] = (x * 7) & 255; raw[i + 1] = (y * 5) & 255; raw[i + 2] = ((x >> 5) + (y >> 5)) % 2 ? 220 : 30; }
const src = path.join(dir, 'IMG_6MP.png'); fs.writeFileSync(src, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 1 }).toBuffer());
const svc = await startLocalMediaService({ origin });
const b = await firefox.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function run(ios) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await svc.routeTickets(ctx);
  if (ios) await ctx.addInitScript(() => { window.__forceSafariCanvasCap = true; });
  const calls = [];
  await ctx.route('**/api/image-upscale', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const band = await svc.readSource(body.jid);
    const m = await sharp(band).metadata();
    const out = await sharp(band).resize(m.width * body.scale, m.height * body.scale, { kernel: 'lanczos3' }).png({ compressionLevel: 1 }).toBuffer();
    const outputBytes = await svc.depositOutput(body.jid, out, 'png');
    calls.push(`${m.width}x${m.height}`);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, outputBytes, ext: 'png' }) });
  });
  const p = await ctx.newPage();
  await p.goto(origin + '/tools/ai-tools/image-upscaler', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').setInputFiles(src);
  await p.getByRole('button', { name: `${SCALE}×`, exact: false }).first().click();
  const t0 = Date.now();
  await p.getByRole('button', { name: 'Upscale Image' }).click();
  const link = p.locator('a[download]', { hasText: 'Download' });
  const ok = await link.waitFor({ timeout: 900000 }).then(() => true, () => false);
  if (!ok) { const t = (await p.locator('body').innerText()).slice(0, 800); await ctx.close(); return { error: t }; }
  const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
  const f = path.join(dir, `${ios ? 'ios' : 'n'}.png`); await d.saveAs(f);
  await ctx.close();
  return { f, calls, secs: (Date.now() - t0) / 1000 };
}
try {
  const n = await run(false);
  const i = await run(true);
  if (n.error || i.error) check('both paths gave a result', false, (n.error || i.error).replace(/\n+/g, ' | '));
  else {
    const mi = await sharp(i.f, { limitInputPixels: false }).metadata();
    check(`iPhone path: ${W}x${H} x${SCALE} in bands (${i.calls.length} server calls) -> one ${mi.width}x${mi.height} PNG`, mi.format === 'png' && mi.width === W * SCALE && mi.height === H * SCALE && i.calls.length > 1, `${i.secs.toFixed(0)} s, ${(fs.statSync(i.f).size / 1e6).toFixed(1)} MB (canvas-stitched: ${(fs.statSync(n.f).size / 1e6).toFixed(1)} MB)`);
    const A = await sharp(n.f, { limitInputPixels: false }).removeAlpha().raw().toBuffer(), B = await sharp(i.f, { limitInputPixels: false }).removeAlpha().raw().toBuffer(); // canvas PNG is RGBA, the streamed one RGB (opaque source)
    let diff = 0; for (let k = 0; k < A.length; k++) if (A[k] !== B[k]) diff++;
    check('streamed PNG = canvas-stitched PNG, pixel for pixel', A.length === B.length && diff === 0, `${diff} differing samples`);
  }
} finally { await b.close(); svc.stop(); }
console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
