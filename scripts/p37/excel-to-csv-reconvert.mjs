// P37 lot 1 — Excel to CSV: changing "Separator", "Decimal comma" or "Add a UTF-8 BOM" after the file was chosen must
// convert the file again. Before: the CSV on offer kept the old options (the page said to set them first).
// Browser only (React state + Web Worker). Needs a running build of the site (local `next start`, or a preview via
// the usual proxy); it sends nothing anywhere else.
//   node scripts/p37/excel-to-csv-reconvert.mjs <origin>       e.g. http://localhost:3000
// Market: convertcsv.com and tableconvert.com redo the output as soon as an option changes.
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const origin = new URL(process.argv[2]).origin;
const dir = mkdtempSync(join(tmpdir(), 'p37-x2c-'));
const file = join(dir, 'prices.xlsx');
const ws = XLSX.utils.aoa_to_sheet([['Item', 'Price'], ['Tea', 12.5], ['Café', 3]]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Prices');
writeFileSync(file, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : `— ${info}`); };

const b = await chromium.launch();
const page = await b.newPage();
await page.goto(`${origin}/tools/developer-tools/excel-to-csv`, { waitUntil: 'load' });
// the bytes of the CSV now on offer (null if none appears within 15 s after `previous` changed)
const csvOnOffer = async (previous) => {
  try {
    await page.waitForFunction((prev) => {
      const a = document.querySelector('[data-download-ready] [data-download]');
      return a && a.getAttribute('href') && a.getAttribute('href') !== prev;
    }, previous, { timeout: 15000 });
  } catch { return null; }
  const href = await page.getAttribute('[data-download-ready] [data-download]', 'href');
  const bytes = await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href);
  return { href, text: new TextDecoder().decode(new Uint8Array(bytes)), bom: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf };
};

await page.setInputFiles('input[type=file]', file);
const first = await csvOnOffer(null);
check('first conversion, comma', first && first.text.replace(/\r/g, '') === 'Item,Price\nTea,12.5\nCafé,3', JSON.stringify(first?.text));

await page.selectOption('#x2c-delimiter', ';');
const second = await csvOnOffer(first?.href);
check('Separator changed to ; after the file: converted again', second && second.text.replace(/\r/g, '') === 'Item;Price\nTea;12.5\nCafé;3', second ? JSON.stringify(second.text) : 'no new CSV within 15 s (old one kept)');

await page.check('#x2c-decimal');
const third = await csvOnOffer(second?.href);
check('Decimal comma ticked after: 12,5', third && third.text.replace(/\r/g, '') === 'Item;Price\nTea;12,5\nCafé;3', third ? JSON.stringify(third.text) : 'no new CSV within 15 s');

await page.check('#x2c-bom');
const fourth = await csvOnOffer(third?.href);
check('BOM ticked after: the file starts with EF BB BF', fourth && fourth.bom, fourth ? 'no BOM' : 'no new CSV within 15 s');

const status = await page.textContent('body');
check('status line shown for the new CSV', /CSV ready: [\d,]+ rows\./.test(status));
await b.close();
console.log(`${passes} passed, ${fails} failed`);
if (fails) process.exitCode = 1;
