// One-off verification script for the 4 bugs fixed in commit 9a2ebd2e.
// Uses a real, unmodified Playwright Chromium (no automation extension in the
// page) against the live production URL, so video decode isn't blocked by the
// claude-in-chrome extension interference seen during dev testing.
const { chromium } = require('@playwright/test');
const path = require('path');

const BASE = process.argv[2] || 'https://onlineconvertools.com';
const FILES = path.join(__dirname, 'files');

async function testVideoToGif(browser, tool, file) {
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (msg) => { if (msg.type() === 'error') logs.push(msg.text()); });
  page.on('pageerror', (err) => logs.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/tools/gif-tools/${tool}`, { waitUntil: 'load' });
  const fileInput = page.locator('input[type=file]');
  await fileInput.setInputFiles(path.join(FILES, file));

  // give the video element real time to load in a real browser
  await page.waitForTimeout(3000);

  const start = Date.now();
  await page.getByRole('button', { name: /Convert to GIF/i }).click();

  // wait up to 20s for either a download link (success) or an error banner (clean fail)
  const result = await Promise.race([
    page.locator('a[download="converted.gif"]').waitFor({ timeout: 20000 }).then(() => 'success'),
    page.locator('text=/couldn\'t be loaded/i').waitFor({ timeout: 20000 }).then(() => 'clean-error'),
  ]).catch(() => 'timeout-neither');
  const elapsed = Date.now() - start;

  let gifInfo = null;
  if (result === 'success') {
    const href = await page.locator('a[download="converted.gif"]').getAttribute('href');
    gifInfo = { hrefPrefix: href.slice(0, 30), hrefLength: href.length };
    const frameCount = await page.locator('.grid.grid-cols-5 img').count();
    gifInfo.frameCount = frameCount;
  }

  console.log(`${tool} (${file}) -> ${result} in ${elapsed}ms`, gifInfo || '', logs.length ? { consoleErrors: logs } : '');
  await page.close();
  return { tool, result, elapsed, gifInfo, consoleErrors: logs };
}

async function testTiff(browser, tool, outExt) {
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (msg) => { if (msg.type() === 'error') logs.push(msg.text()); });
  page.on('pageerror', (err) => logs.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/tools/image-tools/${tool}`, { waitUntil: 'load' });
  await page.locator('input[type=file]').setInputFiles(path.join(FILES, 'sample.tiff'));
  await page.getByRole('button', { name: new RegExp(`Convert to ${outExt}`, 'i') }).click();
  await page.waitForTimeout(1500);

  const img = page.locator(`img[src^="data:image/${outExt === 'JPG' ? 'jpeg' : 'png'}"]`);
  const hasImg = await img.count() > 0;
  let dims = null;
  if (hasImg) {
    dims = await img.evaluate((el) => new Promise((resolve) => {
      if (el.complete) return resolve({ w: el.naturalWidth, h: el.naturalHeight });
      el.onload = () => resolve({ w: el.naturalWidth, h: el.naturalHeight });
    }));
  }
  console.log(`${tool} -> ${hasImg ? 'success' : 'FAIL'}`, dims || '', logs.length ? { consoleErrors: logs } : '');
  await page.close();
  return { tool, success: hasImg, dims, consoleErrors: logs };
}

async function testPdfTranslate(browser) {
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (msg) => { if (msg.type() === 'error') logs.push(msg.text()); });
  page.on('pageerror', (err) => logs.push('pageerror: ' + err.message));

  await page.goto(`${BASE}/tools/pdf-tools/pdf-translate`, { waitUntil: 'load' });
  await page.locator('input[type=file]').setInputFiles(path.join(FILES, 'sample.pdf'));
  await page.getByRole('button', { name: /Translate PDF/i }).click();
  await page.waitForTimeout(4000);

  const errorText = await page.locator('.text-red-400').first().textContent().catch(() => null);
  const outputVisible = await page.locator('textarea[readonly]').count() > 0;
  console.log('pdf-translate ->', { outputVisible, errorText }, logs.length ? { consoleErrors: logs } : '');
  await page.close();
  return { outputVisible, errorText, consoleErrors: logs };
}

(async () => {
  console.log('Testing against:', BASE);
  const browser = await chromium.launch();
  try {
    await testVideoToGif(browser, 'mp4-to-gif', 'sample.mp4');
    await testVideoToGif(browser, 'mov-to-gif', 'sample.mp4'); // valid mp4 through the mov tool, same decode path
    await testTiff(browser, 'tiff-to-jpg', 'JPG');
    await testTiff(browser, 'tiff-to-png', 'PNG');
    await testPdfTranslate(browser);
  } finally {
    await browser.close();
  }
})();
