// P28: run Smallpdf's Word to PDF anonymously in a real browser on one file and keep the PDF it hands back (same
// purpose as scripts/audit/featured/market-ilovepdf.mjs).
//   node scripts/p28/market-smallpdf.mjs <file> <out-dir> <prefix>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [file, out, prefix] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 }, locale: 'en-US' });
const page = await ctx.newPage();
const t0 = Date.now();
try {
  await page.goto('https://smallpdf.com/word-to-pdf', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  for (const t of ['Reject all', 'Decline', 'Only necessary', 'Accept all', 'Accept']) {
    const b = page.getByRole('button', { name: t });
    if (await b.count()) { await b.first().click().catch(() => {}); break; }
  }
  await page.locator('input[type=file]').first().setInputFiles(file);
  const dlButton = page.getByRole('button', { name: /^Download$/ }).or(page.getByRole('link', { name: /^Download$/ })).first();
  await dlButton.waitFor({ timeout: 180000 });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), dlButton.click()]);
  const dest = path.join(out, `${prefix}__${dl.suggestedFilename()}`);
  await dl.saveAs(dest);
  console.log(JSON.stringify({ ok: true, secs: (Date.now() - t0) / 1000, size: fs.statSync(dest).size, dest }));
} catch (e) {
  await page.screenshot({ path: path.join(out, `${prefix}__FAIL.png`) }).catch(() => {});
  console.log(JSON.stringify({ ok: false, secs: (Date.now() - t0) / 1000, error: String(e).slice(0, 300) }));
}
await browser.close();
