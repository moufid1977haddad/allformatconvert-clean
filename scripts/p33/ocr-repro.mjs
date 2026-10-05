// P33 (05/10) — PDF OCR with the owner's case: kit-iphone-p21/pdf-avec-images.pdf, English, "Run OCR".
// Logs what the page shows every second, the console, and every request to a CDN / our API (Tesseract's engine and
// language data included).
//   node scripts/p33/ocr-repro.mjs <origin> [--browser=webkit|chromium] [--device=iphone|desktop] [--pdf=…] [--max=180]
import { chromium, webkit } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'webkit');
const device = arg('device', 'iphone');
const max = Number(arg('max', '180'));
const PDF = arg('pdf') || path.join(process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit'), 'kit-iphone-p21', 'pdf-avec-images.pdf');
const OUT = path.join(os.tmpdir(), 'p33-ocr');
fs.mkdirSync(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, isMobile: engine !== 'webkit', viewport: { width: 390, height: 844 } } : {}) });
const p = await ctx.newPage();
p.on('console', (m) => console.log('  console', m.type(), m.text().slice(0, 300)));
p.on('pageerror', (e) => console.log('  pageerror', e.message));
const t0 = Date.now();
const at = () => `${((Date.now() - t0) / 1000).toFixed(1)} s`;
p.on('requestfinished', async (r) => { const u = new URL(r.url()); if (u.origin !== origin || /\/api\//.test(u.pathname)) { const res = await r.response(); console.log('  req', at(), r.method(), u.host + u.pathname.slice(0, 90), res?.status(), (await res?.body().catch(() => null))?.length ?? ''); } });
p.on('requestfailed', (r) => console.log('  reqfailed', at(), r.url().slice(0, 120), r.failure()?.errorText));
p.on('worker', (w) => console.log('  worker', at(), w.url().slice(0, 120)));
await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'load' });
await p.waitForTimeout(800);
await p.locator('input[type=file]').first().setInputFiles(PDF);
const run = p.getByRole('button', { name: 'Run OCR' });
await (device === 'iphone' && engine !== 'webkit' ? run.tap() : run.click());
let last = '';
for (let s = 0; s < max; s++) {
  const st = await p.evaluate(() => ({
    status: [...document.querySelectorAll('p, [role=progressbar], [aria-valuenow]')].map((x) => x.innerText || x.getAttribute('aria-valuenow')).filter((t) => /Page \d|Download|Recogni|%|OCR|server|service/i.test(t || '')).join(' | ').slice(0, 400),
    alert: document.querySelector('[role=alert]')?.innerText || [...document.querySelectorAll('p.text-red-400')].map((x) => x.innerText).join(' '),
    text: document.querySelector('textarea[aria-label="Recognized Text"]')?.value?.slice(0, 200) || '',
    rows: document.querySelectorAll('[data-file-download]').length,
  }));
  const line = JSON.stringify(st);
  if (line !== last) { console.log(at(), line); last = line; }
  if (st.alert || st.rows || st.text) break;
  await p.waitForTimeout(1000);
}
if (await p.locator('[data-file-download]').count()) {
  const out = path.join(OUT, `ocr-${engine}-${device}.pdf`);
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
  await dl.saveAs(out);
  console.log('saved', out, fs.statSync(out).size, 'B');
}
await b.close();
