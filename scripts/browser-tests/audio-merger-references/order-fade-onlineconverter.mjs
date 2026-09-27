// Research probe (26/09/2026, order + crossfade): onlineconverter.com Merge Audio, 3 files, "Transition" = 0 (None),
// 1 (Fade In & Out) or 2 (Fade In & Out, No Overlap). The output is MP3 only.
// Usage: node order-fade-onlineconverter.mjs <style 0|1|2> <outDir> <file1> <file2> <file3>
import { chromium } from '@playwright/test';
import path from 'node:path';
const [style, out, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, locale: 'en-US' });
const p = await ctx.newPage();
await p.goto('https://www.onlineconverter.com/merge-audio', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(3000);
await p.selectOption('#select', String(files.length - 1)); await p.waitForTimeout(800);
const n = await p.locator('input[type=file]').count(); console.log('file inputs:', n);
for (let i = 0; i < files.length; i++) await p.locator('input[type=file]').nth(i).setInputFiles(files[i]);
// One "Transition" per join once 3 or 4 files are chosen: set them all.
for (const sel of await p.locator('select[id^=style]').all()) { await sel.selectOption(style); await p.waitForTimeout(300); }
console.log('transition selects:', await p.locator('select[id^=style]').count(), await p.evaluate(() => [...document.querySelectorAll('select[id^=style]')].map((s) => s.id + '=' + [...s.options].map((o) => o.text).join('|'))));
const opts = await p.evaluate(() => [...document.querySelectorAll('input,select')].filter((e) => e.offsetParent && e.type !== 'file' && e.type !== 'hidden').map((e) => `${e.tagName} ${e.type} name=${e.name} val=${e.value}${e.options ? ' options=' + [...e.options].map((o) => o.value + ':' + o.text).join('|') : ''}`));
console.log('visible inputs:', opts);
await p.getByRole('button', { name: 'Convert' }).or(p.locator('input[value=Convert]')).first().click();
const link = p.getByText(/Download Now/i).first(); await link.waitFor({ timeout: 400000 }).catch(async (e) => { await p.screenshot({ path: path.join(out, `oc-${style}-fail.png`) }); console.log('page:', (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 500)); throw e; });
const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), link.click()]);
const f = path.join(out, `oc-${style}.mp3`); await d.saveAs(f); console.log('saved', f);
await b.close();
