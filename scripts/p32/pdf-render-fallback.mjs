// P32 (04/10) — the iPhone / iPad fallback of PDF to JPG, PDF to Image and PDF Redact: a page the device has not drawn
// within the limit is drawn by /api/pdf-render (pdf-tools, Poppler). Playwright's WebKit draws the kit page in a
// fraction of a second, so the real iPhone failure is NOT reproduced: the device's limit is shortened to 1 ms by the
// test hook window.__localPageLimitMs to force the fallback path (the path itself is what is checked).
//   node scripts/p32/pdf-render-fallback.mjs <origin> [--browser=webkit|chromium] [--device=iphone|desktop]
//        [--route-origin=http://127.0.0.1:3498]   (local: the page's /api/pdf-render requests go to
//                                                  scripts/p32/local-render-route.mjs, the real handler with an
//                                                  in-memory rate limit, so no Supabase counter is ever touched)
//        [--no-vercel-toolbar]
import { chromium, webkit } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const engine = arg('browser', 'webkit');
const device = arg('device', 'iphone');
const routeOrigin = arg('route-origin');
const tag = `${engine} [${device}]${routeOrigin ? ' local route' : ''}`;
const KIT = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const PDF = path.join(KIT, 'kit-iphone-p21', 'pdf-avec-images.pdf');
const OUT = path.join(os.tmpdir(), 'p32-fallback');
fs.mkdirSync(OUT, { recursive: true });
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

const b = await { chromium, webkit }[engine].launch();
const ctx = await b.newContext({ acceptDownloads: true, ...(device === 'iphone' ? { userAgent: UA, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } } : {}) });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.addInitScript(() => { try { localStorage.setItem('__vercel_toolbar', '0'); } catch { /* */ } document.cookie = '__vercel_toolbar=0; path=/'; });

