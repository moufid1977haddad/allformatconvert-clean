// Background Remover recomposition (owner's iPhone, 30/09: "Download PNG" killed the tab on a 12 MP photo). Route
// played (a mask: white ellipse on black, at the uploaded size) -- no paid call. Checks: PNG at full resolution for
// 12 MP, 24 MP EXIF-rotated and 48 MP photos, corners transparent, centre opaque with the photo's own colours, name
// derived from the original, and the largest canvas the page ever sized (instrumented) stays far under iOS's 16.7 MP.
// Usage: node scripts/browser-tests/bg-remover-bands.mjs <origin> [--browser=firefox|webkit] [--sizes=12,24,48]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const engine = arg('browser') === 'firefox' ? firefox : arg('browser') === 'webkit' ? webkit : chromium;
const sizes = (arg('sizes') || '12,24,48').split(',').map(Number);
const dir = path.join(os.tmpdir(), 'bg-remover-bands'); fs.mkdirSync(dir, { recursive: true });
async function photo(w, h, orientation, name) {
  const p = path.join(dir, name); if (fs.existsSync(p)) return p;
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 3; raw[i] = 200; raw[i + 1] = (x * 255 / w) | 0; raw[i + 2] = (y * 255 / h) | 0; }
  let s = sharp(raw, { raw: { width: w, height: h, channels: 3 }, limitInputPixels: false }).jpeg({ quality: 95 });
  if (orientation) s = s.withMetadata({ orientation });
  fs.writeFileSync(p, await s.toBuffer()); return p;
}
const cases = [];
if (sizes.includes(12)) cases.push(['12.2 MP', await photo(4032, 3024, 0, 'bg12.jpg'), 4032, 3024]);
if (sizes.includes(24)) cases.push(['24 MP, EXIF 6', await photo(5712, 4284, 6, 'bg24r.jpg'), 4284, 5712]);
if (sizes.includes(48)) cases.push(['48 MP', await photo(8064, 6048, 0, 'bg48.jpg'), 8064, 6048]);
const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
for (const [label, file, W, H] of cases) {
  const ctx = await b.newContext({ acceptDownloads: true });
  await ctx.addInitScript(() => {
    window.__maxCanvas = 0;
    const d = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'height');
    Object.defineProperty(HTMLCanvasElement.prototype, 'height', { ...d, set(v) { d.set.call(this, v); window.__maxCanvas = Math.max(window.__maxCanvas, this.width * v); } });
    const dw = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', { ...dw, set(v) { dw.set.call(this, v); window.__maxCanvas = Math.max(window.__maxCanvas, v * this.height); } });
  });
  const p = await ctx.newPage();
  await p.route('**/api/remove-bg', async (r) => {
    const { image } = JSON.parse(r.request().postData());
    const m = await sharp(Buffer.from(image, 'base64')).metadata();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${m.width}" height="${m.height}"><rect width="100%" height="100%" fill="black"/><ellipse cx="50%" cy="50%" rx="30%" ry="30%" fill="white"/></svg>`;
    const mask = (await sharp(Buffer.from(svg)).grayscale().png().toBuffer()).toString('base64');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mask }) });
  });
  await p.goto(origin + '/tools/ai-tools/background-remover', { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(file);
  const t0 = Date.now();
  await p.getByRole('button', { name: /Remove Background/ }).click();
  const dl = p.getByRole('link', { name: 'Download PNG' });
  const ok = await dl.waitFor({ timeout: 300000 }).then(() => true, () => false);
  if (!ok) { check(label, false, (await p.locator('.text-red-400').allInnerTexts()).join(' ')); await ctx.close(); continue; }
  const secs = (Date.now() - t0) / 1000;
  const href = await dl.getAttribute('href');
  const maxCanvas = await p.evaluate(() => window.__maxCanvas);
  const [d] = await Promise.all([p.waitForEvent('download'), dl.click()]);
  const buf = fs.readFileSync(await d.path());
  const img = sharp(buf, { limitInputPixels: false });
  const meta = await img.metadata();
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * info.width + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
  const c = px(W >> 1, H >> 1), corner = px(5, 5);
  // centre colour = the photo's own: R 200, G ~ x/W*255, B ~ y/H*255 (as displayed, rotation applied)
  const src = await sharp(file, { limitInputPixels: false }).rotate().extract({ left: W >> 1, top: H >> 1, width: 1, height: 1 }).raw().toBuffer();
  const colourOk = Math.abs(c[0] - src[0]) < 6 && Math.abs(c[1] - src[1]) < 6 && Math.abs(c[2] - src[2]) < 6;
  check(label, meta.width === W && meta.height === H && corner[3] === 0 && c[3] === 255 && colourOk && href.startsWith('blob:') && d.suggestedFilename() === path.basename(file).replace(/\.jpg$/, '-no-background.png') && maxCanvas <= 4_100_000,
    `${meta.width}x${meta.height} corner α ${corner[3]} centre ${c.join(',')} (src ${[...src].join(',')}), largest canvas ${(maxCanvas / 1e6).toFixed(2)} MP, ${d.suggestedFilename()}, ${(buf.length / 1e6).toFixed(1)} MB, ${secs.toFixed(1)} s`);
  await ctx.close();
}
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
