// What the prelancement-01-10 branch changed, checked as a visitor in one engine:
//  1. layout: exactly one <main>; no Google Translate, Supabase or AdSense code at load; the Arabic font not preloaded;
//     analytics still arrives (lazily); Sign In shown; no page error;
//  2. Google Translate on demand: opening the language menu loads it, choosing Français translates the page, and a new
//     page opened afterwards is translated again at load (googtrans cookie), then back to English;
//  3. mega-menu: hovering a category shows its tools WITH their icons (loaded after the first paint);
//  4. privacy & terms: the per-tool lists (Pangram, ConvertAPI, our own servers), no Advertising section while ads are
//     off; /ads.txt answers 404; no AdSense slot on a tool page;
//  5. PDF Sign: typed signature and uploaded signature (white paper removed) stamped into a real PDF;
//  5 bis. the 8 PDF tools whose engine (pdf-lib) now loads on use: each produces a readable PDF (or an encrypted one);
//  6. Password Generator: every selected kind present in 300 passwords (length 8, 4 kinds);
//  7. URL Encoder (both copies): "+" decoded as a space by default, kept when unticked;
//  8. Sticky Notes: a malformed note in storage no longer crashes the page.
// Our own visits are not counted in Google Analytics (collect requests blocked).
// Usage: node scripts/browser-tests/prelancement-01-10.mjs <origin> [--browser=chromium|firefox|webkit]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument } from '@cantoo/pdf-lib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, ok ? '' : info); };
const run = (k) => !only.length || only.includes(k);

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
await ctx.route(/google-analytics\.com\/g\/collect|analytics\.google\.com\/g\/collect/, (r) => r.abort());

async function open(url, { waitIdle = false } = {}) {
  const p = await ctx.newPage();
  const errors = [];
  const requests = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('request', (r) => requests.push(r.url()));
  await p.goto(origin + url, { waitUntil: waitIdle ? 'networkidle' : 'load', timeout: 60000 });
  return { p, errors, requests };
}

// ---- 1. layout ---------------------------------------------------------------------------------------------------
if (run('layout')) {
  const { p, errors, requests } = await open('/tools/image-tools/image-compressor');
  check('one <main> landmark', (await p.locator('main').count()) === 1);
  // The Arabic font (≈ 166 KB, only for pages translated to Arabic) was the one large preloaded font.
  const preloads = await p.evaluate(async () => Promise.all([...document.querySelectorAll('link[rel=preload][as=font]')].map(async (l) => ({ href: l.href, bytes: (await (await fetch(l.href)).arrayBuffer()).byteLength }))));
  check('no large font preloaded (Arabic font only on demand)', preloads.every((f) => f.bytes < 100000), JSON.stringify(preloads));
  const early = [...requests];
  check('no Google Translate script at load', !early.some((u) => /translate\.google|translate_a\/element/.test(u)), early.filter((u) => /translate/.test(u)).join(' '));
  check('no AdSense script (ads off)', !early.some((u) => /googlesyndication|adsbygoogle/.test(u)));
  await p.waitForTimeout(6000); // idle: analytics (lazyOnload), Supabase and the icon table arrive
  check('Google Analytics still loads (lazily)', requests.some((u) => /googletagmanager\.com\/gtag\/js/.test(u)));
  check('Sign In link shown', await p.getByRole('link', { name: 'Sign In' }).isVisible());
  check('no page error', errors.length === 0, errors.join(' | '));
  await p.close();
}

