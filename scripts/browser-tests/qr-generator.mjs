// QR Code Generator, real page: every content type downloaded as PNG and SVG and decoded here with jsQR
// (independently of the page's own check), the PDF opened, a logo, and the refusal of light-on-dark.
// Usage: node scripts/browser-tests/qr-generator.mjs <origin or _vercel_share URL> <logo.png> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';
const [entry, logo] = process.argv.slice(2); const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const page = await (await b.newContext({ acceptDownloads: true })).newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const decode = async (buf) => { const { data, info } = await sharp(buf, { density: 150 }).resize(800, 800).flatten({ background: '#fff' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const r = jsQR(new Uint8ClampedArray(data), info.width, info.height); return r ? new TextDecoder().decode(new Uint8Array(r.binaryData)) : null; };
const dl = async (name) => { const [d] = await Promise.all([page.waitForEvent('download'), page.locator(`a[download="qrcode.${name.toLowerCase()}"]`).click()]); return fs.readFileSync(await d.path()); };
await page.goto(origin + '/tools/qr-barcodes-tools/qr-generator', { waitUntil: 'networkidle' });
const cases = [
  ['URL', { 'qr-url': 'example.com/path?q=1' }, 'https://example.com/path?q=1'],
  ['Text', { 'qr-text': 'Héllo wörld — 你好 👍' }, 'Héllo wörld — 你好 👍'],
  ['Email', { 'qr-to': 'a@b.co', 'qr-subject': 'Hi there' }, 'mailto:a@b.co?subject=Hi%20there'],
  ['Phone', { 'qr-phone': '+33 1 23 45 67 89' }, 'tel:+33123456789'],
  ['SMS', { 'qr-phone': '555-0100', 'qr-message': 'On my way' }, 'SMSTO:5550100:On my way'],
  ['Wi-Fi', { 'qr-ssid': 'Café;Net', 'qr-password': 'p:ss' }, String.raw`WIFI:T:WPA;S:Café\;Net;P:p\:ss;;`],
  ['Contact (vCard)', { 'qr-firstName': 'Ana', 'qr-lastName': 'Silva', 'qr-phone': '+1 555 010 2030' }, 'BEGIN:VCARD\r\nVERSION:3.0\r\nN:Silva;Ana;;;\r\nFN:Ana Silva\r\nTEL;TYPE=CELL:+15550102030\r\nEND:VCARD'],
  ['Location', { 'qr-lat': '48.8584', 'qr-lng': '2.2945' }, 'geo:48.8584,2.2945'],
];
for (const [label, fields, want] of cases) {
  await page.getByRole('radio', { name: label, exact: true }).click();
  for (const [id, v] of Object.entries(fields)) await page.locator('#' + id).fill(v);
  await page.getByRole('button', { name: 'Generate QR Code' }).click();
  await page.getByText('Scanned back successfully').waitFor({ timeout: 30000 }).catch(async (e) => { console.log('PAGE SAYS:', await page.locator('[role=alert]').allInnerTexts()); throw e; });
  const png = await dl('PNG'), svg = await dl('SVG'), pdf = await dl('PDF');
  const meta = await sharp(png).metadata();
  const got = await decode(png); if (got !== want) console.log('DECODED:', JSON.stringify(got), 'WANT:', JSON.stringify(want));
  check(label, got === want && (await decode(svg)) === want && (await PDFDocument.load(pdf)).getPageCount() === 1, `PNG ${meta.width}px, SVG and PDF ok`);
}
await page.getByRole('radio', { name: 'URL', exact: true }).click();
await page.locator('#qr-url').fill('https://www.onlineconvertools.com');
await page.getByRole('button', { name: 'Dots' }).click();
{ await page.getByRole('button', { name: 'Generate QR Code' }).click(); await page.getByText('Scanned back successfully').waitFor({ timeout: 30000 }); check('dots without logo', (await decode(await dl('PNG'))) === 'https://www.onlineconvertools.com'); }
await page.locator('input[type=file]').setInputFiles(logo);
await page.getByText('High is required with a logo.').waitFor();
await page.getByRole('button', { name: 'Generate QR Code' }).click();
await page.getByText('Scanned back successfully').waitFor({ timeout: 30000 }).catch(async (e) => { console.log('PAGE SAYS:', await page.locator('[role=alert]').allInnerTexts()); throw e; });
check('logo + dots, forced to level H', (await decode(await dl('PNG'))) === 'https://www.onlineconvertools.com');
await page.locator('input[aria-label="Code colour"]').fill('#ffffff');
await page.locator('input[aria-label="Background colour"]').fill('#000000');
await page.getByRole('button', { name: 'Generate QR Code' }).click();
check('light code on dark background refused', await page.getByText('must be darker than its background').count() === 1 && await page.locator('a[download="qrcode.png"]').count() === 0);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
