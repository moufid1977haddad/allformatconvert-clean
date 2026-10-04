// P31 (03/10): PDF to JPG froze on the owner's iPhone at "Page 1 of 3…" with pdf-avec-images.pdf (kit P21, three A4
// pages with one photo each). Checks, on that same PDF: "Convert pages" gives 3 JPGs and "Extract images" gives the
// photos, with every canvas size logged and under the iOS cap; the page asks PDF.js for its own JPEG decoder on Safari
// (no ImageDecoder / OffscreenCanvas in its worker); and a page that does not finish in time ends with a clear
// message, never a frozen button (time limit shortened by the test hook window.__pdfPageTimeLimitMs).
// Usage: node scripts/p31/pdf-to-jpg-webkit.mjs <origin> [--browser=webkit|chromium|firefox] [--device=iphone]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const device = (process.argv.find((a) => a.startsWith('--device=')) || '').slice(9);
const tag = `${engine}${device ? ` [${device}]` : ''}`;
const PDF = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';

const b = await { chromium, firefox, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, isMobile: engine !== 'firefox', viewport: { width: 390, height: 844 } } : {}) });

async function run(mode, { limitMs } = {}) {
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', (m) => { if (m.text().startsWith('[pdf-to-images]')) logs.push(m.text()); });
  if (limitMs) await p.addInitScript((ms) => { window.__pdfPageTimeLimitMs = ms; }, limitMs);
  await p.goto(`${origin}/tools/pdf-tools/pdf-to-jpg`, { waitUntil: 'load' });
  await p.waitForTimeout(1000);
  await p.locator('input[type=file]').first().setInputFiles(PDF);
  if (mode === 'images') await p.getByRole('combobox', { name: 'Mode' }).selectOption('images');
  const t0 = Date.now();
  await p.getByRole('button', { name: mode === 'images' ? 'Extract images' : 'Convert pages' }).click();
  await p.waitForFunction(() => !!document.querySelector('[data-p2i-message]') || document.querySelectorAll('[data-file-download]').length >= 3, null, { timeout: 120000 }).catch(() => {});
  await p.waitForTimeout(800);
  const rows = await p.locator('[data-file-download]').evaluateAll((els) => els.map((e) => ({ name: e.dataset.name, bytes: +e.dataset.bytes })));
  const message = await p.locator('[data-p2i-message]').allInnerTexts();
  const busy = await p.getByRole('button', { name: /Page \d+ of|Looking for images|Converting/ }).count();
  await p.close();
  return { rows, logs, message, busy, ms: Date.now() - t0 };
}

if (!fs.existsSync(PDF)) { check('kit PDF present', false, PDF); }
else {
  const pages = await run('pages');
  for (const l of pages.logs) console.log('  ', l);
  const sizes = pages.logs.map((l) => /canvas (\d+)×(\d+)/.exec(l)).filter(Boolean).map((m) => +m[1] * +m[2]);
  check(`Convert pages: 3 JPGs (${pages.rows.map((r) => `${r.name} ${r.bytes} B`).join(', ')}) in ${pages.ms} ms`, pages.rows.length === 3 && pages.rows.every((r) => /\.jpg$/.test(r.name) && r.bytes > 1000), JSON.stringify(pages));
  check(`Convert pages: every canvas logged and under the iOS cap (${sizes.map((s) => (s / 1e6).toFixed(1) + ' MP').join(', ')})`, sizes.length === 3 && sizes.every((s) => s <= 16_777_216));
  const imgs = await run('images');
  for (const l of imgs.logs) console.log('  ', l);
  check(`Extract images: the photos (${imgs.rows.map((r) => `${r.name} ${r.bytes} B`).join(', ')}) in ${imgs.ms} ms`, imgs.rows.length >= 3 && imgs.rows.every((r) => /image-\d+\.jpg$/.test(r.name) && r.bytes > 1000), JSON.stringify(imgs));
  const slow = await run('pages', { limitMs: 1 });
  check(`a page over the time limit: clear message, button usable again ("${(slow.message[0] || '').slice(0, 90)}…")`, slow.message.some((m) => /could not be finished on this device/.test(m)) && slow.busy === 0, JSON.stringify(slow));
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${tag})` : `ALL PASS: ${passes} checks (${tag})`);
process.exit(fails ? 1 : 0);
