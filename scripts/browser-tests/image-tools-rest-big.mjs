// P16 (30/09): the image tools no other bench runs with an iPhone-size photo, each on photos of 12, 24 and 48 MP,
// ALWAYS with the iPhone's canvas limit simulated (lib/ios-canvas-cap.mjs: no canvas over 16.7 MP in the page).
// A tool passes only with the right result AND no canvas tried over the limit (on an iPhone it would be refused).
//   image-comparison (two photos, differences PNG at full size), png-to-ico (4 sizes), duplicate-image-finder
//   (a photo, its re-saved copy, another photo), image-metadata (size read), image-to-base64 (whole file),
//   gif-maker and image-to-gif (1920 px on the longest side, as ezgif), image-captioner (the reduced JPEG it
//   would send -- the paid call is answered here, nothing is spent), svg-to-png at the photo's size.
// Usage: node scripts/browser-tests/image-tools-rest-big.mjs <origin> [--browser=firefox|webkit] [--mp=12,24,48] [--only=tool,tool] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { applyIosCanvasCap, iosCapHits, iosCapLabel } from './lib/ios-canvas-cap.mjs';

const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const engine = arg('browser') === 'firefox' ? firefox : arg('browser') === 'webkit' ? webkit : chromium;
const only = arg('only')?.split(',');
const SIZES = { 12: [4032, 3024], 24: [5712, 4284], 48: [8064, 6048] };
const MPS = (arg('mp') || '12,24,48').split(',');
const dir = path.join(os.tmpdir(), 'image-tools-rest-big'); fs.mkdirSync(dir, { recursive: true });

async function photo(W, H, ext, variant = 0) {
  const p = path.join(dir, `IMG_${W}_${variant}.${ext}`);
  if (fs.existsSync(p)) return p;
  const raw = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; const u = variant === 1 ? W - 1 - x : x, v = variant === 1 ? (y * 3) % H : y; raw[i] = (u * 255 / W) | 0; raw[i + 1] = (v * 255 / H) | 0; raw[i + 2] = ((x >> 7) + (y >> 7) + variant) % 2 ? 200 : 40; } // variant 1: another picture (dHash far apart)
  if (variant === 0) for (let y = 0; y < H / 6; y++) for (let x = 0; x < W / 6; x++) { const i = (y * W + x) * 3; raw[i] = 255; raw[i + 1] = 0; raw[i + 2] = 0; }
  let s = sharp(raw, { raw: { width: W, height: H, channels: 3 } });
  s = ext === 'png' ? s.png({ compressionLevel: 1 }) : s.jpeg({ quality: variant === 2 ? 70 : 90 });
  fs.writeFileSync(p, await s.toBuffer()); return p;
}
function svgOf(W, H) {
  const p = path.join(dir, `drawing-${W}.svg`);
  fs.writeFileSync(p, `<svg xmlns="http://www.w3.org/2000/svg" width="${W / 8}" height="${H / 8}" viewBox="0 0 ${W / 8} ${H / 8}"><rect width="100%" height="100%" fill="#2060a0"/><rect x="0" y="0" width="${W / 48}" height="${H / 48}" fill="#ff0000"/><circle cx="${W / 16}" cy="${H / 16}" r="${H / 40}" fill="#ffcc00"/></svg>`);
  return p;
}

