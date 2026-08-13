const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve(__dirname, 'files/sample.webm').split(path.sep).join('/');
  await page.setContent(`<video id="v" src="${fileUrl}"></video>`);
  const meta = await page.evaluate(() => new Promise((resolve, reject) => {
    const v = document.getElementById('v');
    v.onloadedmetadata = () => resolve({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
    v.onerror = () => reject(new Error('video error: ' + (v.error && v.error.message)));
  }));
  console.log('WEBM decoded:', JSON.stringify(meta));
  await browser.close();
})();
