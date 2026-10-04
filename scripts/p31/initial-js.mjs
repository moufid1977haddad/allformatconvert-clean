// P31 (03/10): JavaScript the Code Formatter page downloads before any click (what "the page stays light" means).
// Sums every script response of the initial load (decoded bytes, and gzip bytes as `next start` would send them).
//   node scripts/p31/initial-js.mjs http://localhost:3311
import { chromium } from '@playwright/test';
import zlib from 'node:zlib';

const origin = new URL(process.argv[2] || 'http://localhost:3311').origin;
const b = await chromium.launch();
const ctx = await b.newContext();
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
const p = await ctx.newPage();
const scripts = [];
p.on('response', async (r) => {
  if (r.request().resourceType() !== 'script') return;
  try { const body = await r.body(); scripts.push({ url: r.url(), raw: body.length, gz: zlib.gzipSync(body).length }); } catch { /* redirect */ }
});
await p.goto(origin + '/tools/developer-tools/code-formatter', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const raw = scripts.reduce((s, x) => s + x.raw, 0), gz = scripts.reduce((s, x) => s + x.gz, 0);
for (const s of scripts.sort((a, c) => c.raw - a.raw)) console.log(String(s.raw).padStart(8), String(s.gz).padStart(7), s.url.replace(origin, ''));
console.log(`TOTAL ${scripts.length} scripts, ${(raw / 1024).toFixed(1)} KiB decoded, ${(gz / 1024).toFixed(1)} KiB gzip`);
await b.close();
