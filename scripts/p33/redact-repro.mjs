// P33 (05/10) — PDF Redact with the owner's exact case: kit-iphone-p21/pdf-avec-images.pdf, "photo-2", no box ticked.
// Records what the page shows (button label, alert, summary, download row) every second and every console line.
//   node scripts/p33/redact-repro.mjs <origin> [--browser=webkit|chromium] [--device=iphone|desktop] [--term=photo-2]
//        [--step-ms=N]  (test hook: a step with no progress for N ms stops with its sentence)
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'webkit');
const device = arg('device', 'iphone');
const term = arg('term', 'photo-2');
const PDF = arg('pdf') || path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const OUT = path.join(os.tmpdir(), 'p33-redact');
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, isMobile: engine !== 'webkit' || true, viewport: { width: 390, height: 844 } } : {}) });
const p = await ctx.newPage();
p.on('console', (m) => console.log('  console', m.type(), m.text().slice(0, 300)));
p.on('pageerror', (e) => console.log('  pageerror', e.message));
p.on('request', (r) => { if (/\/api\//.test(r.url())) console.log('  request', r.method(), new URL(r.url()).pathname); });
if (arg('step-ms')) await p.addInitScript((ms) => { window.__redactStepLimitMs = ms; }, Number(arg('step-ms')));
await p.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(PDF);
await p.locator('#rd-terms').fill(term);
const t0 = Date.now();
await (device === 'iphone' ? p.getByRole('button', { name: 'Redact PDF' }).tap() : p.getByRole('button', { name: 'Redact PDF' }).click());
let last = '';
for (let s = 0; s < 90; s++) {
  const st = await p.evaluate(() => ({
    button: [...document.querySelectorAll('button')].map((x) => x.innerText).find((t) => /Redact|Page \d|Search|Black/.test(t)) || '',
    alert: document.querySelector('p[role=alert]')?.innerText || '',
    summary: document.querySelector('[data-summary]')?.innerText || '',
    progress: document.querySelector('[data-redact-progress]')?.innerText || '',
    rows: document.querySelectorAll('[data-file-download]').length,
  }));
  const line = JSON.stringify(st);
  if (line !== last) { console.log(`${((Date.now() - t0) / 1000).toFixed(1)} s`, line); last = line; }
  if (st.alert || st.rows) break;
  await p.waitForTimeout(1000);
}
const rows = await p.locator('[data-file-download]').count();
if (rows) {
  const out = path.join(OUT, `redacted-${engine}-${device}.pdf`);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
  await dl.saveAs(out);
  console.log('saved', out, fs.statSync(out).size, 'B');
}
await b.close();
