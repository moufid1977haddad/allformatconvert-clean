// QR Scanner on a 48 MP photo (30/09: the photo went on one canvas at full size, refused by iOS past 16.7 MP): a
// 900 px QR code inside an 8064x6048 photo must still be read (decoded at <= 12 Mpx).
// Usage: node scripts/browser-tests/qr-scanner-big-photo.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import QRCode from 'qrcode';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const T = 'BIG-PHOTO-QR-' + Date.now();
const qr = await sharp(await QRCode.toBuffer(T, { width: 900, margin: 4 })).toBuffer();
const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'qrbig-')), 'IMG_48MP.jpg');
fs.writeFileSync(f, await sharp({ create: { width: 8064, height: 6048, channels: 3, background: '#8899aa' }, limitInputPixels: false }).composite([{ input: qr, left: 3500, top: 2500 }]).jpeg({ quality: 90 }).toBuffer());
const b = await engine.launch(); const p = await b.newPage();
await p.goto(origin + '/tools/qr-barcodes-tools/qr-scanner', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles(f);
const got = await p.locator('[data-text]').textContent({ timeout: 60000 }).catch(() => null);
console.log(got === T ? 'PASS' : 'FAIL', `(${engine.name()}) 48 MP photo: ${JSON.stringify(got)}`);
await b.close(); process.exit(got === T ? 0 : 1);
