// Image to PDF / JPG to PDF with iPhone-size photos (30/09): a 24 MP WebP (drawn upright, not embedded as is) and a
// 24 MP JPEG with a mirrored EXIF orientation (2) went through ONE canvas the size of the photo, which iOS refuses
// past 16.7 MP. With window.__forceSafariCanvasCap (the iPhone path: bands), the PDF must hold one page per image,
// the size of the image as displayed, with the picture right (marker position), embedded as JPEG (opaque photo).
// Usage: node scripts/browser-tests/pdf-images-big.mjs <origin> [--browser=firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const origin = new URL(process.argv[2] || 'http://localhost:3100').origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : process.argv.includes('--browser=webkit') ? webkit : chromium;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdfimg-'));
const W = 5712, H = 4284, raw = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 3; raw[i] = 40; raw[i + 1] = (x * 200 / W) | 0; raw[i + 2] = 160; }
for (let y = 0; y < H / 8; y++) for (let x = 0; x < W / 8; x++) { const i = (y * W + x) * 3; raw[i] = 255; raw[i + 1] = 0; raw[i + 2] = 0; }
const webp = path.join(dir, 'IMG_A.webp'); fs.writeFileSync(webp, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 85 }).toBuffer());
const mirrored = path.join(dir, 'IMG_B.jpg'); fs.writeFileSync(mirrored, await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).withMetadata({ orientation: 2 }).toBuffer());
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
// Chromium crops EXIF-rotated bands wrongly (bigImage.js), so it never takes the iPhone path: normal path there.
if (engine !== chromium) await ctx.addInitScript(() => { window.__forceSafariCanvasCap = true; });
const p = await ctx.newPage();
await p.goto(origin + '/tools/pdf-tools/image-to-pdf', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles([webp, mirrored]);
await p.getByRole('button', { name: /Convert|Create PDF/ }).first().click();
const link = p.getByRole('link', { name: /Download PDF/ });
await link.waitFor({ timeout: 300000 });
const [d] = await Promise.all([p.waitForEvent('download'), link.click()]);
const f = path.join(dir, d.suggestedFilename()); await d.saveAs(f);
const pdf = await PDFDocument.load(fs.readFileSync(f));
const sizes = pdf.getPages().map((pg) => pg.getSize()).map((s) => `${Math.round(s.width)}x${Math.round(s.height)}`);
const bytes = fs.readFileSync(f);
const jpegs = (bytes.toString('latin1').match(/\/DCTDecode/g) || []).length;
const ok = pdf.getPageCount() === 2 && sizes.every((s) => s === `${W}x${H}`) && jpegs === 2 && d.suggestedFilename() === 'IMG_A-and-1-more.pdf' && bytes.length < 20e6;
console.log(ok ? 'PASS' : 'FAIL', `(${engine.name()}${engine === chromium ? "" : ", iPhone path"}) 2 x 24 MP (WebP + mirrored JPEG) -> ${pdf.getPageCount()} pages ${sizes.join(', ')}, ${jpegs} JPEG images, ${(bytes.length / 1e6).toFixed(1)} MB, ${d.suggestedFilename()}`);
await b.close(); process.exit(ok ? 0 : 1);
