// P24 (03/10), image lot: each option added this night, used as a visitor would, each result reopened with sharp / exifr.
// Usage: node scripts/p24/image-lot.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar] [--only=a,b]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import exifr from 'exifr';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const name = arg('browser') || 'chromium';
const only = (arg('only') || '').split(',').filter(Boolean);
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-img-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const save = async (n, buf) => { const p = path.join(dir, n); fs.writeFileSync(p, await buf); return p; };

// fixtures: a photo-like gradient, a non-square logo with transparency, an SVG, a JPEG with GPS and orientation 6
const raw = Buffer.alloc(400 * 300 * 3); for (let y = 0; y < 300; y++) for (let x = 0; x < 400; x++) { const i = (y * 400 + x) * 3; raw[i] = x * 255 / 400; raw[i + 1] = y * 255 / 300; raw[i + 2] = 120; }
const photoPng = await save('photo.png', sharp(raw, { raw: { width: 400, height: 300, channels: 3 } }).png().toBuffer());
const photoJpg = await save('photo.jpg', sharp(raw, { raw: { width: 400, height: 300, channels: 3 } }).jpeg({ quality: 92 }).toBuffer());
const big = await save('big.jpg', sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#468' } }).jpeg().toBuffer());
const logo = await save('logo.png', sharp({ create: { width: 300, height: 100, channels: 4, background: { r: 200, g: 30, b: 30, alpha: 1 } } }).png().toBuffer());
const pureRed = await save('red.png', sharp({ create: { width: 50, height: 50, channels: 3, background: '#ff0000' } }).png().toBuffer());
const svg = path.join(dir, 'icon.svg'); fs.writeFileSync(svg, '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50"><circle cx="50" cy="25" r="20" fill="#06c"/></svg>');
const gps = await save('gps.jpg', sharp(raw, { raw: { width: 400, height: 300, channels: 3 } }).jpeg({ quality: 90 }).withMetadata({ orientation: 6 }).withExif({ IFD0: { Make: 'TestCam' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '45/1 30/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '73/1 34/1 0/1' } }).toBuffer());

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
async function open(slug) { const p = await ctx.newPage(); await p.goto(`${origin}/tools/image-tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(800); return p; }
async function result(p, timeout = 60000) {
  const ok = await p.locator('[data-file-download] [data-download]').first().waitFor({ timeout }).then(() => true).catch(() => false);
  if (!ok) return { alert: (await p.locator('main').innerText()).slice(0, 300) };
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await (async () => { for (let i = 0; i < 100 && !a.getAttribute('href'); i++) await new Promise((r) => setTimeout(r, 100)); return fetch(a.href); })();
    const u = new Uint8Array(await res.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
  });
  return { bytes: Buffer.from(b64, 'base64') };
}
const want = (k) => !only.length || only.includes(k);
const px = async (buf, x, y) => [...await sharp(buf).ensureAlpha().extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer()];

if (want('webp')) {
  const p = await open('png-to-webp');
  await p.locator('input[type=file]').first().setInputFiles(photoPng);
  await p.locator('#webp-lossless').check();
  await p.getByRole('button', { name: 'Convert', exact: true }).click();
  let r = await result(p);
  if (!r.bytes) check('png-to-webp lossless', false, r.alert); else {
    const [a, c] = await Promise.all([sharp(photoPng).raw().toBuffer(), sharp(r.bytes).removeAlpha().raw().toBuffer()]);
    check('png-to-webp: lossless WebP has exactly the PNG pixels', (await sharp(r.bytes).metadata()).format === 'webp' && a.equals(c));
  }
  await p.locator('#webp-lossless').uncheck();
  await p.locator('#webp-quality').fill('20');
  await p.getByRole('button', { name: 'Convert', exact: true }).click();
  const lo = await result(p);
  await p.locator('#webp-quality').fill('95');
  await p.getByRole('button', { name: 'Convert', exact: true }).click();
  const hi = await result(p);
  check('png-to-webp: quality 20 gives a smaller file than quality 95', lo.bytes && hi.bytes && lo.bytes.length < hi.bytes.length, `${lo.bytes?.length} < ${hi.bytes?.length}`);
  await p.close();
}

if (want('metadata')) {
  const p = await open('image-metadata');
  await p.locator('input[type=file]').first().setInputFiles(gps);
  await p.getByRole('button', { name: 'Remove metadata' }).click();
  const r = await result(p);
  if (!r.bytes) check('image-metadata remove', false, r.alert); else {
    const e = await exifr.parse(r.bytes, { gps: true }).catch(() => null);
    const [a, c] = await Promise.all([sharp(gps).raw().toBuffer(), sharp(r.bytes).raw().toBuffer()]);
    check('image-metadata: GPS and camera removed, pixels identical, orientation kept', !e?.latitude && !e?.Make && a.equals(c) && (await sharp(r.bytes).metadata()).orientation === 6, JSON.stringify(e || {}).slice(0, 80));
  }
  await p.close();
}

if (want('rotate')) {
  const p = await open('image-rotate');
  await p.locator('input[type=file]').first().setInputFiles(photoJpg);
  await p.locator('#rot-angle').fill('30');
  await p.locator('#rot-bg').selectOption('color');
  await p.locator('#rot-bg-color').fill('#ff0000');
  await p.getByRole('button', { name: /^Rotate/ }).click();
  const r = await result(p);
  if (!r.bytes) check('image-rotate colour corners', false, r.alert); else {
    const m = await sharp(r.bytes).metadata(); const c = await px(r.bytes, 1, 1);
    check('image-rotate: 30° with red corners stays a JPG, corner red', m.format === 'jpeg' && c[0] > 200 && c[1] < 60 && c[2] < 60, `${m.format} ${m.width}x${m.height} corner ${c}`);
  }
  await p.close();
}

if (want('ico')) {
  const p = await open('png-to-ico');
  await p.locator('input[type=file]').first().setInputFiles(logo);
  for (const s of ['16x16', '32x32', '48x48', '256x256', '24x24', '128x128']) await p.getByRole('button', { name: s, exact: true }).click(); // off: 16 32 48 256; on: 24 128
  await p.locator('#ico-fit').selectOption('fill');
  await p.getByRole('button', { name: 'Convert to ICO' }).click();
  const r = await result(p);
  if (!r.bytes) check('png-to-ico', false, r.alert); else {
    const n = r.bytes.readUInt16LE(4), sizes = []; let corner = null;
    for (let i = 0; i < n; i++) { const e = 6 + i * 16; sizes.push(r.bytes[e] || 256); if ((r.bytes[e] || 256) === 128) { const off = r.bytes.readUInt32LE(e + 12), len = r.bytes.readUInt32LE(e + 8); corner = await px(r.bytes.subarray(off, off + len), 0, 0); } }
    check('png-to-ico: exactly 24 and 128 px, filled (corner opaque red, no margin)', sizes.sort((a, c) => a - c).join() === '24,128' && corner && corner[3] === 255 && corner[0] > 150, `${sizes} corner ${corner}`);
  }
  await p.close();
}

if (want('grayscale')) {
  const p = await open('grayscale-converter');
  await p.locator('input[type=file]').first().setInputFiles(pureRed);
  await p.locator('#gs-method').selectOption('red');
  await p.getByRole('button', { name: 'Convert to Grayscale' }).click();
  let r = await result(p);
  check('grayscale: "red channel" turns pure red into white', !!r.bytes && (await px(r.bytes, 5, 5))[0] === 255, r.alert || '');
  await p.locator('input[type=file]').first().setInputFiles(photoPng);
  await p.locator('#gs-method').selectOption('rec709');
  await p.locator('#gs-bw').check();
  await p.getByRole('button', { name: 'Convert to Grayscale' }).click();
  await p.waitForTimeout(300);
  r = await result(p);
  if (!r.bytes) check('grayscale black and white', false, r.alert); else {
    const d = await sharp(r.bytes).raw().toBuffer(); const vals = new Set(); for (let i = 0; i < d.length; i++) vals.add(d[i]);
    check('grayscale: pure black and white has only 0 and 255', [...vals].every((v) => v === 0 || v === 255), [...vals].slice(0, 6).join(','));
  }
  await p.close();
}

if (want('svg')) {
  const p = await open('svg-to-png');
  await p.locator('input[type=file]').first().setInputFiles(svg);
  await p.waitForTimeout(500);
  await p.locator('input[name=svg-bg]').nth(1).check();
  await p.getByRole('button', { name: '1024 px wide' }).click();
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const r = await result(p);
  if (!r.bytes) check('svg-to-png background', false, r.alert); else {
    const m = await sharp(r.bytes).metadata(), c = await px(r.bytes, 2, 2);
    check('svg-to-png: 1024 × 512 px, white background where the SVG is transparent', m.width === 1024 && m.height === 512 && c[0] === 255 && c[3] === 255, `${m.width}x${m.height} corner ${c}`);
  }
  await p.close();
}

if (want('crop')) {
  const p = await open('image-cropper');
  await p.locator('input[type=file]').first().setInputFiles(big);
  await p.waitForTimeout(800);
  await p.locator('#crop-ratio').selectOption('16:9');
  await p.getByRole('button', { name: 'Crop Image' }).click();
  const r = await result(p);
  if (!r.bytes) check('image-cropper 16:9', false, r.alert); else {
    const m = await sharp(r.bytes).metadata();
    check('image-cropper: 16:9 on a 4000 × 3000 photo gives 4000 × 2250 real pixels', m.width === 4000 && m.height === 2250, `${m.width}x${m.height}`);
  }
  await p.close();
}

if (want('text')) {
  const p = await open('add-text-to-image');
  await p.locator('input[type=file]').first().setInputFiles(photoJpg);
  await p.getByLabel('Text', { exact: true }).fill('TOP\nLINE');
  await p.locator('#tx-font').selectOption({ label: 'Impact (memes)' });
  await p.locator('#tx-outline').fill('6');
  await p.getByRole('button', { name: 'Apply Text' }).click();
  const r = await result(p);
  if (!r.bytes) check('add-text', false, r.alert); else {
    const m = await sharp(r.bytes).metadata();
    const [a, c] = await Promise.all([sharp(photoJpg).raw().toBuffer(), sharp(r.bytes).raw().toBuffer()]);
    let diff = 0; for (let i = 0; i < a.length; i++) if (Math.abs(a[i] - c[i]) > 40) diff++;
    // two lines with a black outline: many pixels changed, black among them (the outline)
    const blackish = (() => { let n = 0; for (let i = 0; i < c.length; i += 3) if (c[i] < 30 && c[i + 1] < 30 && c[i + 2] < 30) n++; return n; })();
    check('add-text: two lines, Impact, black outline drawn; same size, still a JPG', m.format === 'jpeg' && m.width === 400 && diff > 2000 && blackish > 200, `changed ${diff}, black ${blackish}`);
  }
  await p.close();
}

if (want('blur')) { // relevé n° 2: the browser filter made the edges half transparent (whitish frame in a JPG)
  const red = await save('red.jpg', sharp({ create: { width: 200, height: 150, channels: 3, background: { r: 220, g: 20, b: 20 } } }).jpeg({ quality: 95 }).toBuffer());
  const p = await open('image-blur');
  await p.locator('input[type=file]').first().setInputFiles(red);
  await p.locator('input[type=range]').first().fill('10');
  await p.getByRole('button', { name: /Apply|Blur/ }).first().click();
  const r = await result(p);
  const corner = r.bytes ? await px(r.bytes, 0, 0) : [], edge = r.bytes ? await px(r.bytes, 100, 0) : [];
  check('image-blur: a plain red picture stays red to its corners (no whitish frame)', corner[0] > 190 && corner[1] < 60 && edge[0] > 190 && edge[1] < 60, `corner ${corner} edge ${edge}`);
  await p.close();
}
if (want('vignette')) { // relevé n° 2: the dark veil covered the transparent areas of a PNG
  const logo = await save('logo.png', sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: { create: { width: 80, height: 80, channels: 4, background: { r: 30, g: 120, b: 220, alpha: 1 } } }, left: 60, top: 60 }]).png().toBuffer());
  const p = await open('add-vignette');
  await p.locator('input[type=file]').first().setInputFiles(logo);
  await p.getByRole('button', { name: /Apply|Add/ }).first().click();
  const r = await result(p);
  const corner = r.bytes ? await px(r.bytes, 2, 2) : [], center = r.bytes ? await px(r.bytes, 100, 100) : [];
  check('add-vignette: transparent corners stay transparent, the logo stays opaque', corner[3] === 0 && center[3] === 255, `corner ${corner} center ${center}`);
  await p.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
