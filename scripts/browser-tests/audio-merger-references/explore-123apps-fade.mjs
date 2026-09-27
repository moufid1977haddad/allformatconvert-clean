// Research probe (26/09/2026): 123apps Audio Joiner's crossfade/fade icons and reorder arrows, what each click does.
// Usage: node explore-123apps-fade.mjs <outDir> <file1> <file2> <file3>
import { chromium } from '@playwright/test';
import path from 'node:path';
const [out, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 }, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://audio-joiner.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForTimeout(3000);
await p.locator('input[type=file]').first().setInputFiles(files);
await p.getByText('Format:').first().waitFor({ timeout: 60000 }); await p.waitForTimeout(6000);
// Every element whose class or title speaks of fade/cross/up/down, with its state.
const dump = () => p.evaluate(() => [...document.querySelectorAll('*')].filter((e) => {
  const c = (e.className?.baseVal ?? e.className ?? '').toString();
  return /fade|cross|move|arrow|up|down|track/i.test(c + ' ' + (e.title || '') + ' ' + (e.getAttribute('aria-label') || '')) && e.children.length < 4;
}).map((e) => `${e.tagName}.${(e.className?.baseVal ?? e.className).toString().slice(0, 80)} title=${e.title || e.getAttribute('aria-label') || ''} ${e.getBoundingClientRect().x | 0},${e.getBoundingClientRect().y | 0}`).slice(0, 80));
console.log((await dump()).join('\n'));
await b.close();