if (routeOrigin) {
  await ctx.addInitScript((o) => {
    const f = window.fetch.bind(window);
    window.fetch = (u, init) => f(typeof u === 'string' && u.startsWith('/api/pdf-render') ? o + u : u, init);
  }, routeOrigin);
}
let renderCalls = 0;
let failNext = 0;
await ctx.route('**/api/pdf-render', async (route) => {
  renderCalls++;
  if (failNext > 0) { failNext--; return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Our PDF service could not draw this page.' }) }); }
  return route.continue(); // counted only: the body (file part included) goes on untouched
});

async function pdfToImages(tool, { mode = 'pages', format, forceMs } = {}) {
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', (m) => { if (/^\[pdf-to-images\]/.test(m.text())) logs.push(m.text()); });
  // iPhone: the device's limit before our service (P32); desktop: the P31 limit before the message
  if (forceMs) await p.addInitScript((ms) => { window.__localPageLimitMs = ms; window.__pdfPageTimeLimitMs = ms; }, forceMs);
  await p.goto(`${origin}/tools/pdf-tools/${tool}`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(PDF);
  if (mode === 'images') await p.getByRole('combobox', { name: 'Mode' }).selectOption('images');
  if (format) await p.getByRole('combobox', { name: 'Format' }).selectOption(format);
  if (mode === 'pages') await p.waitForSelector('[data-server-render-note]', { timeout: 3000 }).catch(() => {});
  const upfront = await p.locator('[data-server-render-note]').count();
  const before = renderCalls;
  const t0 = Date.now();
  await p.getByRole('button', { name: mode === 'images' ? 'Extract images' : 'Convert pages' }).click();
  await p.waitForFunction(() => !!document.querySelector('[role=alert][data-p2i-message]') || document.querySelectorAll('[data-file-download]').length >= 3, null, { timeout: 150000 }).catch(() => {});
  await p.waitForTimeout(800);
  const rows = await p.locator('[data-file-download]').evaluateAll((els) => els.map((e) => ({ name: e.dataset.name, bytes: +e.dataset.bytes })));
  const notes = await p.locator('[data-file-download]').evaluateAll((els) => els.map((e) => e.closest('div')?.innerText || ''));
  // the real image bytes of the first row, read back from the page (decoded size checked here)
  const dims = await p.evaluate(async () => {
    const img = document.querySelector('img[alt^="page"]');
    if (!img) return null;
    await img.decode().catch(() => {});
    return { w: img.naturalWidth, h: img.naturalHeight };
  });
  const message = await p.locator('[data-p2i-message]').allInnerTexts();
  const busy = await p.getByRole('button', { name: /Page \d+ of|Looking for images|Converting|Sending/ }).count();
  await p.close();
  return { rows, notes, message, busy, upfront, calls: renderCalls - before, ms: Date.now() - t0, logs, dims };
}

const iphone = device === 'iphone';
if (!fs.existsSync(PDF)) check('kit PDF present', false, PDF);
else {
  // 1. forced fallback: every page drawn by the service
  let r = await pdfToImages('pdf-to-jpg', { forceMs: 1 });
  if (iphone) {
    check(`PDF to JPG, device limit forced: 3 JPGs by our service (${r.rows.map((x) => `${x.name} ${x.bytes} B`).join(', ')}) in ${r.ms} ms`, r.rows.length === 3 && r.rows.every((x) => /-page-\d\.jpg$/.test(x.name) && x.bytes > 1000) && r.calls === 3, JSON.stringify(r));
    check(`… image at 150 dpi (${r.dims?.w}×${r.dims?.h})`, r.dims?.w === 1241 && r.dims?.h === 1754);
    check('… each row says "drawn by our PDF service"', r.notes.length === 3 && r.notes.every((t) => /drawn by our PDF service/.test(t)), r.notes.join(' | '));
    check(`… notice after: "${(r.message.find((m) => /our own PDF service/.test(m)) || '').slice(0, 100)}…"`, r.message.some((m) => /could not draw pages 1, 2 and 3, so our own PDF service drew them: your PDF was sent there, then deleted/.test(m)), JSON.stringify(r.message));
    check('… notice before (on iPhone, pages mode)', r.upfront === 1);
  } else {
    check('desktop, device limit forced: clear message, NO server call', r.calls === 0 && r.message.some((m) => /could not be finished on this device/.test(m)) && r.busy === 0, JSON.stringify(r));
    check('desktop: no fallback notice', r.upfront === 0);
  }
  // 2. normal run: the device draws, the service is not called
  r = await pdfToImages('pdf-to-jpg');
  check(`PDF to JPG, normal: 3 JPGs drawn on the device, 0 server call (${r.ms} ms)`, r.rows.length === 3 && r.calls === 0 && r.notes.every((t) => !/our PDF service/.test(t)), JSON.stringify(r));
  // 3. Extract images never goes to the service
  r = await pdfToImages('pdf-to-jpg', { mode: 'images' });
  check('Extract images: the photos, 0 server call, no fallback notice in this mode', r.rows.length >= 3 && r.calls === 0 && r.upfront === 0, JSON.stringify(r));
  if (iphone) {
    // 4. PDF to Image, WebP and TIFF through the service
    r = await pdfToImages('pdf-to-image', { format: 'webp', forceMs: 1 });
    check(`PDF to Image WebP via the service: 3 .webp (${r.rows.map((x) => x.bytes).join(', ')} B)`, r.rows.length === 3 && r.rows.every((x) => /\.webp$/.test(x.name)) && r.calls === 3, JSON.stringify(r));
    r = await pdfToImages('pdf-to-image', { format: 'tiff', forceMs: 1 });
    check('PDF to Image TIFF via the service: 3 .tiff', r.rows.length === 3 && r.rows.every((x) => /\.tiff$/.test(x.name)), JSON.stringify(r));
    // 5. the service fails on page 2: clear message, page 1 kept, button usable
    failNext = 0;
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__localPageLimitMs = 1; });
    await p.goto(`${origin}/tools/pdf-tools/pdf-to-jpg`, { waitUntil: 'load' });
    await p.waitForTimeout(800);
    await p.locator('input[type=file]').first().setInputFiles(PDF);
    let n = 0;
    await p.route('**/api/pdf-render', (route) => (++n === 2 ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Our PDF service could not draw this page.' }) }) : route.fallback()));
    await p.getByRole('button', { name: 'Convert pages' }).click();
    await p.waitForSelector('[role=alert][data-p2i-message]', { timeout: 60000 }).catch(() => {});
    const msg = await p.locator('[role=alert][data-p2i-message]').innerText().catch(() => '');
    const rows = await p.locator('[data-file-download]').count();
    const busy = await p.getByRole('button', { name: /Page \d+ of|Sending/ }).count();
    check(`service failure on page 2: "${msg.slice(0, 110)}…", page 1 kept, button usable`, /Page 2 of 3 could not be drawn on this device, and our PDF service could not draw it either/.test(msg) && rows === 1 && busy === 0, JSON.stringify({ msg, rows, busy }));
    await p.close();
    // 6. PDF Redact, page drawn by the service, matches blacked out in the browser
    const q = await ctx.newPage();
    await q.addInitScript(() => { window.__localPageLimitMs = 1; });
    await q.goto(`${origin}/tools/pdf-tools/pdf-redact`, { waitUntil: 'load' });
    await q.waitForTimeout(800);
    await q.waitForSelector('[data-server-render-note]', { timeout: 3000 }).catch(() => {});
    const redUpfront = await q.locator('[data-server-render-note]').count();
    await q.locator('input[type=file]').first().setInputFiles(PDF);
    await q.locator('#rd-terms').fill('photo-2');
    const before = renderCalls;
    await q.getByRole('button', { name: 'Redact PDF' }).click();
    await q.waitForSelector('[data-summary], [role=alert]', { timeout: 90000 }).catch(() => {});
    const summary = await q.locator('[data-summary]').innerText().catch(() => '');
    let text = '', pages = 0;
    const out = path.join(OUT, `redacted-${engine}.pdf`);
    try {
      const [dl] = await Promise.all([q.waitForEvent('download', { timeout: 30000 }), q.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
      await dl.saveAs(out);
      text = execFileSync('pdftotext', ['-f', '2', '-l', '2', out, '-']).toString();
      pages = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [out]).toString())?.[1]);
      try { execFileSync('pdftoppm', ['-f', '2', '-l', '2', '-r', '60', '-png', '-singlefile', out, path.join(OUT, `redacted-${engine}-p2`)]); } catch { /* figure only */ }
    } catch (e) { text = 'ERR ' + e.message; }
    check(`Redact via the service: summary says it ("${summary.slice(-150)}")`, /could not draw page 2, so our own PDF service drew it before the blacking out: your PDF was sent there, then deleted/.test(summary) && renderCalls - before === 1, summary);
    check(`… the result has 3 pages and page 2 has no text left (${JSON.stringify(text.trim().slice(0, 60))})`, pages === 3 && text.trim() === '', `pages=${pages} text=${text.slice(0, 200)}`);
    check('… notice before on the Redact page', redUpfront === 1);
    await q.close();
  }
}
await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${tag})` : `ALL PASS: ${passes} checks (${tag})`);
process.exit(fails ? 1 : 0);
