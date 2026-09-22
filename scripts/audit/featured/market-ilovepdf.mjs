// Same file, reference site: run a real iLovePDF / iLoveIMG tool anonymously in a real browser and keep
// the file it hands back, so our output can be compared byte-for-byte and pixel-for-pixel.
// Usage: AUDIT_FX=... AUDIT_OUT=... node scripts/audit/featured/market-ilovepdf.mjs <url> <file> <prefix> [level]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [url, file, prefix, level] = process.argv.slice(2);
const OUT = process.env.AUDIT_OUT;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1366, height: 900 }, locale: 'en-US' });
const page = await ctx.newPage();
const t0 = Date.now();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  for (const t of ['Accept', 'Accept all', 'I agree', 'Agree']) {
    const b = page.getByRole('button', { name: t, exact: true });
    if (await b.count()) { await b.first().click().catch(() => {}); break; }
  }
  await page.locator('input[type=file]').first().setInputFiles(file);
  await page.waitForTimeout(4000);
  if (level) await page.locator(`text=${level}`).first().click().catch(() => {});
  const process = page.locator('#processTask, button.btn--process, .btn-process').first();
  await process.click({ timeout: 30000 });
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 180000 }),
    page.locator('#pickfiles, a.downloader__btn, .downloader__btn').first().click({ timeout: 180000 }).catch(() => {}),
  ]);
  const dest = path.join(OUT, `${prefix}__${dl.suggestedFilename()}`);
  await dl.saveAs(dest);
  console.log(JSON.stringify({ ok: true, secs: (Date.now() - t0) / 1000, name: dl.suggestedFilename(), size: fs.statSync(dest).size, dest }));
} catch (e) {
  await page.screenshot({ path: path.join(OUT, `${prefix}__FAIL.png`) }).catch(() => {});
  console.log(JSON.stringify({ ok: false, secs: (Date.now() - t0) / 1000, error: String(e).slice(0, 300) }));
}
await browser.close();
