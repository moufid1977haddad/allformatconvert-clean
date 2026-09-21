// End-to-end of Audio to Text (file upload) against a deployed site: real page, file picker, click.
// Reports which path carried the file (staged chunks or direct multipart) and what the page ended up showing.
// Usage: node scripts/browser-tests/e2e-audio-remote.mjs <entryUrl> <file> [toolPath]
// NOTE: each successful run is one paid Whisper call (~$0.006 per minute of audio); run on a preview only.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const [entry, file, toolPath = '/tools/audio-tools/audio-to-text'] = process.argv.slice(2);
const origin = new URL(entry).origin;
const browser = await chromium.launch();
const ctx = await browser.newContext();
if (new URL(entry).search) { const p = await ctx.newPage(); await p.goto(entry, { waitUntil: 'domcontentloaded' }); await p.close(); }
const page = await ctx.newPage();
const chunkPuts = []; const calls = [];
page.on('request', (r) => {
  if (r.method() === 'PUT' && /\/chunks\/\d+$/.test(r.url())) chunkPuts.push(1);
  if (r.method() === 'POST' && r.url().endsWith('/api/ai-transcribe')) calls.push({ type: (r.headers()['content-type'] || '').split(';')[0], bytes: (r.postDataBuffer() || Buffer.alloc(0)).length });
});
await page.goto(origin + toolPath, { waitUntil: 'networkidle' });
const uploadTab = page.locator('button:has-text("Upload"), button:has-text("File")').first();
if (await uploadTab.count()) await uploadTab.click().catch(() => {});
await page.setInputFiles('input[type=file]', file);
await page.waitForTimeout(300);
const btn = page.locator('button:has-text("Transcribe")').first();
const t0 = Date.now();
if (await btn.count() && !(await btn.isDisabled())) await btn.click();
else console.log('  (no enabled Transcribe button: refused before sending?) alerts:', await page.$$eval('p[role=alert]', (e) => e.map((x) => x.textContent)));
// the transcript of a synthetic tone is empty, so success is "no error shown and the request answered"
const resp = await page.waitForResponse((r) => r.url().endsWith('/api/ai-transcribe'), { timeout: 300000 }).catch(() => null);
const total = (Date.now() - t0) / 1000;
const body = resp ? await resp.text() : '';
const alerts = await page.$$eval('p[role=alert]', (e) => e.map((x) => x.textContent));
console.log(`  ${path.basename(file)} (${(fs.statSync(file).size / 1048576).toFixed(2)} MB): ${total.toFixed(1)} s, route HTTP ${resp ? resp.status() : 'none'}, body ${body.slice(0, 120)}, path ${chunkPuts.length ? 'STAGED (' + chunkPuts.length + ' chunks)' : 'direct'}, route calls ${JSON.stringify(calls)}, alerts ${JSON.stringify(alerts)}`);
await browser.close();
