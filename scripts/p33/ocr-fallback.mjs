// P33 (05/10) — PDF OCR: the one-control language picker and the iPhone / iPad fallback to our OCR service.
// Playwright's WebKit recognizes the kit PDF in ~4 s, so the real iPhone failure is NOT reproduced: the device's limit
// is shortened by the test hook window.__localOcrLimitMs, or the OCR engine's CDN is blocked, to force the fallback
// path (the path itself is what is checked).
//   node scripts/p33/ocr-fallback.mjs <origin> [--browser=webkit|chromium] [--device=iphone|desktop]
//        [--route-origin=http://127.0.0.1:3498]  (scripts/p33/local-routes.mjs: the real handlers + local pdf-tools)
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
const tag = `${engine} [${device}]`;
const KIT = process.env.P31_KIT || path.join(os.tmpdir(), 'p31-kit');
const PDF = path.join(KIT, 'kit-iphone-p21', 'pdf-avec-images.pdf');
const OUT = path.join(os.tmpdir(), 'p33-ocr-fallback');
fs.mkdirSync(OUT, { recursive: true });
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${tag} ${n}`, ok ? '' : info); };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';
const iphone = device === 'iphone';

async function newContext(locale = 'en-US') {
  const ctx = await b.newContext({ acceptDownloads: true, locale, ...(iphone ? { userAgent: UA, hasTouch: true, viewport: { width: 390, height: 844 } } : {}) });
  if (routeOrigin) await ctx.addInitScript((o) => { const f = window.fetch.bind(window); window.fetch = (u, init) => f(typeof u === 'string' && /^\/api\/pdf-(ocr|render)/.test(u) ? o + u : u, init); }, routeOrigin);
  ctx.calls = [];
  // counted and the language field read (the multipart text fields are in the body Playwright exposes)
  await ctx.route('**/api/pdf-ocr', async (route) => { const body = route.request().postData() || ''; ctx.calls.push((/name="lang"\r\n\r\n([^\r]*)/.exec(body) || [])[1] || '?'); if (ctx.failCall && ctx.calls.length === ctx.failCall) return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'Our OCR service could not recognize this page.' }) }); return route.continue(); });
  return ctx;
}

async function run(ctx, { hook, blockCdn = false, langs = null } = {}) {
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', (m) => { if (/\[pdf-ocr\]/.test(m.text())) logs.push(m.text()); });
  if (hook) await p.addInitScript((ms) => { window.__localOcrLimitMs = ms; }, hook);
  if (blockCdn) await p.route(/cdn\.jsdelivr\.net/, (r) => r.abort());
  await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'load' });
  await p.waitForTimeout(800);
  await p.locator('input[type=file]').first().setInputFiles(PDF);
  if (langs) {
    for (const chip of await p.locator('[data-language-chip]').all()) await chip.getByRole('button').click();
    for (const [q, code] of langs) {
      await p.getByRole('combobox').fill(q);
      await p.locator(`[role=option][data-code="${code}"]`).click();
    }
    await p.keyboard.press('Escape');
  }
  const upfront = await p.locator('[data-server-render-note]').count();
  const before = ctx.calls.length;
  const t0 = Date.now();
  await p.getByRole('button', { name: 'Run OCR' }).click();
  await p.waitForFunction(() => !!document.querySelector('p[role=alert]') || !!document.querySelector('textarea[aria-label="Recognized Text"]'), null, { timeout: 180000 }).catch(() => {});
  await p.waitForTimeout(500);
  const text = await p.locator('textarea[aria-label="Recognized Text"]').inputValue().catch(() => '');
  const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
  const note = await p.locator('[data-ocr-server-note]').innerText().catch(() => '');
  const runAgain = await p.getByRole('button', { name: 'Run OCR' }).count();
  let pdfText = '', file = null;
  if (await p.locator('[data-file-download] a').count()) {
    file = path.join(OUT, `ocr-${engine}-${device}-${Date.now()}.pdf`);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('[data-file-download] a').first().click({ noWaitAfter: true })]);
    await dl.saveAs(file);
    pdfText = execFileSync('pdftotext', ['-raw', file, '-']).toString();
  }
  await p.close();
  return { text, alert, note, upfront, calls: ctx.calls.slice(before), ms: Date.now() - t0, pdfText, file, logs, runAgain };
}

const b = await { chromium, webkit }[engine].launch();
if (!fs.existsSync(PDF)) { check('kit PDF present', false, PDF); process.exit(1); }
const imgList = (f) => execFileSync('pdfimages', ['-list', f]).toString().split('\n').slice(2).filter(Boolean).map((l) => l.replace(/\s+\d+\s+\d+\s+\d+\s+\d+\s+[\d.]+[KMB]?\s+[\d.]+%\s*$/, '').replace(/\s+/g, ' ')).join('|');

// 1. normal run: the device recognizes, nothing is sent
let ctx = await newContext();
let r = await run(ctx);
check(`normal run: text of the 3 pages, 0 call to our OCR service (${r.ms} ms)`, /photo-1\.jpg/.test(r.text) && /photo-3\.jpg/.test(r.text) && r.calls.length === 0 && !r.note, JSON.stringify({ ...r, pdfText: undefined }).slice(0, 400));
check(`… notice before ${iphone ? 'shown' : 'NOT shown'} (${iphone ? 'iPhone' : 'computer'})`, r.upfront === (iphone ? 1 : 0));
check('… searchable PDF: its text is the recognized text', /photo-2/.test(r.pdfText));
if (iphone) {
  // 2. device limit forced to 1 ms: every page by our service
  r = await run(ctx, { hook: 1 });
  check(`limit forced: 3 pages by our OCR service (${r.calls.length} calls, lang ${r.calls.join(',')}) in ${r.ms} ms`, r.calls.length === 3 && r.calls.every((l) => l === 'eng') && /photo-1\.jpg/.test(r.text) && /photo-2\.jpg/.test(r.text) && /photo-3\.jpg/.test(r.text), JSON.stringify({ ...r, pdfText: undefined }).slice(0, 500));
  check(`… notice after: "${r.note}"`, /could not recognize pages 1, 2 and 3, so our own OCR service recognized them: your PDF was sent there, then deleted/.test(r.note));
  check('… searchable PDF made from the service\'s layers', /photo-2/.test(r.pdfText) && /PDF avec images/.test(r.pdfText), r.pdfText.slice(0, 200));
  if (r.file) check('… the pages themselves are unchanged (same pictures, same encodings)', imgList(r.file) === imgList(PDF), `${imgList(r.file)} ≠ ${imgList(PDF)}`);
  // 3. the OCR engine cannot be downloaded (CDN blocked): our service takes over, no error
  const c3 = await newContext();
  r = await run(c3, { blockCdn: true });
  check(`engine CDN blocked: our service recognizes the 3 pages, no error (${r.calls.length} calls)`, r.calls.length === 3 && !r.alert && /photo-2\.jpg/.test(r.text), JSON.stringify({ ...r, pdfText: undefined }).slice(0, 400));
  // 4. our service fails on page 2: clear message, page 1 kept, button usable, "sent … then deleted" said
  const c4 = await newContext();
  c4.failCall = 2;
  r = await run(c4, { hook: 1 });
  check(`service failure on page 2: "${r.alert.slice(0, 120)}…"`, /Page 2 of 3 could not be recognized on this device, and our OCR service could not recognize it either/.test(r.alert) && /Your PDF was sent to our own OCR service for this attempt, then deleted/.test(r.alert), r.alert);
  check('… the text of page 1 stays, the button is usable again', /photo-1\.jpg/.test(r.text) && !/photo-2\.jpg/.test(r.text) && r.runAgain === 1, r.text.slice(0, 200));
  // 5. two languages chosen in the one control: both reach the service
  r = await run(ctx, { hook: 1, langs: [['eng', 'eng'], ['fran', 'fra']] });
  check(`English + French chosen in the combobox → service asked "eng+fra" (${r.calls.join(',')})`, r.calls.length === 3 && r.calls.every((l) => l === 'eng+fra') && /photo-2\.jpg/.test(r.text), r.calls.join(','));
} else {
  // 6. computer: the hook does nothing, nothing is ever sent
  r = await run(ctx, { hook: 1 });
  check(`computer, hook set: still 0 call, text read (${r.ms} ms)`, r.calls.length === 0 && /photo-2\.jpg/.test(r.text), JSON.stringify({ ...r, pdfText: undefined }).slice(0, 300));
}
await ctx.close();

// 7. the language picker itself
const cf = await newContext('fr-CA');
const p = await cf.newPage();
await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'load' });
await p.waitForTimeout(800);
check('browser language fr-CA → French chosen first', (await p.locator('[data-language-chip]').allInnerTexts()).join('|').startsWith('French'), (await p.locator('[data-language-chip]').allInnerTexts()).join('|'));
check('ONE control: no separate search box, one combobox', (await p.locator('input[placeholder="Search languages..."]').count()) === 0 && (await p.getByRole('combobox').count()) === 1 && (await p.locator('select').count()) === 0);
const cb = p.getByRole('combobox');
await cb.click();
check('tap opens the list (aria-expanded, 102 options)', (await cb.getAttribute('aria-expanded')) === 'true' && (await p.locator('[role=option][data-code]').count()) === 102);
await cb.fill('deutsch');
check('search by native name: "deutsch" → German only', (await p.locator('[role=option][data-code]').count()) === 1 && (await p.locator('[role=option][data-code="deu"]').count()) === 1);
await p.keyboard.press('Enter');
await cb.fill('日本');
await p.keyboard.press('Enter');
check('keyboard: Enter adds the active option (French, German, Japanese)', (await p.locator('[data-language-chip]').allInnerTexts()).map((t) => t.replace(/\s*×\s*$/, '')).join('|') === 'French|German|Japanese', (await p.locator('[data-language-chip]').allInnerTexts()).join('|'));
await cb.fill('english');
await p.keyboard.press('Enter');
check('a 4th language is refused with a sentence', (await p.locator('[data-language-chip]').count()) === 3 && /Up to 3 languages/.test(await p.locator('[data-language-notice]').innerText()));
await p.getByRole('button', { name: 'Remove German' }).click();
check('the chip\'s remove button takes it out', (await p.locator('[data-language-chip]').count()) === 2);
await cb.fill('');
await p.keyboard.press('Backspace');
await p.keyboard.press('Backspace');
await p.locator('input[type=file]').first().setInputFiles(PDF);
check('no language → Run OCR disabled with "Choose the language of the document."', (await p.getByRole('button', { name: 'Run OCR' }).isDisabled()) && (await p.getByText('Choose the language of the document.').count()) === 1);
if (iphone) {
  const sizes = await p.evaluate(() => [...document.querySelectorAll('[data-language-combobox] [role=combobox], [data-language-combobox] button')].map((e) => e.getBoundingClientRect().height));
  await p.getByRole('combobox').click();
  const rows = await p.locator('[role=option][data-code]').evaluateAll((els) => els.slice(0, 5).map((e) => e.getBoundingClientRect().height));
  check(`touch targets ≥ 44 px (field ${sizes.map(Math.round).join(',')}; rows ${rows.map(Math.round).join(',')})`, sizes.every((h) => h >= 44) && rows.every((h) => h >= 44));
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`no horizontal overflow at 390 px with the list open (${overflow} px)`, overflow <= 0);
}
await cf.close();
await b.close();
console.log(`\n${tag}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
