// P21 phase 3 (02/10): Merge PDF takes images and Office documents too (Smallpdf: "combine PDF documents with other
// PDFs, Word, Excel, and image files like JPG and PNG"). A 2-page PDF + a JPG + a PNG (+ an .odt with --office, which
// goes through our LibreOffice server: preview or www only) → one PDF whose pages are in the list's order, read back
// with pdf-lib; the server note appears only when an Office file is in the list.
// Usage: node scripts/browser-tests/p21-merge-mixed.mjs <origin> [--browser=…] [--office] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const office = process.argv.includes('--office');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-merge-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };

const pdfPath = path.join(dir, 'two-pages.pdf');
{ const d = await PDFDocument.create(); d.addPage([612, 792]); d.addPage([612, 792]); fs.writeFileSync(pdfPath, await d.save()); }
const jpg = path.join(dir, 'photo.jpg'); await sharp({ create: { width: 800, height: 600, channels: 3, background: '#cc3333' } }).jpeg().toFile(jpg);
const png = path.join(dir, 'chart.png'); await sharp({ create: { width: 300, height: 500, channels: 4, background: '#3333cc80' } }).png().toFile(png);
const odt = path.join('docs', 'audit', 'fixtures-p21-office', 'text.odt');
const files = office ? [pdfPath, jpg, odt, png] : [pdfPath, jpg, png];

const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
const p = await ctx.newPage();
const errors = []; p.on('pageerror', (e) => errors.push(e.message));
await p.goto(`${origin}/tools/pdf-tools/pdf-merge`, { waitUntil: 'load' });
await p.waitForTimeout(1000);
await p.locator('input[type=file]').first().setInputFiles(files);
const note = await p.getByText('converted to PDF on our server first').count();
check(`server note shown only with an Office file (${office ? 'yes' : 'no'})`, office ? note === 1 : note === 0, `count ${note}`);
await p.getByRole('button', { name: 'Merge PDFs' }).click();
const ok = await p.locator('[data-file-download]').first().waitFor({ timeout: 180000 }).then(() => true, () => false);
if (!ok) check('a merged PDF', false, (await p.locator('.text-red-600').allInnerTexts()).join(' ') + errors.join(' | '));
else {
  const bytes = Buffer.from(await p.locator('[data-file-download] a[data-download]').first().evaluate(async (a) => Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer()))));
  const pdf = await PDFDocument.load(bytes);
  const sizes = pdf.getPages().map((pg) => pg.getSize()).map((s) => `${Math.round(s.width)}x${Math.round(s.height)}`);
  const expected = office ? ['612x792', '612x792', '800x600', '*', '300x500'] : ['612x792', '612x792', '800x600', '300x500'];
  const okOrder = sizes.length === expected.length && expected.every((e, i) => e === '*' || sizes[i] === e);
  check(`pages in the list's order: ${sizes.join(', ')}`, okOrder, `expected ${expected.join(', ')}`);
}
check('no page error', !errors.length, errors.join(' | '));
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
