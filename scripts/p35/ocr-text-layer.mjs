// P35 (06/10) — PDF OCR, decision left open by P33: a page that already has its own selectable text does not get the
// OCR layer too (its text would be copied twice; OCRmyPDF --skip-text and Adobe Acrobat do the same), while a scanned
// page (a picture) still does. Desktop Chromium, the browser's own OCR (Tesseract.js from its CDN).
//   node scripts/p35/ocr-text-layer.mjs <origin>
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

const origin = new URL(process.argv[2]).origin;
const KIT = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const OUT = path.join(os.tmpdir(), 'p35-ocr-text-layer');
fs.mkdirSync(OUT, { recursive: true });
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `— ${info}`); };

// a scanned copy of the kit: each page drawn at 150 dpi, put back as a picture (no text at all)
execFileSync('pdftoppm', ['-r', '150', '-png', KIT, path.join(OUT, 'scan')]);
const scan = await PDFDocument.create();
for (const f of fs.readdirSync(OUT).filter((f) => /^scan-\d+\.png$/.test(f)).sort()) {
  const img = await scan.embedPng(fs.readFileSync(path.join(OUT, f)));
  scan.addPage([595.44, 841.92]).drawImage(img, { x: 0, y: 0, width: 595.44, height: 841.92 });
}
const SCAN = path.join(OUT, 'scanned.pdf');
fs.writeFileSync(SCAN, await scan.save());
const count = (s, w) => s.split(w).length - 1;

const b = await chromium.launch();
async function run(pdf) {
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(pdf);
  await p.getByRole('button', { name: 'Run OCR' }).click();
  await p.waitForFunction(() => !!document.querySelector('p[role=alert]') || !!document.querySelector('[data-file-download] a'), null, { timeout: 180000 });
  const note = await p.locator('[data-ocr-text-note]').innerText().catch(() => '');
  const text = await p.locator('textarea[aria-label="Recognized Text"]').inputValue().catch(() => '');
  const file = path.join(OUT, `out-${path.basename(pdf)}`);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
  await dl.saveAs(file);
  await ctx.close();
  return { note, text, pdfText: execFileSync('pdftotext', ['-raw', file, '-']).toString() };
}
let r = await run(KIT);
check(`PDF with its own text: the note says so ("${r.note}")`, /Pages 1, 2 and 3 already had selectable text/.test(r.note), r.note);
check('… the recognized text is still shown', /photo-2\.jpg/.test(r.text));
check('… its text is not doubled in the searchable PDF (photo-2.jpg once)', count(r.pdfText, 'photo-2.jpg') === 1, `${count(r.pdfText, 'photo-2.jpg')} times`);
r = await run(SCAN);
check('scanned PDF: no such note', !r.note, r.note);
check('… the searchable PDF gets the recognized text', /photo-2\.jpg/.test(r.pdfText) && count(r.pdfText, 'photo-2.jpg') === 1, r.pdfText.slice(0, 200));
await b.close();
console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
