// P23: does Image to Base64 freeze the page on a 2 MB photo? Time until the page answers again, per engine.
import { chromium, firefox, webkit } from '@playwright/test';
const [origin, file, eng = 'webkit'] = process.argv.slice(2);
const b = await { chromium, firefox, webkit }[eng].launch(); const p = await b.newPage();
await p.goto(origin + '/tools/image-tools/image-to-base64'); await p.waitForTimeout(800);
const t0 = Date.now();
await p.locator('input[type=file]').setInputFiles(file);
await p.locator('textarea').waitFor({ timeout: 120000 });
const t1 = Date.now();
await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
const t2 = Date.now();
const len = await p.locator('textarea').evaluate((t) => t.value.length);
console.log(eng, `result shown ${t1 - t0} ms, page answers ${t2 - t0} ms, ${len} chars`);
await b.close();
