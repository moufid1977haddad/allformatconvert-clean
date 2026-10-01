// P21 phase 3 (02/10): JPG to PDF / Image to PDF take every image a visitor has (iLovePDF and Smallpdf: JPG, PNG, BMP,
// GIF, TIFF; plus iPhone HEIC, WebP, AVIF). One real file per format → one PDF; read back with pdf-lib: one page per
// image, each page the image's size; a damaged file is named in a message, never skipped silently.
// Usage: node scripts/browser-tests/p21-jpg-to-pdf-formats.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-j2p-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };

const base = sharp({ create: { width: 640, height: 480, channels: 3, background: '#3a7bd5' } });
const files = [];
// Playwright's WebKit on Windows has no AVIF decoder (Safari 16+ has one): AVIF left out there only.
const FORMATS = [['webp', (s) => s.webp()], ['gif', (s) => s.gif()], ['tif', (s) => s.tiff()], ['avif', (s) => s.avif()]].filter(([e]) => !(name === 'webkit' && e === 'avif'));
if (name === 'webkit') console.log('SKIP webkit AVIF: no AVIF decoder in Playwright WebKit on Windows');
for (const [ext, fn] of FORMATS) {
  const p = path.join(dir, `img.${ext}`); fs.writeFileSync(p, await fn(base.clone()).toBuffer()); files.push(p);
}
const heic = path.join('scripts', 'audit', 'fixtures', 'files', 'sample.heic');
const bmp = path.join('scripts', 'audit', 'fixtures', 'files', 'sample.bmp');
for (const f of [heic, bmp]) if (fs.existsSync(f)) files.push(f);
const broken = path.join(dir, 'broken.webp'); fs.writeFileSync(broken, Buffer.from('RIFF0000WEBPVP8 not really an image'));

const b = await engine.launch();
for (const slug of ['jpg-to-pdf', 'image-to-pdf']) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(files);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const ok = await p.locator('[data-file-download]').first().waitFor({ timeout: 120000 }).then(() => true, () => false);
  if (!ok) { check(`${slug}: a PDF from ${files.length} formats`, false, (await p.locator('p[role=alert]').allInnerTexts()).join(' ') + errors.join(' | ')); await ctx.close(); continue; }
  const bytes = Buffer.from(await p.locator('[data-file-download] a[data-download]').first().evaluate(async (a) => Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer()))));
  const pdf = await PDFDocument.load(bytes);
  const sizes = pdf.getPages().map((pg) => pg.getSize()).map((s) => `${Math.round(s.width)}x${Math.round(s.height)}`);
  check(`${slug}: ${files.map((f) => path.extname(f)).join(' ')} → one PDF of ${files.length} pages`, pdf.getPageCount() === files.length && sizes.slice(0, FORMATS.length).every((s) => s === '640x480'), sizes.join(', '));
  check(`${slug}: no page error`, !errors.length, errors.join(' | '));
  // A damaged file: a message naming it, no PDF
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(broken);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  await p.waitForTimeout(5000);
  const msg = (await p.locator('p[role=alert]').allInnerTexts()).join(' ');
  check(`${slug}: a damaged image is named in a message`, /broken\.webp/.test(msg) && !(await p.locator('[data-file-download]').count()), msg);
  await ctx.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