// ---- 2. Google Translate on demand -------------------------------------------------------------------------------
if (run('translate')) {
  const { p, errors, requests } = await open('/tools/text-tools/word-counter');
  const langBtn = p.locator('header button', { hasText: /^EN/ }).first();
  await langBtn.click();
  await p.getByRole('button', { name: /Français|French/ }).first().click();
  let translated = false;
  for (let i = 0; i < 40 && !translated; i++) { await p.waitForTimeout(500); translated = /translated-(ltr|rtl)/.test(await p.evaluate(() => document.documentElement.className)); }
  check('language menu loads Google Translate', requests.some((u) => /translate_a\/element\.js/.test(u)));
  check('choosing French translates the page', translated);
  const cookie = (await ctx.cookies(origin)).find((c) => c.name === 'googtrans');
  check('googtrans cookie set', Boolean(cookie) && /\/fr$/.test(decodeURIComponent(cookie.value)), JSON.stringify(cookie));
  await p.close();
  const next = await open('/tools/text-tools/case-converter');
  let again = false;
  for (let i = 0; i < 40 && !again; i++) { await next.p.waitForTimeout(500); again = /translated-(ltr|rtl)/.test(await next.p.evaluate(() => document.documentElement.className)); }
  check('next page translated again at load', again);
  check('no page error while translating', errors.length === 0 && next.errors.length === 0, [...errors, ...next.errors].join(' | '));
  await next.p.close();
  await ctx.clearCookies({ name: 'googtrans' });
  await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
}

// ---- 3. mega-menu icons ------------------------------------------------------------------------------------------
if (run('menu')) {
  const { p, errors } = await open('/about');
  await p.waitForTimeout(3000);
  await p.locator('nav a[href="/tools/pdf-tools"]').first().hover();
  const panel = p.locator('div.fixed.grid').first();
  await panel.waitFor({ timeout: 10000 });
  let icons = 0;
  for (let i = 0; i < 20 && icons < 10; i++) { icons = await panel.locator('a svg').count(); if (icons < 10) await p.waitForTimeout(250); }
  const links = await panel.locator('a[href^="/tools/pdf-tools/"]').count();
  check('PDF mega-menu lists its tools', links >= 30, `${links} links`);
  check('each tool shows its icon', icons >= links, `${icons} icons for ${links} links`);
  check('no page error (menu)', errors.length === 0, errors.join(' | '));
  await p.close();
}

// ---- 4. privacy, terms, ads off ----------------------------------------------------------------------------------
if (run('legal')) {
  const { p } = await open('/privacy');
  const t = await p.locator('main').innerText();
  for (const w of ['Pangram', 'ConvertAPI', 'Video Rotator', 'Background Remover', 'Google Analytics', 'googtrans', 'Railway', 'Resend', 'Supabase']) check(`privacy names ${w}`, t.includes(w));
  check('privacy has no Advertising section while ads are off', !/\d+\. Advertising/.test(t));
  check('privacy says it was updated on September 30, 2026', t.includes('Last updated: September 30, 2026'));
  await p.close();
  const terms = await open('/terms');
  const tt = await terms.p.locator('main').innerText();
  check('terms name the three providers', ['ConvertAPI', 'OpenAI', 'Pangram'].every((w) => tt.includes(w)));
  check('terms no longer treat use of the site as ad consent', !/you consent to the display of such advertisements/.test(tt));
  await terms.p.close();
  const r = await ctx.request.get(origin + '/ads.txt');
  check('/ads.txt answers 404 while ads are off', r.status() === 404, String(r.status()));
  const tool = await open('/tools/developer-tools/json-formatter');
  check('no ad slot on a tool page while ads are off', (await tool.p.locator('ins.adsbygoogle, aside[aria-label="Advertisement"]').count()) === 0);
  check('no "Privacy choices" link while ads are off', (await tool.p.getByRole('button', { name: 'Privacy choices' }).count()) === 0);
  await tool.p.close();
}

