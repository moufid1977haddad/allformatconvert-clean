// P21 phase 7 (02/10) — the five tools the prompt still called "coming soon" are live since 23/09; checked here:
//   PDF Repair      REAL, our pdf-tools service (no per-call cost): a PDF whose cross-reference table is broken →
//                   a PDF that opens, all pages kept.
//   PDF to PDF/A    REAL, same service: the page shows veraPDF's verdict, the file declares PDF/A (XMP pdfaid).
//   PDF to Excel / PDF to PowerPoint / Image Generator: the PAID provider is PLAYED (ConvertAPI, OpenAI): the page
//                   flow, the file handed over (real XLSX / PPTX / WebP+PNG) and its name; no paid call.
// Usage: node scripts/browser-tests/p21-phase7.mjs <origin (preview relay or www)> [--browser=…] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, StandardFonts, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
import sharp from 'sharp';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3200').origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const engine = { chromium, firefox, webkit }[name];
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p21-p7-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

// a 4-page PDF, then broken: its "startxref" offset points nowhere
const good = await (async () => { const d = await PDFDocument.create(); const f = await d.embedFont(StandardFonts.Helvetica); for (let i = 1; i <= 4; i++) d.addPage([400, 300]).drawText(`Page ${i}`, { x: 40, y: 150, size: 30, font: f }); return Buffer.from(await d.save({ useObjectStreams: false })); })();
const broken = Buffer.from(good.toString('latin1').replace(/startxref\s+\d+/, 'startxref\n999999'), 'latin1');
const brokenPath = path.join(dir, 'broken.pdf'); fs.writeFileSync(brokenPath, broken);
const goodPath = path.join(dir, 'report.pdf'); fs.writeFileSync(goodPath, good);

const b = await engine.launch();
async function page(slug, mocks = {}) {
  const ctx = await b.newContext({ acceptDownloads: true });
  if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
  for (const [route, fn] of Object.entries(mocks)) await ctx.route(route, fn);
  const p = await ctx.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/${slug}`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  return { ctx, p, errors };
}
const bytesOf = (p) => p.locator('[data-file-download] a[data-download]').first().evaluate(async (a) => {
  const blob = await (await fetch(a.href)).blob();
  return new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1]); fr.readAsDataURL(blob); });
}).then((b64) => Buffer.from(b64, 'base64'));

// ---- PDF Repair (real) ----
{
  const { ctx, p, errors } = await page('pdf-tools/pdf-repair');
  await p.locator('input[type=file]').first().setInputFiles(brokenPath);
  await p.getByRole('button', { name: /Repair/ }).first().click();
  const ok = await p.locator('[data-file-download]').first().waitFor({ timeout: 180000 }).then(() => true, () => false);
  if (!ok) check('PDF Repair: a repaired PDF', false, (await p.locator('main').innerText()).slice(0, 300));
  else {
    const out = await bytesOf(p);
    const doc = await PDFDocument.load(out).catch((e) => e);
    check(`PDF Repair: broken cross-reference → a PDF that opens with all 4 pages (${doc.getPageCount ? doc.getPageCount() : String(doc)})`, doc.getPageCount && doc.getPageCount() === 4 && !errors.length, errors.join(' | '));
  }
  await ctx.close();
}
// ---- PDF to PDF/A (real) ----
for (const lvl of ['2b', '1b', '3b']) {
  const { ctx, p, errors } = await page('pdf-tools/pdf-to-pdfa');
  await p.locator('input[type=file]').first().setInputFiles(goodPath);
  await p.locator('select').first().selectOption(lvl);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const ok = await p.locator('[data-file-download]').first().waitFor({ timeout: 180000 }).then(() => true, () => false);
  const text = await p.locator('main').innerText();
  if (!ok) check(`PDF/A-${lvl}: a file`, false, text.slice(0, 300));
  else {
    // the XMP packet (often compressed, attributes in single quotes) read through pdf-lib
    const doc = await PDFDocument.load(await bytesOf(p));
    const m = doc.catalog.lookup(PDFName.of('Metadata'));
    const xmp = m ? Buffer.from(m instanceof PDFRawStream ? decodePDFRawStream(m).decode() : m.getContents()).toString('utf8') : '';
    const part = (/pdfaid:part(?:=['"]|>)(\d)/.exec(xmp) || [])[1], conf = (/pdfaid:conformance(?:=['"]|>)([AB])/i.exec(xmp) || [])[1];
    check(`PDF/A-${lvl}: file declares PDF/A-${part}${(conf || '').toLowerCase()}, page shows veraPDF's verdict`, part === lvl[0] && (conf || '').toLowerCase() === 'b' && /veraPDF/i.test(text) && /compliant|passed|valid/i.test(text) && !errors.length, text.match(/veraPDF[^\n]{0,120}/)?.[0] || '');
  }
  await ctx.close();
}
// ---- PDF to Excel / PowerPoint (ConvertAPI played) ----
for (const [slug, file, mime, ext] of [['pdf-to-excel', 'docs/audit/fixtures-fidelite/fidelite-03.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx'], ['pdf-to-ppt', 'docs/audit/fixtures-fidelite/fidelite-05.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'pptx']]) {
  let calls = 0;
  const { ctx, p, errors } = await page(`pdf-tools/${slug}`, { [`**/api/${slug}`]: (r) => { calls++; r.fulfill({ status: 200, contentType: mime, body: fs.readFileSync(file) }); } });
  await p.locator('input[type=file]').first().setInputFiles(goodPath);
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const ok = await p.locator('[data-file-download]').first().waitFor({ timeout: 60000 }).then(() => true, () => false);
  const nm = ok ? await p.locator('[data-file-download]').first().getAttribute('data-name') : '';
  const out = ok ? await bytesOf(p) : Buffer.alloc(0);
  check(`${slug}: provider played (${calls} call), the ${ext.toUpperCase()} handed over intact as "${nm}"`, ok && calls === 1 && nm === `report.${ext}` && out.equals(fs.readFileSync(file)) && !errors.length, errors.join(' | '));
  await ctx.close();
}
// ---- Image Generator (OpenAI played) ----
{
  const webp = await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#2a6' } }).webp().toBuffer();
  let calls = 0;
  const { ctx, p, errors } = await page('ai-tools/image-generator', { '**/api/ai-image': (r) => { calls++; r.fulfill({ status: 200, contentType: 'image/webp', body: webp }); } });
  await p.locator('#prompt').fill('A lighthouse at dawn, watercolour');
  await p.getByRole('button', { name: 'Generate Image' }).click();
  const ok = await p.locator('[data-file-download]').nth(1).waitFor({ timeout: 60000 }).then(() => true, () => false); // WebP, then the PNG made from it
  const names = ok ? await p.locator('[data-file-download]').evaluateAll((els) => els.map((e) => e.dataset.name)) : [];
  check(`image-generator: provider played (${calls} call), WebP and PNG offered (${names.join(', ')})`, ok && calls === 1 && names.some((n) => n.endsWith('.webp')) && names.some((n) => n.endsWith('.png')) && !errors.length, errors.join(' | '));
  await ctx.close();
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
