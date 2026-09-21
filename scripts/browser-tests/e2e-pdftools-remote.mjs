// End-to-end of PDF Repair / PDF to PDF/A against a deployed site: real page, real click, and the result
// link's blob is read back and checked (%PDF- magic, size). Reports which path carried the file.
// Usage: node scripts/browser-tests/e2e-pdftools-remote.mjs <entryUrl> <toolPath> <file>
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [entry, toolPath, file] = process.argv.slice(2);
const origin = new URL(entry).origin;
const browser = await chromium.launch();
const ctx = await browser.newContext();
if (new URL(entry).search) { const p = await ctx.newPage(); await p.goto(entry, { waitUntil: 'domcontentloaded' }); await p.close(); }
const page = await ctx.newPage();
const chunkPuts = []; const calls = [];
page.on('request', (r) => {
  if (r.method() === 'PUT' && /\/chunks\/\d+$/.test(r.url())) chunkPuts.push(1);
  if (r.method() === 'POST' && /\/api\/pdf-(repair|to-pdfa)$/.test(r.url())) calls.push({ type: (r.headers()['content-type'] || '').split(';')[0], bytes: (r.postDataBuffer() || Buffer.alloc(0)).length });
});
await page.goto(origin + toolPath, { waitUntil: 'networkidle' });
await page.setInputFiles('input[type=file]', file);
await page.waitForTimeout(400);
const btn = page.locator('button:has-text("Repair PDF"), button:has-text("Convert to PDF/A"), button:has-text("Convert")').first();
const t0 = Date.now();
await btn.click();
const link = await page.waitForSelector('a[download]', { timeout: 420000 }).catch(() => null);
const total = (Date.now() - t0) / 1000;
let info = 'no download link';
if (link) {
  const href = await link.getAttribute('href');
  const res = await page.evaluate(async (u) => { const b = await (await fetch(u)).arrayBuffer(); return { n: b.byteLength, head: new TextDecoder().decode(new Uint8Array(b).slice(0, 5)) }; }, href);
  info = `PDF blob ${(res.n / 1048576).toFixed(2)} MB, magic ${res.head === '%PDF-' ? 'ok' : 'BAD ' + res.head}`;
}
const alerts = await page.$$eval('p[role=alert]', (e) => e.map((x) => x.textContent));
console.log(`  ${link ? 'PASS' : 'FAIL'} ${path.basename(file)} (${(fs.statSync(file).size / 1048576).toFixed(2)} MB) on ${toolPath}: ${total.toFixed(1)} s, ${info}; path ${chunkPuts.length ? 'STAGED (' + chunkPuts.length + ' chunks)' : 'direct'}; route calls ${JSON.stringify(calls)}; alerts ${JSON.stringify(alerts)}`);
await browser.close();
