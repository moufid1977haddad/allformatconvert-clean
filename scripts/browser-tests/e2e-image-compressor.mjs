// End-to-end: the real image-compressor page in a real browser (Worker + WASM encoders), several files at
// once, every download reopened and measured against its original.
// Usage: node scripts/browser-tests/e2e-image-compressor.mjs <site origin or _vercel_share URL> <file>... [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const entry = args[0];
const files = args.slice(1).filter((a) => !a.startsWith('--'));
const engine = args.includes('--browser=firefox') ? firefox : chromium;
const origin = new URL(entry).origin;
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'imgcomp-'));

async function rgba(p) { const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, info }; }
function psnrOnWhite(a, b) {
  let s = 0, n = 0;
  for (let i = 0; i < a.length; i += 4) {
    const aa = a[i + 3] / 255, ba = b[i + 3] / 255;
    for (let c = 0; c < 3; c++) { const d = (a[i + c] * aa + 255 * (1 - aa)) - (b[i + c] * ba + 255 * (1 - ba)); s += d * d; n++; }
  }
  return s === 0 ? 99 : 10 * Math.log10((255 * 255) / (s / n));
}

const browser = await engine.launch();
const ctx = await browser.newContext({ acceptDownloads: true });
const page = await ctx.newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
await page.goto(`${origin}/tools/image-tools/image-compressor`, { waitUntil: 'networkidle' });
await page.locator('input[type=file]').setInputFiles(files);
const t0 = Date.now();
await page.getByRole('button', { name: /^Compress/ }).click();
await page.waitForFunction(() => !document.body.innerText.includes('Compressing…'), null, { timeout: 180000 });
console.log(`all done in ${((Date.now() - t0) / 1000).toFixed(1)} s (${engine.name()})`);

let fails = 0;
const rows = page.locator('li');
for (let i = 0; i < files.length; i++) {
  const row = rows.nth(i);
  const text = (await row.innerText()).replace(/\s+/g, ' ');
  const src = files[i];
  const link = row.getByRole('link', { name: 'Download' });
  if (!(await link.count())) { console.log('NO FILE ', path.basename(src), '|', text); continue; }
  const [dl] = await Promise.all([page.waitForEvent('download'), link.click()]);
  const dest = path.join(out, dl.suggestedFilename());
  await dl.saveAs(dest);
  const meta = await sharp(dest).metadata();
  const srcMeta = await sharp(src).metadata().catch(() => ({ format: path.extname(src).slice(1), hasAlpha: false })); // sharp cannot read BMP
  const A = await rgba(src).catch(() => null), B = await rgba(dest);
  const sameDims = !A || A.info.width === B.info.width && A.info.height === B.info.height;
  const psnr = sameDims && A ? psnrOnWhite(A.data, B.data) : NaN;
  const smaller = fs.statSync(dest).size < fs.statSync(src).size;
  const formatKept = ['jpeg', 'png', 'webp', 'svg'].includes(srcMeta.format) ? meta.format === srcMeta.format : meta.format === 'jpeg';
  const alphaKept = !srcMeta.hasAlpha || meta.format === 'jpeg' || meta.hasAlpha || meta.channels === 4 || meta.paletteBitDepth;
  const ok = smaller && formatKept && sameDims && alphaKept;
  if (!ok) fails++;
  console.log(ok ? 'PASS' : 'FAIL', path.basename(src), `${fs.statSync(src).size} -> ${fs.statSync(dest).size} B`, meta.format, `${B.info.width}x${B.info.height}`, `PSNR ${psnr.toFixed(2)}`, '|', text.slice(0, 120));
}
await browser.close();
process.exit(fails ? 1 : 0);
