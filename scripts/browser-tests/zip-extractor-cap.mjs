// Measures the ZIP Extractor's per-file cap: one archive holding ONE big file, listed, then that file's own
// Download clicked; time, whether the tab survives, and the downloaded bytes' SHA-256 against the source.
// Used to set MAX_FILE_BYTES in app/tools/file-tools/zip-extractor/config.js (archives: make-big-rar.mjs).
// Usage: node scripts/browser-tests/zip-extractor-cap.mjs <origin or _vercel_share URL> <archive> <source file> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
import { authorize } from './vercel-preview-auth.mjs';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, file, source] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const sha = (f) => new Promise((ok) => { const h = createHash('sha256'); fs.createReadStream(f).on('data', (d) => h.update(d)).on('end', () => ok(h.digest('hex'))); });
const want = await sha(source);
const b = await engine.launch(); const bctx = await b.newContext({ acceptDownloads: true }); await authorize(bctx, origin); const page = await bctx.newPage();
let crashed = false; page.on('crash', () => { crashed = true; });
if (entry.includes('_vercel_share')) await page.goto(entry);
await page.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
const alert = page.locator('div.bg-red-50[role=alert]');
const t0 = Date.now();
await page.locator('input[type=file]').setInputFiles(file);
const row = page.locator(`[data-entry="${path.basename(source)}"]`);
await Promise.race([row.waitFor({ timeout: 600000 }), alert.waitFor({ timeout: 600000 })]);
const listed = (Date.now() - t0) / 1000;
let outcome, info = '';
if (await alert.count()) outcome = 'error at opening: ' + await alert.innerText();
else if (await row.getByText('too large').count()) outcome = 'refused: over the declared cap';
else {
  const t1 = Date.now();
  outcome = await Promise.race([
    page.waitForEvent('download', { timeout: 1800000 }).then(async (d) => { const f = await d.path(); const secs = (Date.now() - t1) / 1000; const size = fs.statSync(f).size; return `downloaded ${size} bytes in ${secs.toFixed(1)} s, ${(await sha(f)) === want ? 'SHA-256 identical' : 'CONTENT DIFFERS'}`; }),
    alert.waitFor({ timeout: 1800000 }).then(async () => 'error: ' + await alert.innerText()),
    new Promise((r) => page.on('crash', () => r('tab crashed'))),
    row.locator('[data-download]').click().then(() => new Promise(() => {})),
  ]).catch((e) => 'timeout ' + e.message.split('\n')[0]);
  info = await page.locator('[data-status]').innerText().catch(() => '');
}
console.log(engine.name(), path.basename(file), `listed in ${listed.toFixed(1)} s ·`, outcome, crashed ? '(crash seen)' : '', info);
await b.close();
