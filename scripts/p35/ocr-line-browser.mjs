// P35 (06/10, D1) — on screen: an iPhone whose page goes to our OCR service while the service is busy with other
// visitors' pages sees its place in line, then its text — no failure. Local: the page (next start) + the real handler
// (scripts/p33/local-routes.mjs, streamed) + a local pdf-tools (2 at a time). Six other "visitors" fill the line
// directly on the service first.
//   node scripts/p35/ocr-line-browser.mjs <origin> --route-origin=http://127.0.0.1:3498 --service=http://127.0.0.1:3597 --key=<test key>
//   [--browser=webkit|chromium]
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const routeOrigin = arg('route-origin');
const service = arg('service');
const key = arg('key');
const engine = arg('browser', 'webkit');
const PDF = path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${engine} ${n}`, ok ? '' : `— ${info}`); };

// six other visitors, each with its own key, sent straight to the service (they wait in line too)
const bytes = fs.readFileSync(PDF);
const others = Array.from({ length: 6 }, (_, i) => {
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'application/pdf' }), 'x.pdf');
  form.append('page', String((i % 3) + 1)); form.append('lang', 'eng'); form.append('dpi', '400');
  return fetch(`${service}/v1/ocr-page`, { method: 'POST', body: form, headers: { 'X-API-Key': key, 'X-OCR-Stream': '1', 'X-Client-Key': createHash('sha256').update(`other-${i}`).digest('hex') } }).then((r) => r.text());
});
await new Promise((r) => setTimeout(r, 400));

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } });
await ctx.addInitScript((o) => { window.__localOcrLimitMs = 1; const f = window.fetch.bind(window); window.fetch = (u, init) => f(typeof u === 'string' && /^\/api\/pdf-(ocr|render)/.test(u) ? o + u : u, init); }, routeOrigin);
const p = await ctx.newPage();
await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'load' });
await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(PDF);
const seen = new Set();
const t0 = Date.now();
await p.getByRole('button', { name: 'Run OCR' }).click();
const shots = [];
for (let i = 0; i < 600; i++) {
  const s = await p.locator('[data-ocr-progress]').innerText().catch(() => '');
  if (s && !seen.has(s)) { seen.add(s); console.log(`  +${((Date.now() - t0) / 1000).toFixed(1)} s: ${s}`); if (/in line|is next/.test(s) && shots.length < 1) { const f = path.join(os.tmpdir(), `p35-ocr-line-${engine}.png`); await p.screenshot({ path: f }); shots.push(f); } }
  if (await p.locator('textarea[aria-label="Recognized Text"]').count() || await p.locator('p[role=alert]').count()) break;
  await p.waitForTimeout(100);
}
const text = await p.locator('textarea[aria-label="Recognized Text"]').inputValue().catch(() => '');
const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
const lines = [...seen];
check('the page told its place in line ("number N in line" / "yours is next")', lines.some((l) => /yours is number \d+ in line|yours is next/.test(l)), lines.join(' | '));
check('places shown only go down', (() => { const n = lines.map((l) => (/number (\d+) in line/.exec(l) || [])[1]).filter(Boolean).map(Number); return n.every((x, i) => i === 0 || x < n[i - 1]); })(), lines.join(' | '));
check('then the text of the 3 pages, no error', !alert && /photo-1\.jpg/.test(text) && /photo-3\.jpg/.test(text), alert || text.slice(0, 200));
console.log(`  screenshot: ${shots[0] || 'none'}`);
await b.close();
await Promise.all(others);
console.log(`\n${passes} PASS, ${fails} FAIL`);
process.exit(fails ? 1 : 0);
