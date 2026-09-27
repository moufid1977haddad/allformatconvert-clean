// AI Image Upscaler, its own monthly spend cap (point 6, 28/09): on a preview built with UPSCALE_MONTHLY_BUDGET_MICROS=0
// (a branch-scoped preview variable, nothing else changes), the server path must be refused BEFORE our AI service is
// called: /api/image-upscale answers 503 at once with the budget wording, and the page shows it. Firefox (no WebGPU
// here) takes the server path, like a visitor whose browser has none.
// Usage: node scripts/browser-tests/upscaler-budget-cutoff.mjs <origin>
import { firefox } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';

const origin = new URL(process.argv[2]).origin;
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', n, info); };
const src = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'upbudget-')), 'small.jpg');
await sharp({ create: { width: 320, height: 200, channels: 3, background: '#6699cc' } }).jpeg().toFile(src);

const b = await firefox.launch();
const ctx = await b.newContext();
// On a preview the media service sends no CORS header for the preview's address: relay its calls and add that
// header, nothing else (as audio-opus-real.mjs --cors-shim).
await ctx.route(/railway\.app/, async (r) => {
  const cors = { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'Authorization, Content-Type, X-Chunk-Sha256', 'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS', 'access-control-expose-headers': '*' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  const resp = await r.fetch();
  return r.fulfill({ response: resp, headers: { ...resp.headers(), ...cors } });
});
const p = await ctx.newPage();
p.setDefaultTimeout(120000);
let upscale = null;
p.on('response', async (r) => {
  if (!r.url().includes('/api/image-upscale')) return;
  const t = r.request().timing();
  upscale = { status: r.status(), ms: Math.round(t.responseEnd > 0 ? t.responseEnd : t.responseStart), body: await r.text().catch(() => '') };
});
await p.goto(`${origin}/tools/ai-tools/image-upscaler`, { waitUntil: 'networkidle' });
await p.locator('input[type=file]').setInputFiles(src);
await p.getByRole('button', { name: 'Upscale Image' }).click();
const msg = await p.locator('text=/reached its monthly budget/').first().waitFor({ timeout: 120000 }).then(() => true, () => false);
await p.waitForTimeout(500);
check('the page says the monthly budget is reached', msg, (await p.locator('p.text-red-600').allInnerTexts()).join(' '));
check('/api/image-upscale refused with 503 before calling the AI service', upscale?.status === 503 && /monthly budget/.test(upscale.body), JSON.stringify(upscale));
check('refused at once (< 3 s): no upscale was run, nothing spent', upscale && upscale.ms < 3000, `${upscale?.ms} ms`);
check('no download offered', (await p.locator('a[download]').count()) === 0);
await b.close();
console.log(fails ? `FAILURES: ${fails}` : 'ALL PASS');
process.exit(fails ? 1 : 0);
