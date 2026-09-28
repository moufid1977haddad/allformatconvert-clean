// No automatic download at the end of a conversion (28/09, owner on a real iPhone): the 14 tools that used to download
// their result by themselves now show a Download button (app/components/DownloadReady.jsx). For each: real input,
// real conversion, NO download event on its own, the tool page and its input stay; then ONE wait of 65 s for all of
// them and every Download button is clicked (the file still comes, right name, right kind); a PDF also offers
// "Open the PDF in a new tab" (target _blank).
// --paid adds the 4 tools that go through the paid provider (Word to PDF, PDF to Word/Excel/PowerPoint): 1 call each.
// Usage: node scripts/browser-tests/download-ready.mjs <origin> [--browser=firefox|webkit] [--paid]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const paid = process.argv.includes('--paid');
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const FX = path.resolve('scripts/audit/fixtures/files');
const OF = path.resolve('docs/audit/fixtures-fidelite');
const T = [
  ['developer-tools/csv-to-excel', `${FX}/sample.csv`, /\.xlsx?$/, 'PK'],
  ['developer-tools/csv-to-json', `${FX}/sample.csv`, /\.json$/, '['],
  ['developer-tools/csv-to-sql', `${FX}/sample.csv`, /\.sql$/, null],
  ['developer-tools/excel-to-csv', `${FX}/sample.xlsx`, /\.(csv|zip)$/, null],
  ['developer-tools/excel-to-json', `${FX}/sample.xlsx`, /\.(json|zip)$/, null],
  ['pdf-tools/excel-to-pdf', `${OF}/fidelite-03.xlsx`, /\.pdf$/, '%PDF-'],
  ['pdf-tools/ppt-to-pdf', `${OF}/fidelite-05.pptx`, /\.pdf$/, '%PDF-'],
  ['pdf-tools/html-to-pdf', `${FX}/sample.html`, /\.pdf$/, '%PDF-'],
  ['pdf-tools/epub-to-pdf', `${FX}/sample.epub`, /\.pdf$/, '%PDF-'],
  ['pdf-tools/mobi-to-pdf', `${FX}/sample.mobi`, /\.pdf$/, '%PDF-'],
  ...(paid ? [
    ['pdf-tools/word-to-pdf', `${OF}/fidelite-01.docx`, /\.pdf$/, '%PDF-'],
    ['pdf-tools/pdf-to-word', `${FX}/sample.pdf`, /\.docx$/, 'PK'],
    ['pdf-tools/pdf-to-excel', `${FX}/sample.pdf`, /\.xlsx$/, 'PK'],
    ['pdf-tools/pdf-to-ppt', `${FX}/sample.pdf`, /\.pptx$/, 'PK'],
  ] : []),
];
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true, extraHTTPHeaders: {} });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const open = [];
for (const [tool, input, ext, magic] of T) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(240000);
  let auto = 0; p.on('download', () => { auto++; });
  await p.goto(`${origin}/tools/${tool}`, { waitUntil: 'networkidle' });
  await p.locator('input[type=file]').first().setInputFiles(input);
  const btn = p.getByRole('button', { name: /^Convert/ }).first();
  if (await btn.count() && await btn.isVisible()) { await btn.waitFor(); await p.waitForFunction(() => [...document.querySelectorAll('button')].some((x) => /^Convert/.test(x.textContent) && !x.disabled)); await btn.click(); }
  const ready = await p.locator('a[data-download]').waitFor({ timeout: 240000 }).then(() => true, () => false);
  if (!ready) { check(`${tool}: a Download button after the conversion`, false, (await p.locator('[role=alert], .text-red-500, .text-red-600').allInnerTexts()).join(' | ')); await p.close(); continue; }
  await p.waitForTimeout(3000);
  const label = await p.locator('a[data-download]').innerText();
  check(`${tool}: no download by itself, a Download button instead, still on the tool page`, auto === 0 && p.url().includes(tool), `${label} · automatic downloads: ${auto}`);
  open.push({ tool, p, ext, magic, pdf: magic === '%PDF-' });
}
console.log(`waiting 65 s with ${open.length} results on screen…`);
await new Promise((r) => setTimeout(r, 65000));
for (const { tool, p, ext, magic, pdf } of open) {
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[data-download]').click()]);
  const bytes = fs.readFileSync(await d.path());
  const head = bytes.subarray(0, 5).toString('latin1');
  check(`${tool}: after 65 s the Download button still gives the file`, ext.test(d.suggestedFilename()) && bytes.length > 20 && (!magic || head.startsWith(magic)), `${d.suggestedFilename()} ${bytes.length} B`);
  if (pdf) check(`${tool}: "Open the PDF in a new tab" opens a new tab`, (await p.locator('a[data-preview]').getAttribute('target')) === '_blank');
  await p.close();
}
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS', `(${name}, ${open.length} tools)`);
process.exit(fails ? 1 : 0);
