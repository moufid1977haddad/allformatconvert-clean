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
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exitCode = fails ? 1 : 0;
