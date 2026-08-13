const { chromium } = require('@playwright/test');
const path = require('path');
const FILES = path.join(__dirname, 'files');

async function check(browser, file) {
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve(FILES, file).split(path.sep).join('/');
  await page.goto(fileUrl).catch(() => {});
  await page.waitForTimeout(500);
  const result = await page.evaluate(() => new Promise((resolve) => {
    const v = document.querySelector('video');
    if (!v) return resolve({ ok: false, error: 'no video element rendered by Chromium native player' });
    if (v.readyState >= 1) return resolve({ ok: true, duration: v.duration, w: v.videoWidth, h: v.videoHeight });
    v.onloadedmetadata = () => resolve({ ok: true, duration: v.duration, w: v.videoWidth, h: v.videoHeight });
    v.onerror = () => resolve({ ok: false, error: v.error ? v.error.message : 'unknown' });
    setTimeout(() => resolve({ ok: false, timeout: true, readyState: v.readyState }), 4000);
  }));
  console.log(file, '->', JSON.stringify(result));
  await page.close();
}

(async () => {
  const browser = await chromium.launch();
  await check(browser, 'sample.mp4');
  await check(browser, 'sample-real.avi');
  await check(browser, 'sample.mov');
  await check(browser, 'sample.avi');
  await browser.close();
})();