// ---- 5. PDF Sign: typed and uploaded signatures ------------------------------------------------------------------
async function makePdf() {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]).drawText('Contract', { x: 50, y: 780, size: 24 });
  doc.addPage([595, 842]).drawText('Page 2', { x: 50, y: 780, size: 24 });
  const f = path.join(os.tmpdir(), `sign-${process.pid}.pdf`);
  fs.writeFileSync(f, await doc.save());
  return f;
}
async function signedPdf(p) {
  await p.getByRole('button', { name: 'Add Signature to PDF' }).click();
  const a = p.getByRole('link', { name: 'Download Signed PDF' });
  await a.waitFor({ timeout: 30000 });
  const href = await a.getAttribute('href');
  const bytes = await p.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href);
  return Buffer.from(bytes);
}
if (run('sign')) {
  const pdf = await makePdf();
  { // typed
    const { p, errors } = await open('/tools/pdf-tools/pdf-sign');
    await p.locator('input[type=file][accept=".pdf"]').setInputFiles(pdf);
    await p.locator('[data-sign-mode=type]').click();
    await p.locator('[data-sign-typed]').fill('Jane Q. Doe');
    await p.waitForFunction(() => { const c = document.querySelector('canvas[data-pad]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n > 500; }, null, { timeout: 15000 });
    const buf = await signedPdf(p);
    const info = await PDFDocument.load(buf).then((d) => ({ pages: d.getPageCount() }));
    check('typed signature: signed PDF produced', buf.length > 1000 && info.pages === 2 && buf.includes(Buffer.from('/Image')), `${buf.length} bytes, ${info.pages} pages`);
    check('no page error (typed signature)', errors.length === 0, errors.join(' | '));
    await p.close();
  }
  { // uploaded image, black ink on white paper
    const { p, errors } = await open('/tools/pdf-tools/pdf-sign');
    const png = await p.evaluate(() => { const c = document.createElement('canvas'); c.width = 600; c.height = 200; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 600, 200); x.strokeStyle = '#111'; x.lineWidth = 8; x.beginPath(); x.moveTo(40, 150); x.bezierCurveTo(150, 20, 300, 190, 560, 40); x.stroke(); return c.toDataURL('image/png').split(',')[1]; });
    const sigFile = path.join(os.tmpdir(), `sig-${process.pid}.png`);
    fs.writeFileSync(sigFile, Buffer.from(png, 'base64'));
    await p.locator('input[type=file][accept=".pdf"]').setInputFiles(pdf);
    await p.locator('[data-sign-mode=upload]').click();
    await p.locator('[data-sign-image]').setInputFiles(sigFile);
    const stats = await p.waitForFunction(() => { const c = document.querySelector('canvas[data-pad]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let ink = 0, paperKept = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200 && d[i] < 80) ink++; if (d[i + 3] > 0 && d[i] > 240) paperKept++; } return ink > 300 ? { ink, paperKept } : null; }, null, { timeout: 15000 }).then((h) => h.jsonValue());
    check('uploaded signature: ink kept, white paper removed', stats.ink > 300 && stats.paperKept === 0, JSON.stringify(stats));
    const buf = await signedPdf(p);
    check('uploaded signature: signed PDF produced', buf.length > 1000 && buf.includes(Buffer.from('/Image')), `${buf.length} bytes`);
    check('no page error (uploaded signature)', errors.length === 0, errors.join(' | '));
    await p.close();
  }
}

// ---- 5 bis. PDF tools whose engine (pdf-lib) now loads when used, not with the page -------------------------------
if (run('pdflazy')) {
  const pdf = await makePdf();
  const photo = path.resolve('docs/audit/fixtures-safari/safari-small-800x600.jpg');
  const cases = [
    ['pdf-delete-pages', async (p) => { await p.getByPlaceholder('1, 3, 5').fill('2'); }, 'Delete Pages', 1],
    ['pdf-number-pages', null, 'Add Page Numbers', 2],
    ['pdf-protect', async (p) => { await p.getByPlaceholder('Enter password').fill('s3cret-Pw'); }, 'Protect PDF', 2, true],
    ['pdf-reorder-pages', async (p) => { await p.getByLabel(/New page order/).fill('2, 1'); }, 'Reorder Pages', 2],
    ['pdf-rotate', null, 'Rotate PDF', 2],
    ['pdf-watermark', async (p) => { await p.getByPlaceholder('CONFIDENTIAL').fill('DRAFT'); }, 'Add Watermark', 2],
    ['jpg-to-pdf', null, 'Convert to PDF', 1, false, photo],
    ['image-to-pdf', null, 'Convert to PDF', 1, false, photo],
  ];
  for (const [tool, fill, button, pages, encrypted, input] of cases) {
    const { p, errors } = await open(`/tools/pdf-tools/${tool}`);
    await p.locator('input[type=file]').first().setInputFiles(input || pdf);
    await p.waitForTimeout(800);
    if (fill) await fill(p);
    await p.getByRole('button', { name: button }).click();
    const a = p.locator('a[download]').first();
    await a.waitFor({ timeout: 30000 }).catch(() => {});
    let ok = false, info = '';
    if (await a.count()) {
      const bytes = Buffer.from(await p.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), await a.getAttribute('href')));
      if (encrypted) { ok = bytes.includes(Buffer.from('/Encrypt')); info = `${bytes.length} bytes`; }
      else { const d = await PDFDocument.load(bytes).catch(() => null); ok = Boolean(d) && d.getPageCount() === pages; info = d ? `${d.getPageCount()} pages` : 'unreadable'; }
    } else info = 'no download link';
    check(`${tool}: result produced (engine loaded on use)`, ok, info);
    check(`no page error (${tool})`, errors.length === 0, errors.join(' | '));
    await p.close();
  }
}

// ---- 6. Password Generator ---------------------------------------------------------------------------------------
if (run('password')) {
  const { p, errors } = await open('/tools/developer-tools/password-generator');
  await p.locator('input[type=range]').evaluate((el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(el, '8'); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.getByText('Length: 8').waitFor({ timeout: 5000 });
  const bad = [];
  for (let i = 0; i < 300; i++) {
    await p.getByRole('button', { name: 'Generate Password' }).click();
    const pw = (await p.locator('div.font-mono').first().innerText()).trim();
    if (!(pw.length === 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw))) bad.push(pw);
  }
  check('300 passwords of 8: each has upper, lower, digit and symbol', bad.length === 0, bad.slice(0, 5).join(' '));
  check('no page error (password)', errors.length === 0, errors.join(' | '));
  await p.close();
}

// ---- 7. URL Encoder, both copies ---------------------------------------------------------------------------------
if (run('url')) {
  for (const u of ['/tools/developer-tools/url-encoder', '/tools/text-tools/url-encoder']) {
    const { p, errors } = await open(u);
    await p.locator('textarea').first().fill('a+b%2Bc%20d');
    await p.getByRole('button', { name: 'Decode' }).click();
    const out1 = await p.locator('textarea[readonly]').inputValue();
    await p.getByLabel(/Decode “\+” as a space/).uncheck();
    await p.getByRole('button', { name: 'Decode' }).click();
    const out2 = await p.locator('textarea[readonly]').inputValue();
    await p.getByLabel(/Decode “\+” as a space/).check();
    await p.locator('textarea').first().fill('1+1=2 & ok');
    await p.getByRole('button', { name: 'Encode' }).click();
    const enc = await p.locator('textarea[readonly]').inputValue();
    await p.locator('textarea').first().fill(enc);
    await p.getByRole('button', { name: 'Decode' }).click();
    const back = await p.locator('textarea[readonly]').inputValue();
    check(`${u}: "+" decoded as a space by default`, out1 === 'a b+c d', JSON.stringify(out1));
    check(`${u}: "+" kept when unticked`, out2 === 'a+b+c d', JSON.stringify(out2));
    check(`${u}: encode then decode returns the text`, back === '1+1=2 & ok', JSON.stringify([enc, back]));
    check(`no page error (${u})`, errors.length === 0, errors.join(' | '));
    await p.close();
  }
}

// ---- 8. Sticky Notes with malformed storage -----------------------------------------------------------------------
if (run('sticky')) {
  const { p, errors } = await open('/tools/text-tools/sticky-notes');
  const k = 'sticky-notes'; // STORAGE_KEY of the page
  await p.evaluate((kk) => localStorage.setItem(kk, JSON.stringify([null, 5, { id: 1, text: { bad: true } }, { id: 2, text: 'kept note', color: 'bg-yellow-300' }, { id: 3, text: 'no colour' }])), k);
  await p.reload();
  await p.waitForTimeout(800);
  const body = await p.locator('main').innerText();
  check('sticky notes: page renders despite malformed notes', (await p.locator('h1').count()) > 0 && body.includes('kept note') && body.includes('no colour'), body.slice(0, 200));
  check('no page error (sticky notes)', errors.length === 0, errors.join(' | '));
  await p.close();
}

await b.close();
console.log(fails ? `${fails} FAIL (${name})` : `ALL PASS (${name})`);
process.exit(fails ? 1 : 0);
