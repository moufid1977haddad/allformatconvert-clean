// Image Converter's BMP / GIF / TIFF / ICO / PDF outputs on the real page: each download reopened and checked
// (pixels compared with the source where the format allows), plus the time of the slowest one on a big photo.
// Usage: node scripts/browser-tests/image-converter-formats.mjs <origin or _vercel_share URL> <photo.jpg> <transparent.png> [big.jpg] [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, photo, transparent, big] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const page = await (await b.newContext({ acceptDownloads: true })).newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
async function psnr(srcPath, buf) {
  const A = await sharp(srcPath).flatten({ background: '#fff' }).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(buf).flatten({ background: '#fff' }).resize(A.info.width, A.info.height).raw().toBuffer();
  let se = 0; for (let i = 0; i < A.data.length; i++) se += (A.data[i] - B[i]) ** 2;
  return 10 * Math.log10(255 * 255 / (se / A.data.length));
}
function readBmp(buf) { // 24-bit bottom-up BMP -> raw RGB, to compare with the source
  const w = buf.readInt32LE(18), h = buf.readInt32LE(22), bpp = buf.readUInt16LE(28), off = buf.readUInt32LE(10), row = Math.ceil(w * 3 / 4) * 4;
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const s = off + (h - 1 - y) * row + x * 3, d = (y * w + x) * 3; out[d] = buf[s + 2]; out[d + 1] = buf[s + 1]; out[d + 2] = buf[s]; }
  return { w, h, bpp, raw: out };
}
async function convert(file, fmt) {
  await page.goto(origin + '/tools/image-tools/image-converter', { waitUntil: 'networkidle' });
  await page.locator('input[type=file]').setInputFiles(file);
  await page.locator('select').filter({ has: page.locator('option[value="ico"]') }).selectOption(fmt);
  const t0 = Date.now();
  await page.getByRole('button', { name: /^Convert \d+ file/ }).click();
  const btn = page.locator('div.bg-green-50 button', { hasText: 'Download' }).first();
  await btn.waitFor({ timeout: 240000 }).catch(async (e) => { const t = await page.locator('body').innerText(); console.log('PAGE:', t.slice(t.indexOf('Conversion options'), t.indexOf('Conversion options') + 400).replace(/\n+/g, ' | ')); throw e; });
  const secs = (Date.now() - t0) / 1000;
  const [dl] = await Promise.all([page.waitForEvent('download'), btn.click()]);
  return { buf: fs.readFileSync(await dl.path()), name: dl.suggestedFilename(), secs };
}
const pw = (await sharp(photo).metadata()).width, ph = (await sharp(photo).metadata()).height;
let r = await convert(photo, 'bmp'); { const m = readBmp(r.buf); const p = await psnr(photo, await sharp(m.raw, { raw: { width: m.w, height: m.h, channels: 3 } }).png().toBuffer()); check('photo -> BMP', r.name.endsWith('.bmp') && m.bpp === 24 && m.w === pw && m.h === ph && p > 45, `${m.w}x${m.h} 24-bit, ${(r.buf.length / 1e6).toFixed(1)} MB, PSNR ${p.toFixed(1)} dB (${r.secs.toFixed(1)} s)`); }
r = await convert(photo, 'gif'); { const m = await sharp(r.buf).metadata(); const p = await psnr(photo, r.buf); check('photo -> GIF', r.name.endsWith('.gif') && m.format === 'gif' && m.width === pw && p > 25, `256 colours dithered, PSNR ${p.toFixed(1)} dB, ${(r.buf.length / 1e6).toFixed(2)} MB (${r.secs.toFixed(1)} s)`); }
r = await convert(transparent, 'gif'); { const m = await sharp(r.buf).metadata(); const { data } = await sharp(r.buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); check('transparent PNG -> GIF keeps transparency', m.format === 'gif' && data[3] === 0, `corner alpha ${data[3]}`); }
r = await convert(transparent, 'tiff'); { const m = await sharp(r.buf).metadata(); const p = await psnr(transparent, r.buf); check('transparent PNG -> TIFF, lossless, alpha kept', r.name.endsWith('.tiff') && m.format === 'tiff' && m.hasAlpha && p > 60, `PSNR ${p.toFixed(1)} dB`); }
r = await convert(transparent, 'png'); console.log('INFO same canvas, PNG output: PSNR', (await psnr(transparent, r.buf)).toFixed(1), 'dB');
r = await convert(transparent, 'ico'); {
  const n = r.buf.readUInt16LE(4), sizes = [];
  for (let i = 0; i < n; i++) { const d = 6 + i * 16, w = r.buf[d] || 256, len = r.buf.readUInt32LE(d + 8), off = r.buf.readUInt32LE(d + 12); const m = await sharp(r.buf.subarray(off, off + len)).metadata(); if (m.width === w && m.height === w && m.hasAlpha) sizes.push(w); }
  check('transparent PNG -> ICO, every favicon size, each a real PNG', r.name.endsWith('.ico') && r.buf.readUInt16LE(2) === 1 && sizes.join() === '16,32,48,64,128,256', `sizes ${sizes.join(', ')}`);
}
r = await convert(photo, 'pdf'); { const d = await PDFDocument.load(r.buf); const s = d.getPage(0).getSize(); check('photo -> PDF, one page the size of the image', d.getPageCount() === 1 && Math.round(s.width) === pw && Math.round(s.height) === ph, `${s.width}x${s.height} pt, ${(r.buf.length / 1e6).toFixed(2)} MB`); }
if (big) { r = await convert(big, 'gif'); check('30 MP photo -> GIF under the 20 s silence watchdog', r.buf.length > 1000, `${r.secs.toFixed(1)} s`); }
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
