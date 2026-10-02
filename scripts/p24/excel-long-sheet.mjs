// P24 review (03/10): "Fit each sheet on one page" on a LONG sheet — a PDF page is limited to about 200 inches
// (14 400 pt). Does Gotenberg/LibreOffice cut rows silently? Rows numbered 1..N; the PDF text must hold the last one.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:3100';
const XLSX = (await import('xlsx')).default || (await import('xlsx'));
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'xl-long-'));
const b = await chromium.launch();
let fails = 0;
for (const rows of (process.argv[3] || "500,3000").split(",").map(Number)) {
  const ws = XLSX.utils.aoa_to_sheet([['Row', 'Name', 'Amount'], ...Array.from({ length: rows }, (_, i) => [`ROW${i + 1}`, `name ${i + 1}`, i * 1.5])]);
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Long');
  const f = path.join(dir, `long-${rows}.xlsx`); fs.writeFileSync(f, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  const p = await b.newPage();
  await p.goto(BASE + '/tools/pdf-tools/excel-to-pdf');
  await p.locator('input[type=file]').first().setInputFiles(f);
  await p.locator('#xl-one-page').check();
  await p.getByRole('button', { name: /Convert/ }).first().click();
  const a = p.locator('a[download]').first();
  const ok = await a.waitFor({ timeout: 180000 }).then(() => true).catch(() => false);
  if (!ok) { console.log(`rows ${rows}: no PDF — ${(await p.locator('main').innerText()).slice(0, 200).replace(/\n/g, ' ')}`); await p.close(); continue; }
  const href = await a.getAttribute('href');
  const bytes = Buffer.from(await p.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href));
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;
  let text = ''; let maxH = 0;
  for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i); maxH = Math.max(maxH, pg.view[3]); text += (await pg.getTextContent()).items.map((t) => t.str).join(' ') + ' '; }
  const found = new Set((text.match(/ROW\d+/g) || []).map((s) => Number(s.slice(3))));
  const missing = []; for (let i = 1; i <= rows; i++) if (!found.has(i)) missing.push(i);
  const pass = missing.length === 0;
  if (!pass) fails++;
  console.log(`${pass ? 'OK  ' : 'FAIL'} rows ${rows}: ${doc.numPages} page(s), tallest ${Math.round(maxH)} pt, rows missing: ${missing.length}${missing.length ? ' (first ' + missing[0] + ', last ' + missing[missing.length - 1] + ')' : ''}`);
  await p.close();
}
await b.close();
process.exit(fails ? 1 : 0);
