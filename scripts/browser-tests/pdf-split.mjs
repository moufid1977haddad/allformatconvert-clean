// Split PDF, real page: every mode, the refusal of a range that does not exist, the ZIP. Each part reopened.
// Usage: node scripts/browser-tests/pdf-split.mjs <origin or _vercel_share URL> <file.pdf (>= 10 pages)> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import fs from 'node:fs';
const [entry, file] = process.argv.slice(2); const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const page = await (await b.newContext({ acceptDownloads: true })).newPage();
if (entry.includes('_vercel_share')) await page.goto(entry);
const total = (await PDFDocument.load(fs.readFileSync(file))).getPageCount();
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
await page.goto(origin + '/tools/pdf-tools/pdf-split', { waitUntil: 'networkidle' });
await page.locator('input[type=file]').setInputFiles(file);
await page.getByText(`(${total} pages)`).waitFor({ timeout: 60000 });
const pagesOf = async (link) => { const [dl] = await Promise.all([page.waitForEvent('download'), link.click()]); return (await PDFDocument.load(fs.readFileSync(await dl.path()))).getPageCount(); };
async function run(setup, expectCounts, name) {
  await setup();
  await page.getByRole('button', { name: 'Split PDF' }).click();
  await page.getByText(/^Done! \d+ PDF/).waitFor({ timeout: 120000 });
  const links = page.locator('a[download$=".pdf"]');
  const n = await links.count(); const counts = [];
  for (let i = 0; i < n; i++) counts.push(await pagesOf(links.nth(i)));
  check(name, JSON.stringify(counts) === JSON.stringify(expectCounts), `pages per part ${JSON.stringify(counts)}`);
  return n;
}
const mode = (l) => page.getByRole('radio', { name: l }).click();
const spec = (v) => page.locator('#split-spec').fill(v);
await run(async () => { await mode('Custom ranges'); await spec('1-3, 5, 8-'); }, [3, 1, total - 7], 'custom ranges 1-3, 5, 8-');
const last = (await page.locator('a[download$=".pdf"]').last().getAttribute('download'));
check('parts named after the file', /_8-\d+\.pdf$/.test(last), last);
await spec('5-3');
check('backwards range refused before splitting', await page.getByText('runs backwards').count() === 1 && await page.getByRole('button', { name: 'Split PDF' }).isDisabled());
await spec(String(total + 1));
check('page past the end refused', await page.getByText('goes past the last page').count() === 1);
const everyExpect = []; for (let s = 0; s < total; s += 4) everyExpect.push(Math.min(4, total - s));
await run(async () => { await mode('Every N pages'); await page.locator('#split-every').fill('4'); }, everyExpect, 'every 4 pages');
await run(async () => { await mode('Select pages'); await spec('2, 4-5'); await page.getByLabel(/Merge the extracted pages/).check(); }, [3], 'select 2, 4-5 merged');
const n = await run(async () => { await mode('Every page'); }, Array(total).fill(1), 'every page');
const [zdl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Download all/ }).click()]);
const zip = await JSZip.loadAsync(fs.readFileSync(await zdl.path()));
check('ZIP holds every part', Object.keys(zip.files).length === n, `${Object.keys(zip.files).length} files`);
await b.close(); console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()})`); process.exit(fails ? 1 : 0);
