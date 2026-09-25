// Measures the ZIP Extractor on one big archive: time to extract, whether the tab survives, and the listed sizes.
// Used to set MAX_EXTRACTED_BYTES in app/tools/file-tools/zip-extractor/config.js.
// Usage: node scripts/browser-tests/zip-extractor-cap.mjs <origin or _vercel_share URL> <archive> [--browser=firefox]
import { chromium, firefox } from '@playwright/test';
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [entry, file] = args; const origin = new URL(entry).origin;
const engine = process.argv.includes('--browser=firefox') ? firefox : chromium;
const b = await engine.launch(); const page = await (await b.newContext()).newPage();
let crashed = false; page.on('crash', () => { crashed = true; });
if (entry.includes('_vercel_share')) await page.goto(entry);
await page.goto(origin + '/tools/file-tools/zip-extractor', { waitUntil: 'networkidle' });
const t0 = Date.now();
await page.locator('input[type=file]').setInputFiles(file);
const outcome = await Promise.race([
  page.getByText(/files? extracted \(/).waitFor({ timeout: 900000 }).then(() => 'extracted'),
  page.locator('div.bg-red-50[role=alert]').waitFor({ timeout: 900000 }).then(() => 'error'),
  new Promise((r) => page.on('crash', () => r('tab crashed'))),
]).catch((e) => 'timeout ' + e.message);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
let info = '';
if (!crashed) info = outcome === 'extracted' ? await page.getByText(/files? extracted \(/).innerText() : await page.locator('div.bg-red-50[role=alert]').innerText().catch(() => '');
if (!crashed && outcome === 'extracted') {
  // the biggest file really is there: read its last byte through its download link
  info += ' | ' + await page.evaluate(async () => { const rows = [...document.querySelectorAll('[data-entry]')]; const out = []; for (const r of rows) { try { const blob = await (await fetch(r.querySelector('a[download]').href)).blob(); const tail = new Uint8Array(await blob.slice(-4).arrayBuffer()); out.push(`${r.dataset.entry}=${blob.size} readable(tail ${tail.length} B)`); } catch (e) { out.push(`${r.dataset.entry}: NOT READABLE (${e.message})`); } } return out.join(' '); });
}
console.log(engine.name(), outcome, `${secs} s`, info);
await b.close();
