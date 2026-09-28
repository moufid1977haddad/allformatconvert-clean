// PDF to Excel, one real conversion (28/09 diagnosis: a text-only PDF gave 502 "try again"): what /api/pdf-to-excel
// answers, what the page shows, and the first rows of each sheet of the workbook the visitor downloads.
// Usage: node scripts/browser-tests/pdf-to-excel-probe.mjs <origin> <pdf>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import XLSX from 'xlsx';

const [origin, file] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const p = await ctx.newPage();
p.setDefaultTimeout(240000);
const api = [];
p.on('response', async (r) => { if (r.url().includes('/api/pdf-to-excel')) api.push(`${r.status()} ${(await r.text().catch(() => '')).slice(0, 120)}`); });
await p.goto(origin + '/tools/pdf-tools/pdf-to-excel', { waitUntil: 'networkidle' });
await p.locator('input[type=file]').first().setInputFiles(file);
await p.getByRole('button', { name: /Download \.xlsx|Convert to \.xlsx/ }).click();
await p.waitForFunction(() => document.querySelector('a[data-download]') || document.querySelector('p.text-red-600, p.text-red-500'));
console.log('api:', api.join(' | ').replace(/\n/g, ' '));
if (await p.locator('a[data-download]').count()) {
  console.log('page:', await p.locator('a[data-download]').innerText(), '·', (await p.locator('[data-note]').count()) ? await p.locator('[data-note]').innerText() : '(no note)');
  const [d] = await Promise.all([p.waitForEvent('download'), p.locator('a[data-download]').click()]);
  const wb = XLSX.read(fs.readFileSync(await d.path()));
  for (const n of wb.SheetNames.slice(0, 2)) console.log(`sheet "${n}":`, JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1 }).slice(0, 5)));
} else {
  console.log('page error:', await p.locator('p.text-red-600, p.text-red-500').first().innerText());
}
await b.close();
