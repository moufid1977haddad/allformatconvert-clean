// Every tool page (every app/tools/<category>/<tool>/page.* on disk) and every category page, opened in one engine:
// the page must answer 200, render its <h1>, and raise no uncaught JavaScript error. First pass for Safari
// (WebKit), repeatable for Chromium and Firefox. It does not use the tools -- that is what the per-tool suites do.
// --safari16: the Safari 16.4 / iOS 16.4 simulation (APIs newer than Safari 16.4 removed in pages and Workers, P18).
// Usage: node scripts/browser-tests/all-pages-load.mjs <origin> [--browser=webkit|chromium|firefox] [--safari16]
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { applySafari16Sim } from './lib/safari16-sim.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const browserName = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const engine = { chromium, firefox, webkit }[browserName];
const root = path.resolve('app/tools');
const urls = ['/'];
for (const cat of fs.readdirSync(root)) {
  const cdir = path.join(root, cat); if (!fs.statSync(cdir).isDirectory()) continue;
  urls.push(`/tools/${cat}`);
  for (const t of fs.readdirSync(cdir)) { const tdir = path.join(cdir, t); if (fs.statSync(tdir).isDirectory() && fs.readdirSync(tdir).some((f) => /^page\.(jsx|tsx|js)$/.test(f))) urls.push(`/tools/${cat}/${t}`); }
}
const b = await engine.launch();
const ctx = await b.newContext();
// On a Vercel PREVIEW, Vercel injects its comment toolbar (vercel.live feedback.js); under WebKit it throws
// "navigator.storage.persisted" on every page. Not the site's code (absent on www): --no-vercel-toolbar blocks only it.
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((url) => url.hostname === 'vercel.live', (r) => r.abort());
if (process.argv.includes('--safari16')) await applySafari16Sim(ctx);
const bad = [];
let n = 0;
for (const u of urls) {
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  let status = 0;
  try {
    const r = await p.goto(origin + u, { waitUntil: 'load', timeout: 45000 });
    status = r ? r.status() : 0;
    await p.waitForTimeout(600);
    const h1 = await p.locator('h1').first().textContent({ timeout: 5000 }).catch(() => '');
    // P27: a protected preview redirects to Vercel's login page, which answers 200 with an <h1>: a page that ends on
    // another site is a problem, not a clean page
    if (new URL(p.url()).origin !== new URL(origin).origin) errors.push(`left the site for ${new URL(p.url()).origin}`);
    if (status !== 200 || !h1 || errors.length) bad.push({ u, status, h1: (h1 || '').trim().slice(0, 40), errors: errors.slice(0, 2).map((e) => e.slice(0, 160)) });
  } catch (e) { bad.push({ u, status, errors: [String(e.message).slice(0, 160)] }); }
  await p.close();
  n++;
}
await b.close();
for (const x of bad) console.log('FAIL', JSON.stringify(x));
console.log(`${n} pages opened in ${browserName}${process.argv.includes('--safari16') ? ' (Safari 16.4 simulation)' : ''}: ${n - bad.length} clean, ${bad.length} with a problem`);
process.exit(bad.length ? 1 : 0);
