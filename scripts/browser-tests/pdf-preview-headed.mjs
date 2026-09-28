// "Open the PDF in a new tab" really SHOWS the PDF (28/09): a headed Chromium (with its PDF viewer) opens the label
// sheet preview of Barcode Generator; the new tab must stay on the blob address (not handed to the download manager)
// and the tool page stays behind it. Usage: node scripts/browser-tests/pdf-preview-headed.mjs <origin>
import { chromium } from '@playwright/test';
const origin = new URL(process.argv[2]).origin;
const b = await chromium.launch({ headless: false });
const ctx = await b.newContext({ acceptDownloads: true });
const p = await ctx.newPage();
let downloads = 0; ctx.on('page', (pg) => pg.on('download', () => { downloads++; }));
await p.goto(`${origin}/tools/qr-barcodes-tools/barcode-generator`, { waitUntil: 'networkidle' });
await p.locator('#bc-type').selectOption('ean13');
await p.getByRole('radio', { name: /^Many/ }).click();
await p.getByLabel('A list (one value per line)').check();
await p.locator('#bc-lines').fill('590123412345');
await p.locator('#bc-batch-format').selectOption('labels');
await p.getByRole('button', { name: 'Generate label sheets (PDF)' }).click();
await p.locator('a[data-batch-preview]').waitFor({ timeout: 60000 });
const [tab] = await Promise.all([ctx.waitForEvent('page'), p.locator('a[data-batch-preview]').click()]);
await tab.waitForTimeout(4000);
const ok = tab.url().startsWith('blob:') && !tab.isClosed() && downloads === 0 && p.url().includes('barcode-generator');
console.log(ok ? 'PASS' : 'FAIL', `chromium headed: preview tab shows the PDF at ${tab.url().slice(0, 45)}, downloads ${downloads}, tool page ${p.url().split('/').pop()}`);
await b.close();
process.exit(ok ? 0 : 1);
