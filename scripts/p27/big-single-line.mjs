// P27 phase 7: does a VERY large text on ONE line block the page when it lands in an EDITABLE text field -- loaded from
// a file (CSV to TSV) or pasted (JSON Formatter, Case Converter, Base64...)? For each case: the longest main-thread
// task while the text goes in, the time until the page answers again (a click is handled), and typing one character
// afterwards (how long until it shows).
//   node scripts/p27/big-single-line.mjs <origin> [--mb=20] [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const origin = new URL(args.find((a) => !a.startsWith('--'))).origin;
const mb = Number(args.find((a) => a.startsWith('--mb='))?.slice(5) || 20);
const engine = args.find((a) => a.startsWith('--browser='))?.slice(10) || 'chromium';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'p27-line-'));
const csv = path.join(tmp, 'one-line.csv');
// one line: comma-separated fields, no newline at all
fs.writeFileSync(csv, Array.from({ length: Math.ceil((mb * 1024 * 1024) / 11) }, (_, i) => `v${String(i).padStart(8, '0')}`).join(','));
const json = JSON.stringify(Array.from({ length: Math.ceil((mb * 1024 * 1024) / 40) }, (_, i) => ({ id: i, name: `item${i}`, ok: true })));

const b = await { chromium, firefox, webkit }[engine].launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);

async function measure(name, url, load) {
  const p = await ctx.newPage();
  await p.goto(origin + url, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    window.__long = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long = Math.max(window.__long, e.duration); }).observe({ type: 'longtask', buffered: false }); } catch { /* not Chromium */ }
  });
  const t0 = Date.now();
  await load(p);
  // the page answers again: a requestAnimationFrame round-trip completes
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
  const responsive = Date.now() - t0;
  const ta = p.locator('textarea').first();
  const len = await ta.evaluate((el) => el.value.length).catch(() => -1);
  const t1 = Date.now();
  await ta.focus().catch(() => {});
  await p.keyboard.press('End').catch(() => {});
  await p.keyboard.type('Z').catch(() => {});
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
  const typing = Date.now() - t1;
  const longest = await p.evaluate(() => Math.round(window.__long)).catch(() => null);
  console.log(`${engine} ${name}: in the field ${len.toLocaleString()} chars | page answers after ${responsive} ms | longest task ${longest ?? 'n/a'} ms | one key typed after ${typing} ms`);
  await p.close();
}

await measure(`CSV to TSV, ${mb} MB file on one line`, '/tools/developer-tools/csv-to-tsv', async (p) => {
  await p.locator('input[type=file]').first().setInputFiles(csv);
  await p.waitForFunction(() => document.querySelector('textarea')?.value.length > 0, null, { timeout: 120000 }).catch(() => {});
});
for (const [name, url] of [['JSON Formatter', '/tools/developer-tools/json-formatter'], ['Case Converter', '/tools/text-tools/case-converter']]) {
  await measure(`${name}, ${mb} MB pasted on one line`, url, async (p) => {
    const ta = p.locator('textarea').first();
    await ta.focus();
    // a paste: the browser inserts the clipboard text (insertText is what a paste does to a text field)
    await p.evaluate((t) => document.execCommand('insertText', false, t), json);
  });
}
await b.close();
fs.rmSync(tmp, { recursive: true, force: true });
