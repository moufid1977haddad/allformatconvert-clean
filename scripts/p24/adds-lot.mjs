// P24 (03/10), additions from the second survey: compress to a target size, read every code in a picture, record with
// pause and export an MP3. Usage: node scripts/p24/adds-lot.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { ok ? passes++ : fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-adds-'));
const launchOpts = name === 'chromium' ? { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] } : name === 'firefox' ? { firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true } } : {};
const b = await { chromium, firefox, webkit }[name].launch(launchOpts);
const ctx = await b.newContext({ acceptDownloads: true, permissions: name === 'chromium' ? ['microphone'] : [] });
const open = async (slug) => { const p = await ctx.newPage(); await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(800); return p; };
const bytesOf = (p, a) => a.evaluate(async (el) => { const u = new Uint8Array(await (await fetch(el.href)).arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); }).then((s) => Buffer.from(s, 'base64'));

if (name === 'webkit') console.log('SKIP webkit image-compressor: Playwright WebKit for Windows has no OffscreenCanvas in workers (the page says so)');
else { // Image Compressor: to a target size
  const raw = Buffer.alloc(1200 * 900 * 3); for (let i = 0; i < raw.length; i++) raw[i] = (i * 2654435761 >>> 24) ^ (i % 1200); // detailed, hard to compress
  const photo = path.join(dir, 'photo.jpg'); await sharp(raw, { raw: { width: 1200, height: 900, channels: 3 } }).jpeg({ quality: 95 }).toFile(photo);
  const p = await open('image-tools/image-compressor');
  await p.locator('input[type=file]').first().setInputFiles(photo);
  await p.locator('#ic-target-mode').check(); await p.locator('#ic-target-kb').fill('40');
  await p.getByRole('button', { name: /Compress/ }).first().click();
  const a = p.locator('[data-file-download] [data-download]').first();
  const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  const out = ok ? await bytesOf(p, a) : Buffer.alloc(0);
  const text = await p.locator('main').innerText();
  const m = ok ? await sharp(out).metadata() : {};
  check('image-compressor: to 40 KB — the JPG fits (≤ 40 KB), keeps 1200×900, and says the quality chosen', ok && out.length <= 40 * 1024 && m.width === 1200 && /highest that fits in 40 KB/.test(text), `${out.length} B ${m.width}×${m.height}`);
  await p.close();
}
{ // QR Scanner: every code in one picture, barcodes included
  const ean = await bwipjs.toBuffer({ bcid: 'ean13', text: '4006381333931', scale: 3, height: 15, includetext: false, paddingwidth: 10, paddingheight: 10, backgroundcolor: 'FFFFFF' });
  const qr = await QRCode.toBuffer('https://example.com/p24', { width: 300, margin: 4 });
  const pic = path.join(dir, 'codes.png');
  const em = await sharp(ean).metadata();
  await sharp({ create: { width: 900, height: 420, channels: 3, background: '#ffffff' } }).composite([{ input: qr, left: 20, top: 60 }, { input: ean, left: 400, top: 120 }]).png().toFile(pic);
  const p = await open('qr-barcodes-tools/qr-scanner');
  await p.locator('input[type=file]').first().setInputFiles(pic);
  const listed = await p.locator('[data-codes]').innerText({ timeout: 30000 }).catch(() => '');
  check('qr-scanner: a QR code and an EAN-13 in one picture both read, with their formats', /4006381333931/.test(listed) && /example\.com\/p24/.test(listed) && /EAN/i.test(listed), listed.replace(/\n/g, ' | ').slice(0, 160) + ` (ean ${em.width}px)`);
  await p.close();
}
if (name !== 'webkit') { // Voice Recorder: pause / resume and an MP3 (the browsers' fake microphone)
  const p = await open('audio-tools/voice-recorder');
  await p.getByRole('button', { name: 'Start Recording' }).click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Pause' }).click();
  const pausedText = await p.locator('main').innerText();
  await p.waitForTimeout(600);
  await p.getByRole('button', { name: 'Resume' }).click();
  await p.waitForTimeout(1200);
  await p.getByRole('button', { name: 'Stop Recording' }).click();
  await p.getByRole('button', { name: 'Export as MP3' }).click({ timeout: 15000 });
  const a = p.locator('a[download$=".mp3"], [data-file-download][data-name$=".mp3"] a').first();
  const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
  const mp3 = ok ? await bytesOf(p, a) : Buffer.alloc(0);
  const isMp3 = mp3.length > 1000 && ((mp3[0] === 0x49 && mp3[1] === 0x44 && mp3[2] === 0x33) || (mp3[0] === 0xff && (mp3[1] & 0xe0) === 0xe0));
  check('voice-recorder: Pause says paused, Resume continues, Export as MP3 gives a real MP3', /Paused/.test(pausedText) && isMp3, `${mp3.length} B`);
  await p.close();
} else console.log('SKIP webkit voice-recorder: this test browser has no fake microphone');
if (name === 'chromium') { // Excel to PDF: each sheet on one page (Gotenberg singlePageSheets) — one engine: the work is on the server
  const XLSX = (await import('xlsx')).default || (await import('xlsx'));
  const head = Array.from({ length: 40 }, (_, i) => `Column number ${i + 1}`);
  const ws = XLSX.utils.aoa_to_sheet([head, ...Array.from({ length: 30 }, (_, r) => head.map((_, c) => `value ${r}-${c}`))]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Wide');
  const xlsx = path.join(dir, 'wide.xlsx'); fs.writeFileSync(xlsx, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  const { PDFDocument } = await import('pdf-lib');
  const pages = async (onePage) => {
    const p = await open('pdf-tools/excel-to-pdf');
    await p.locator('input[type=file]').first().setInputFiles(xlsx);
    if (onePage) await p.locator('#xl-one-page').check();
    await p.getByRole('button', { name: /Convert/ }).first().click();
    const a = p.locator('a[download]').first();
    const ok = await a.waitFor({ timeout: 120000 }).then(() => true).catch(() => false);
    const n = ok ? (await PDFDocument.load(await bytesOf(p, a))).getPageCount() : -1;
    await p.close(); return n;
  };
  const normal = await pages(false), one = await pages(true);
  check('excel-to-pdf: a 40-column sheet is cut over several pages, and on ONE page with "Fit each sheet on one page"', normal > 1 && one === 1, `${normal} pages → ${one}`);
}
{ // JPG to PDF: A4, automatic orientation, 20 mm margin
  const wide = path.join(dir, 'wide.png'); await sharp({ create: { width: 800, height: 400, channels: 3, background: '#3366cc' } }).png().toFile(wide);
  const tall = path.join(dir, 'tall.png'); await sharp({ create: { width: 300, height: 600, channels: 3, background: '#cc3333' } }).png().toFile(tall);
  const p = await open('pdf-tools/jpg-to-pdf');
  await p.locator('input[type=file]').first().setInputFiles([wide, tall]);
  await p.locator('#pl-size').selectOption('a4'); await p.locator('#pl-margin').selectOption('20');
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const a = p.locator('a[download]').first(); await a.waitFor({ timeout: 60000 });
  const { PDFDocument } = await import('pdf-lib');
  const pdf = await PDFDocument.load(await bytesOf(p, a));
  const sz = pdf.getPages().map((pg) => `${Math.round(pg.getWidth())}×${Math.round(pg.getHeight())}`).join(',');
  check('jpg-to-pdf: A4 pages, landscape for the wide picture, portrait for the tall one', sz === '842×595,595×842', sz);
  await p.close();
}
{ // Image Resizer: save as WebP; Image Flip both ways; Pixelator in % of the picture
  const src = path.join(dir, 'grad.png');
  const g = Buffer.alloc(400 * 200 * 3); for (let y = 0; y < 200; y++) for (let x = 0; x < 400; x++) { const i = (y * 400 + x) * 3; g[i] = x * 255 / 400; g[i + 1] = y * 255 / 200; g[i + 2] = 60; }
  await sharp(g, { raw: { width: 400, height: 200, channels: 3 } }).png().toFile(src);
  if (name !== 'webkit' || true) {
    const p = await open('image-tools/image-resizer');
    await p.locator('input[type=file]').first().setInputFiles(src);
    await p.waitForTimeout(500);
    await p.getByRole('button', { name: /50%/ }).first().click().catch(() => {});
    await p.locator('#rs-format').selectOption('image/webp');
    await p.getByRole('button', { name: /^Resize/ }).first().click();
    const a = p.locator('[data-file-download] a[data-download], a[download]').first();
    const ok = await a.waitFor({ timeout: 60000 }).then(() => true).catch(() => false);
    const out = ok ? await bytesOf(p, a) : Buffer.alloc(0);
    const m = ok ? await sharp(out).metadata() : {};
    check('image-resizer: saved as WebP when asked (a PNG source)', m.format === 'webp', `${m.format} ${m.width}×${m.height}`);
    await p.close();
  }
  const f = await open('image-tools/image-flip');
  await f.locator('input[type=file]').first().setInputFiles(src);
  await f.getByRole('button', { name: 'Flip Both Ways' }).click();
  const fa = f.locator('[data-file-download] a[data-download], a[download]').first(); await fa.waitFor({ timeout: 60000 });
  const fb = await bytesOf(f, fa);
  const px = async (buf, x, y) => [...await sharp(buf).removeAlpha().extract({ left: x, top: y, width: 1, height: 1 }).raw().toBuffer()];
  const [tl, srcBr] = [await px(fb, 0, 0), await px(await fs.promises.readFile(src), 399, 199)];
  check('image-flip: both ways = the bottom-right pixel comes to the top-left', Math.abs(tl[0] - srcBr[0]) < 4 && Math.abs(tl[1] - srcBr[1]) < 4, `${tl} vs ${srcBr}`);
  await f.close();
}
{ // Find & Replace: whole words, ignore case; Diff Viewer: changed words marked
  const p = await open('text-tools/find-replace');
  await p.locator('textarea').first().fill('Cat cat catalog café');
  const inputs = p.locator('main input[type=text]'); // not the site's search box in the header
  await inputs.nth(0).fill('cat'); await inputs.nth(1).fill('dog');
  await p.locator('#fr-case').check(); await p.locator('#fr-word').check();
  await p.getByRole('button', { name: /Replace/ }).first().click();
  const out = await p.getByLabel('Result').inputValue();
  check('find-replace: whole words, ignoring case — "catalog" left alone', /dog dog catalog café/.test(out), out);
  await p.close();
  const d = await open('developer-tools/diff-viewer');
  await d.locator('textarea').nth(0).fill('the quick brown fox'); await d.locator('textarea').nth(1).fill('the slow brown fox');
  await d.getByRole('button', { name: /Compare/ }).first().click();
  await d.locator('span.rounded').first().waitFor({ timeout: 15000 }).catch(() => {}); // the diff library loads on demand
  const marked = await d.locator('span.rounded').allInnerTexts();
  check('diff-viewer: only "quick" and "slow" are marked inside the changed line', marked.join('|') === 'quick|slow', marked.join('|'));
  await d.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exitCode = fails ? 1 : 0;
