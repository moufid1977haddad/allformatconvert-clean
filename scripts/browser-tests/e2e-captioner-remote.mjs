// End-to-end of Image Captioner against a deployed site: real page, real file picker, real click. Reports the
// size of the request body actually sent (the original is reduced in the browser), the time, and the caption.
// Usage: node scripts/browser-tests/e2e-captioner-remote.mjs <entryUrl> <image> [engine]
// NOTE: each success is one paid vision call (about $0.001); run it against a preview only.
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [entry, file, engineName = 'chromium'] = process.argv.slice(2);
const engine = { chromium, firefox, webkit }[engineName];
const origin = new URL(entry).origin;
const browser = await engine.launch();
const ctx = await browser.newContext();
if (new URL(entry).search) { const p = await ctx.newPage(); await p.goto(entry, { waitUntil: 'domcontentloaded' }); await p.close(); }
const page = await ctx.newPage();
const sent = [];
page.on('request', (r) => { if (r.method() === 'POST' && r.url().endsWith('/api/ai-vision')) sent.push((r.postDataBuffer() || Buffer.alloc(0)).length); });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
await page.goto(origin + '/tools/ai-tools/image-captioner', { waitUntil: 'networkidle' });
await page.setInputFiles('input[type=file]', file);
await page.waitForTimeout(500);
const btn = page.locator('button:has-text("Generate Caption")');
const info = fs.statSync(file).size;
if (await btn.isDisabled()) {
  console.log(`  REFUSED before any work (button disabled): ${path.basename(file)} ${(info / 1048576).toFixed(1)} MB; message: "${await page.locator('p.text-red-400').allInnerTexts()}"`);
  await browser.close();
  process.exit(0);
}
const t0 = Date.now();
await btn.click();
const done = await Promise.race([
  page.waitForSelector('textarea[readonly]', { timeout: 120000 }).then(() => 'caption').catch(() => null),
  page.waitForSelector('p.text-red-400', { timeout: 120000 }).then(() => 'error').catch(() => null),
]);
const total = (Date.now() - t0) / 1000;
const caption = done === 'caption' ? await page.inputValue('textarea[readonly]') : '';
const err = done === 'error' ? await page.innerText('p.text-red-400') : '';
console.log(`  ${done === 'caption' && caption.length > 5 ? 'PASS' : 'FAIL'} ${path.basename(file)} (${(info / 1048576).toFixed(1)} MB) [${engineName}]: ${total.toFixed(1)} s, request body ${sent.map((b) => (b / 1024).toFixed(0) + ' KB').join(',')}, caption "${caption.slice(0, 70)}", error "${err}", pageerrors ${errors.length}`);
await browser.close();
