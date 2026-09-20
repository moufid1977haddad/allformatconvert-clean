// Records HOW a reference site's converter takes a file: every non-trivial request made after
// the file is dropped (method, host, path, body size, status, time). No account created, cookies declined.
// Usage: node scripts/market-tests/probe-upload.mjs <name> <url> <file> [observeSeconds]
import { chromium } from '@playwright/test';
import fs from 'node:fs';
const [name, url, file, obs = '90'] = process.argv.slice(2);
const size = fs.statSync(file).size;
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const t0 = { v: 0 };
const log = [];
page.on('request', (r) => {
  if (!t0.v) return;
  const u = new URL(r.url());
  if (/\.(png|jpg|svg|css|woff2?|ico|gif)(\?|$)/.test(u.pathname) || /google|doubleclick|facebook|analytics|clarity|hotjar|sentry|segment|gtag|cookie|consent/i.test(u.host)) return;
  const body = r.postDataBuffer();
  log.push({ t: ((Date.now() - t0.v) / 1000).toFixed(1), m: r.method(), host: u.host, path: u.pathname.slice(0, 70), body: body ? body.length : 0, r });
});
page.on('response', async (r) => { const e = log.find((x) => x.r === r.request()); if (e) e.status = r.status(); });
page.on('requestfinished', async (r) => { const e = log.find((x) => x.r === r); if (e) { try { e.body = (await r.sizes()).requestBodySize; } catch {} } });
console.log(`== ${name}  ${url}  file=${(size / 1048576).toFixed(1)}MB`);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => console.log('goto err', e.message));
await page.waitForTimeout(4000);
for (const sel of ['button:has-text("Reject")', 'button:has-text("Decline")', 'button:has-text("Refuse")', 'button:has-text("Necessary only")', 'button:has-text("Only necessary")', 'button:has-text("Deny")']) {
  const b = await page.$(sel); if (b) { await b.click().catch(() => {}); break; }
}
const inputs = await page.$$('input[type=file]');
console.log('file inputs found:', inputs.length, '| title:', await page.title());
let chooser = null;
if (!inputs.length && process.env.OPEN) {
  const steps = process.env.OPEN.split(';;');
  for (let i = 0; i < steps.length; i++) {
    const last = i === steps.length - 1;
    const fc = last ? page.waitForEvent('filechooser', { timeout: 20000 }).catch(() => null) : null;
    await page.locator(steps[i]).first().click({ timeout: 10000 }).catch((e) => console.log('open click failed', steps[i], e.message.slice(0, 60)));
    if (!last) await page.waitForTimeout(6000);
    else chooser = await fc;
  }
  console.log('file chooser via click:', !!chooser);
}
if (!inputs.length && !chooser) { console.log('NO FILE INPUT (login wall / bot wall?) body:', (await page.innerText('body')).slice(0, 300).replace(/\s+/g, ' ')); await browser.close(); process.exit(0); }
t0.v = Date.now();
if (chooser) await chooser.setFiles(file); else await inputs[0].setInputFiles(file);
if (process.env.CLICK) {
  await page.waitForTimeout(2500);
  try { await page.locator(process.env.CLICK).first().click({ timeout: 15000 }); console.log(`[+${((Date.now() - t0.v) / 1000).toFixed(1)}s] clicked ${process.env.CLICK}`); }
  catch (e) { console.log('click failed', e.message.slice(0, 80)); }
}
const end = Date.now() + parseInt(obs) * 1000;
let lastText = '';
const seen = new Set();
const KEYS = ['Uploading', 'Processing', 'Converting', 'Compressing', 'Queue', 'Waiting', 'Done', 'Finished', 'Complete', 'Failed', 'Error', 'limit', 'Sign up', 'Log in', 'watermark'];
while (Date.now() < end) {
  await page.waitForTimeout(1000);
  const txt = (await page.innerText('body').catch(() => '')).replace(/\s+/g, ' ');
  lastText = txt;
  for (const k of KEYS) if (!seen.has(k) && new RegExp(k, 'i').test(txt.replace(/Log In Sign Up/i, ''))) { seen.add(k); console.log(`[+${((Date.now() - t0.v) / 1000).toFixed(1)}s] page shows "${k}"`); }
  if (new RegExp(process.env.DONE || '\bDone\b|Finished|Complete\b').test(txt) && (await page.$('a:has-text("Download"), button:has-text("Download")'))) { console.log(`[+${((Date.now() - t0.v) / 1000).toFixed(1)}s] DONE + Download available`); break; }
}
{ const k = lastText.search(/Result|Upload|Convert/); console.log('page text at end:', lastText.slice(Math.max(0, k), Math.max(0, k) + 400)); }
console.log(`exit at +${((Date.now() - t0.v) / 1000).toFixed(1)}s`);
const groups = new Map();
for (const x of log) {
  if (x.m === 'GET' && !/api|download|job|task|status|export|result|file|convert|storage|s3|cdn/i.test(x.host + x.path)) continue;
  const key = `${x.m} ${x.host.replace(/^[a-z0-9]+-[a-z0-9]{2,6}\./, 'NODE.')}${x.path.replace(/[0-9a-f]{16,}/g, ':id')}`;
  const g = groups.get(key) || { first: x.t, n: 0, bytes: 0, statuses: new Set() };
  g.n++; g.bytes += Math.max(0, x.body || 0); g.statuses.add(x.status ?? '?'); groups.set(key, g);
}
console.log('--- distinct API/transfer requests (first time, count, total request body) ---');
for (const [k, g] of [...groups].slice(0, 45)) console.log(`+${g.first}s x${g.n} ${(g.bytes / 1048576).toFixed(2)}MB [${[...g.statuses].join(',')}] ${k}`);
await browser.close();
