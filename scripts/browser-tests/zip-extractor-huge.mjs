// The ZIP Extractor past the 2.8 GiB that froze Firefox when every file was held in memory at once: one archive
// bigger than that (huge.rar / huge.zip from make-big-rar.mjs), every file downloaded one after the other with its
// own Download, each SHA-256 checked against the source; whether the tab survives and still answers; and what
// "Download all as ZIP" says when the browser cannot stream a ZIP to disk.
// Usage: node scripts/browser-tests/zip-extractor-huge.mjs <origin or _vercel_share URL> <archive> <source dir> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, archive, srcDir] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const sha = (f) => new Promise((ok) => { const h = createHash('sha256'); fs.createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))); });
const b = await engine.launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addInitScript(() => { delete window.showSaveFilePicker; delete window.showDirectoryPicker; }); // Firefox's own situation, in any browser
const page = await ctx.newPage();
let crashed = false; page.on('crash', () => { crashed = true; });
if (entry.includes('_vercel_share')) await page.goto(entry);
await page.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
let fails = 0; const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const t0 = Date.now();
await page.locator('input[type=file]').setInputFiles(archive);
await page.locator('[data-status]').filter({ hasText: 'listed in' }).waitFor({ timeout: 600000 });
const names = await page.locator('[data-entry]').evaluateAll((els) => els.map((e) => e.dataset.entry));
check('listed', names.length === fs.readdirSync(srcDir).length, `${names.join(' ')} in ${((Date.now() - t0) / 1000).toFixed(1)} s · ${await page.locator('[data-status]').innerText()}`);
let bytes = 0;
for (const n of names) {
  const t = Date.now();
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 1800000 }), page.locator(`[data-entry="${n}"] [data-download]`).click()]);
  const f = await dl.path(); const size = fs.statSync(f).size; bytes += size;
  const same = (await sha(f)) === (await sha(path.join(srcDir, n)));
  // the tab still answers right after (a frozen tab times out here)
  const alive = await page.evaluate(() => 1 + 1, null).then((v) => v === 2).catch(() => false);
  check(`${n}: downloaded, identical, tab answering`, same && alive && !crashed, `${size} bytes in ${((Date.now() - t) / 1000).toFixed(1)} s · ${(bytes / 2 ** 30).toFixed(2)} GiB so far`);
  await dl.delete(); // keep the disk from filling with test copies
}
await page.getByRole('button', { name: 'Download all as ZIP' }).click();
const msg = await page.locator('div.bg-red-50[role=alert]').innerText({ timeout: 10000 }).catch(() => '(no message)');
check('"Download all as ZIP" without streaming: explains the limit and the way out', /over the .* this browser can build|one by one/i.test(msg), msg);
check('tab never crashed', !crashed);
console.log(fails ? `${fails} FAILED` : 'all passed', `(${engine.name()}, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
await b.close(); process.exit(fails ? 1 : 0);
