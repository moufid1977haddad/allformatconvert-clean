const { chromium } = require('@playwright/test');
const path = require('path');
const FILES = path.join(__dirname, 'files');
const BASE = 'https://onlineconvertools.com';

(async () => {
  const browser = await chromium.launch();

  let page = await browser.newPage();
  await page.goto(`${BASE}/tools/pdf-tools/pdf-translate`, { waitUntil: 'load' });
  await page.locator('input[type=file]').setInputFiles(path.join(FILES, 'sample.pdf'));
  await page.getByRole('button', { name: /Translate PDF/i }).click();
  await page.waitForTimeout(4000);
  const translatedText = await page.locator('textarea[readonly]').inputValue().catch(() => null);
  console.log('pdf-translate output:', JSON.stringify(translatedText));
  await page.close();

  page = await browser.newPage();
  const logs = [];
  page.on('pageerror', (err) => logs.push('pageerror: ' + err.message));
  await page.goto(`${BASE}/tools/gif-tools/avi-to-gif`, { waitUntil: 'load' });
  await page.locator('input[type=file]').setInputFiles(path.join(FILES, 'sample-real.avi'));
  await page.waitForTimeout(2000);
  const start = Date.now();
  await page.getByRole('button', { name: /Convert to GIF/i }).click();
  await page.waitForTimeout(500);
  const elapsed = Date.now() - start;
  const errorBanner = await page.locator('.text-red-700').first().textContent().catch(() => null);
  console.log('avi-to-gif ->', { elapsed, errorBanner, pageErrors: logs });
  await page.close();

  await browser.close();
})();
