// Research probe (26/09/2026, order + crossfade): opens a competitor's merger with 3 files and saves screenshots plus
// the visible controls, to find how it reorders files and what its crossfade offers.
// Usage: node explore-order-fade.mjs <123apps|clideo|onlineconverter> <outDir> <file1> <file2> <file3>
import { chromium } from '@playwright/test';
import path from 'node:path';
const [site, out, ...files] = process.argv.slice(2);
const URLS = { '123apps': 'https://audio-joiner.com/', clideo: 'https://clideo.com/merge-audio', onlineconverter: 'https://www.onlineconverter.com/merge-audio' };
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto(URLS[site], { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(4000);
const inputs = await p.locator('input[type=file]').count();
console.log('file inputs:', inputs);
if (site === 'onlineconverter') {
  for (let i = 0; i < files.length && i < inputs; i++) await p.locator('input[type=file]').nth(i).setInputFiles(files[i]);
} else {
  await p.locator('input[type=file]').first().setInputFiles(files);
}
await p.waitForTimeout(site === 'clideo' ? 25000 : 12000);
await p.screenshot({ path: path.join(out, `${site}-loaded.png`), fullPage: true });
const txt = await p.evaluate(() => document.body.innerText);
console.log(txt.replace(/\n{2,}/g, '\n').slice(0, 4000));
// Controls with fade/cross/order/drag hints.
const ctl = await p.evaluate(() => [...document.querySelectorAll('input,select,button,[draggable],[role=slider],label')]
  .map((e) => `${e.tagName} ${e.type || ''} ${e.getAttribute('draggable') || ''} name=${e.name || ''} id=${e.id || ''} cls=${(e.className?.baseVal ?? e.className ?? '').toString().slice(0, 60)} val=${e.value ?? ''} text=${(e.innerText || e.getAttribute('aria-label') || e.title || '').slice(0, 50).replace(/\s+/g, ' ')}`)
  .filter((s) => /fade|cross|order|drag|move|up|down|sort|transition|second|sec/i.test(s)));
console.log('--- controls ---\n' + ctl.join('\n'));
await b.close();