const b = await engine.launch();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function open(tool) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
  await applyIosCanvasCap(ctx);
  const page = await ctx.newPage();
  page.setDefaultTimeout(300000);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${origin}${tool}`, { waitUntil: 'networkidle' });
  return { ctx, page, errs };
}
async function download(page, locator) {
  const [d] = await Promise.all([page.waitForEvent('download'), locator.click()]);
  return { buf: fs.readFileSync(await d.path()), name: d.suggestedFilename() };
}
async function done(label, t, ok, info) {
  const hits = await iosCapHits(t.page);
  check(label, ok && !hits.length && !t.errs.length, `${info}${hits.length ? ' | CANVAS OVER THE LIMIT: ' + hits.slice(0, 3).join(', ') : ''}${t.errs.length ? ' | pageerror: ' + t.errs[0] : ''}`);
  await t.ctx.close();
}
const run = (k) => !only || only.includes(k);
const safe = async (label, fn) => { try { await fn(); } catch (e) { check(label, false, String(e.message || e).split('\n')[0]); } };

for (const mp of MPS) {
  const [W, H] = SIZES[mp];
  const jpg = await photo(W, H, 'jpg'), png = await photo(W, H, 'png'), other = await photo(W, H, 'jpg', 1), resaved = await photo(W, H, 'jpg', 2);
  const tag = `${mp} MP`;

  if (run('image-comparison')) await safe(`image-comparison ${tag}`, async () => {
    const t = await open('/tools/image-tools/image-comparison');
    const inputs = t.page.locator('input[type=file]');
    await inputs.nth(0).setInputFiles(jpg); await inputs.nth(1).setInputFiles(other);
    await t.page.getByRole('button', { name: 'Differences', exact: true }).click();
    const link = t.page.locator('a[download="differences.png"]');
    await link.waitFor();
    const r = await download(t.page, link);
    const m = await sharp(r.buf, { limitInputPixels: false }).metadata();
    await done(`image-comparison ${tag}: differences PNG at full size`, t, m.format === 'png' && m.width === W && m.height === H, `${m.format} ${m.width}x${m.height}`);
  });

  if (run('png-to-ico')) await safe(`png-to-ico ${tag}`, async () => {
    const t = await open('/tools/image-tools/png-to-ico');
    await t.page.locator('input[type=file]').first().setInputFiles(png);
    for (const s of ['16', '32', '48', '256']) { const bt = t.page.getByRole('button', { name: new RegExp(`^${s}`) }).first(); if (!/indigo-600/.test(await bt.getAttribute('class') || '')) await bt.click(); }
    await t.page.getByRole('button', { name: 'Convert to ICO' }).click();
    const link = t.page.locator('a[download="favicon.ico"]');
    await link.waitFor();
    const r = await download(t.page, link);
    const n = r.buf.readUInt16LE(4);
    const sizes = []; for (let i = 0; i < n; i++) sizes.push(r.buf[6 + i * 16] || 256);
    await done(`png-to-ico ${tag}: ICO with its sizes`, t, r.buf.readUInt16LE(0) === 0 && r.buf.readUInt16LE(2) === 1 && n >= 1 && sizes.includes(256), `${n} images: ${sizes.join(', ')} px`);
  });

  if (run('duplicate-image-finder')) await safe(`duplicate-image-finder ${tag}`, async () => {
    const t = await open('/tools/image-tools/duplicate-image-finder');
    const copy = path.join(dir, `copy-${W}.jpg`); fs.copyFileSync(jpg, copy);
    await t.page.locator('input[type=file]').first().setInputFiles([jpg, copy, other]);
    await t.page.getByRole('button', { name: 'Find Duplicates' }).click();
    await t.page.getByText(/Identical files|No duplicates/).first().waitFor();
    const text = await t.page.locator('body').innerText();
    await done(`duplicate-image-finder ${tag}: the copy found, the other photo not`, t, /Identical files/.test(text) && !/cannot display/.test(text) && !new RegExp(`IMG_${W}_1\\.jpg`).test(text.split('Find Duplicates')[1] || ''), (text.match(/(Identical files|Same picture)[^\n]*/g) || ['none']).join(' ; '));
  });

  if (run('image-metadata')) await safe(`image-metadata ${tag}`, async () => {
    const t = await open('/tools/image-tools/image-metadata');
    await t.page.locator('input[type=file]').first().setInputFiles(jpg);
    await t.page.getByText(`${W} px`, { exact: true }).first().waitFor({ timeout: 60000 });
    const hOk = await t.page.getByText(`${H} px`, { exact: true }).count();
    await done(`image-metadata ${tag}: size read`, t, hOk > 0, `${W} px x ${H} px shown`);
  });

  if (run('image-to-base64')) await safe(`image-to-base64 ${tag}`, async () => {
    const t = await open('/tools/image-tools/image-to-base64');
    await t.page.locator('input[type=file]').first().setInputFiles(jpg);
    const ta = t.page.locator('textarea').first();
    await t.page.waitForFunction(() => (document.querySelector('textarea')?.value || '').length > 1000, null, { timeout: 120000 });
    const v = await ta.inputValue();
    const b64 = v.replace(/^data:[^,]*,/, '');
    await done(`image-to-base64 ${tag}: the whole file`, t, Buffer.from(b64, 'base64').equals(fs.readFileSync(jpg)), `${v.length} characters for ${fs.statSync(jpg).size} bytes`);
  });

  for (const [tool, url] of [['gif-maker', '/tools/gif-tools/gif-maker'], ['image-to-gif', '/tools/gif-tools/image-to-gif']]) {
    if (run(tool)) await safe(`${tool} ${tag}`, async () => {
      const t = await open(url);
      await t.page.locator('input[type=file]').first().setInputFiles([jpg, other]);
      await t.page.getByRole('button', { name: /Create GIF/ }).click();
      const link = t.page.locator('a[download="animated.gif"]');
      await link.waitFor();
      const r = await download(t.page, link);
      const m = await sharp(r.buf, { animated: true, limitInputPixels: false }).metadata();
      const h = m.pageHeight || m.height;
      await done(`${tool} ${tag}: GIF of 2 frames, 1920 px on the longest side`, t, m.format === 'gif' && m.pages === 2 && Math.max(m.width, h) === 1920, `${m.format} ${m.width}x${h}, ${m.pages} frames`);
    });
  }

  if (run('image-captioner')) await safe(`image-captioner ${tag}`, async () => {
    const t = await open('/tools/ai-tools/image-captioner');
    let sent = null;
    await t.page.route('**/api/ai-vision', async (r) => { sent = JSON.parse(r.request().postData() || '{}'); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: 'TEST CAPTION (answered by the bench, no paid call)' }) }); });
    await t.page.locator('input[type=file]').first().setInputFiles(jpg);
    await t.page.getByRole('button', { name: /Generate Caption/ }).click();
    await t.page.getByText('TEST CAPTION').first().waitFor();
    const m = sent?.image ? await sharp(Buffer.from(sent.image.replace(/^data:[^,]*,/, ''), 'base64')).metadata() : {};
    await done(`image-captioner ${tag}: a reduced JPEG sent (2048 px at most)`, t, m.format === 'jpeg' && Math.max(m.width, m.height) === 2048, `${m.format} ${m.width}x${m.height}`);
  });

  if (run('svg-to-png')) await safe(`svg-to-png ${tag}`, async () => {
    const t = await open('/tools/image-tools/svg-to-png');
    await t.page.locator('input[type=file]').first().setInputFiles(svgOf(W, H));
    const nums = t.page.locator('input[type=number]');
    await nums.nth(0).waitFor();
    await nums.nth(0).fill(String(W));
    if (Number(await nums.nth(1).inputValue()) !== H) await nums.nth(1).fill(String(H));
    await t.page.getByRole('button', { name: 'Convert to PNG' }).click();
    const link = t.page.locator('a[download]').filter({ hasText: /Download/ }).first();
    await link.waitFor();
    const r = await download(t.page, link);
    const img = sharp(r.buf, { limitInputPixels: false });
    const m = await img.metadata();
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)];
    const red = px(5, 5), blue = px(W - 5, H - 5);
    await done(`svg-to-png ${tag}: PNG ${W}x${H}, drawing complete`, t, m.format === 'png' && m.width === W && m.height === H && red[0] > 200 && red[1] < 60 && blue[2] > 140 && blue[0] < 60, `${m.format} ${m.width}x${m.height}, corner ${red} / ${blue}`);
  });
}
await b.close();
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()}, ${MPS.join('/')} MP, ${iosCapLabel()})`); process.exit(fails ? 1 : 0);
