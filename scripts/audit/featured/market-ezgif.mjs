// Reference for the GIF family: ezgif.com video-to-gif with its DEFAULT settings, same source video.
// Usage: AUDIT_OUT=... node scripts/audit/featured/market-ezgif.mjs <video> <prefix>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [file, prefix] = process.argv.slice(2);
const OUT = process.env.AUDIT_OUT;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ locale: 'en-US' })).newPage();
const t0 = Date.now();
try {
  await page.goto('https://ezgif.com/video-to-gif', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.locator('input[type=file]').first().setInputFiles(file);
  await Promise.all([page.waitForURL(/video-to-gif\/.+/, { timeout: 120000 }), page.locator('input[type=submit], button[type=submit]').first().click()]);
  const settings = await page.locator('form').first().innerText().catch(() => '');
  await page.locator('input[type=submit][value*="Convert"], button:has-text("Convert to GIF")').first().click();
  const img = page.locator('#output img[src*="tmp"], #output img[src$=".gif"]:not([src*="loader"])').last();
  await page.waitForFunction(() => [...document.querySelectorAll('#output img')].some((i) => i.naturalWidth > 100), null, { timeout: 180000 });
  const src = await page.evaluate(() => [...document.querySelectorAll('#output img')].find((i) => i.naturalWidth > 100).getAttribute('src'));
  const res = await page.request.get(new URL(src, page.url()).href);
  const dest = path.join(OUT, `${prefix}__ezgif.gif`);
  fs.writeFileSync(dest, await res.body());
  console.log(JSON.stringify({ ok: true, secs: (Date.now() - t0) / 1000, size: fs.statSync(dest).size, dest, settings: settings.replace(/\s+/g, ' ').slice(0, 400) }));
} catch (e) {
  await page.screenshot({ path: path.join(OUT, `${prefix}__FAIL.png`) }).catch(() => {});
  console.log(JSON.stringify({ ok: false, error: String(e).slice(0, 300) }));
}
await browser.close();
