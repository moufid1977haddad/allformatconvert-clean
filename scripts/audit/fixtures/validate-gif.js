const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve(__dirname, 'files/sample.gif').split(path.sep).join('/');
  const resp = await page.goto(fileUrl);
  console.log('status', resp && resp.status());
  await page.waitForTimeout(300);
  const img = page.locator('img');
  const count = await img.count();
  console.log('img count', count);
  if (count) {
    const box = await img.boundingBox();
    console.log('bounding box', JSON.stringify(box));
  }
  await browser.close();
})();
