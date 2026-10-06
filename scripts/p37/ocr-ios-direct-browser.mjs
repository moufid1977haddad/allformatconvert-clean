// P37 (06/10, lot 2 point 1) — PDF OCR in a browser: on iPhone / iPad the pages go straight to our OCR service; on a
// computer the device still reads them and nothing is sent.
// /api/pdf-ocr is ALWAYS intercepted (route.fulfill with a fake success): the real service is never called. The fixture
// PDF (2 pages of text) is made here with pdf-lib.
//   node scripts/p37/ocr-ios-direct-browser.mjs <origin>            e.g. http://localhost:3000 (a local `next start`)
//   [--only=iphone|ipad|desktop]
// Scenarios:
//   iphone  — WebKit, Playwright's "iPhone 13" device: notice shown before "Run OCR", first /api/pdf-ocr request well
//             under 20 s after the click (limit here 5 s), one request per page, no OCR engine requested or started.
//   ipad    — WebKit, iPadOS desktop user agent ("Macintosh") with 5 touch points: same as iphone.
//   desktop — Chromium, default desktop: no notice, the OCR engine (tesseract.js from cdn.jsdelivr.net) is requested,
//             and no request at all to /api/pdf-ocr during the whole run (this one downloads the engine and the
//             English data from the CDN, as a visitor would).
import { chromium, webkit, devices } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const originArg = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!originArg) { console.error('usage: node scripts/p37/ocr-ios-direct-browser.mjs <origin> [--only=iphone|ipad|desktop]'); process.exit(2); }
const origin = new URL(originArg).origin;
const only = arg('only');
const FIRST_CALL_MAX_MS = 5000;

let fails = 0, passes = 0;
const check = (tag, n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `[${tag}] ${n}`, ok ? '' : `— ${info}`); };

// fixture: 2 pages with plain text
const OUT = path.join(os.tmpdir(), 'p37-ocr-ios-direct');
fs.mkdirSync(OUT, { recursive: true });
const PDF = path.join(OUT, 'two-pages.pdf');
{
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const n of [1, 2]) doc.addPage([612, 792]).drawText(`P37 fixture page ${n}`, { x: 72, y: 700, size: 28, font });
  fs.writeFileSync(PDF, await doc.save());
}
// the fake answer of our service: some text and a valid one-page PDF as the text layer
const layerB64 = Buffer.from(await (async () => { const d = await PDFDocument.create(); d.addPage([612, 792]); return d.save(); })()).toString('base64');

const ENGINE = /tesseract|tessdata|traineddata/i;

async function scenario(tag, browserType, contextOptions, { ios, touchPoints = null }) {
  const b = await browserType.launch();
  const ctx = await b.newContext({ ...contextOptions, acceptDownloads: true });
  if (touchPoints !== null) await ctx.addInitScript((n) => { Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => n, configurable: true }); }, touchPoints);
  const ocrCalls = [];
  const engineRequests = [];
  const otherWorkers = [];
  let clickAt = 0;
  // our OCR service: never reached, a fake success instead
  await ctx.route('**/api/pdf-ocr', async (route) => {
    const body = route.request().postData() || '';
    const page = Number((/name="page"\r\n\r\n(\d+)/.exec(body) || [])[1] || 0);
    ocrCalls.push({ page, at: Date.now() - clickAt });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, text: `Fake text of page ${page}\n`, pdf: layerB64, dpi: 300, reduced: false }) });
  });
  // the staged upload is not expected for a small PDF; refused so it can never reach a real service
  await ctx.route('**/api/media/ticket', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"error":"blocked by test"}' }));
  ctx.on('request', (r) => { if (ENGINE.test(r.url())) engineRequests.push(r.url()); });
  const p = await ctx.newPage();
  p.on('worker', (w) => { if (!/pdf\.worker/i.test(w.url())) otherWorkers.push(w.url().slice(0, 80)); });
  await p.goto(`${origin}/tools/pdf-tools/pdf-ocr`, { waitUntil: 'load' });
  await p.waitForTimeout(800);

  const note = p.locator('[data-server-render-note]');
  const noteBeforeFile = await note.isVisible().catch(() => false);
  await p.locator('input[type=file]').first().setInputFiles(PDF);
  const noteText = await note.innerText().catch(() => '');
  const noteBeforeClick = await note.isVisible().catch(() => false);
  if (ios) {
    check(tag, 'notice visible before a file is chosen', noteBeforeFile);
    check(tag, `notice visible before "Run OCR", says the PDF is sent: "${noteText}"`, noteBeforeClick && /our own OCR service/.test(noteText) && /sent there, then deleted/.test(noteText), noteText);
  } else {
    check(tag, 'no iPhone / iPad notice on a computer', !noteBeforeFile && !noteBeforeClick, noteText);
  }
  check(tag, 'no request to /api/pdf-ocr before "Run OCR"', ocrCalls.length === 0, JSON.stringify(ocrCalls));

  clickAt = Date.now();
  await p.getByRole('button', { name: 'Run OCR' }).click();
  if (!ios) {
    // the local path is tried: the OCR engine is requested
    await p.waitForFunction(() => /Preparing the OCR engine|Downloading|Recognizing text|Drawing the page/.test(document.body.innerText), null, { timeout: 30000 }).catch(() => {});
  }
  await p.waitForFunction(() => !!document.querySelector('p[role=alert]') || !!document.querySelector('textarea[aria-label="Recognized Text"]'), null, { timeout: ios ? 30000 : 180000 }).catch(() => {});
  await p.waitForTimeout(300);
  const text = await p.locator('textarea[aria-label="Recognized Text"]').inputValue().catch(() => '');
  const alert = await p.locator('p[role=alert]').innerText().catch(() => '');
  const after = await p.locator('[data-ocr-server-note]').innerText().catch(() => '');

  if (ios) {
    const first = ocrCalls[0]?.at;
    check(tag, `first /api/pdf-ocr request ${first} ms after the click (< ${FIRST_CALL_MAX_MS} ms, far from the old 20 s)`, typeof first === 'number' && first < FIRST_CALL_MAX_MS, JSON.stringify(ocrCalls));
    check(tag, `one request per page (${ocrCalls.map((c) => c.page).join(',')})`, ocrCalls.map((c) => c.page).join(',') === '1,2');
    check(tag, `OCR engine never requested (${engineRequests.length})`, engineRequests.length === 0, engineRequests.slice(0, 3).join(' '));
    check(tag, `no OCR worker started (${otherWorkers.length})`, otherWorkers.length === 0, otherWorkers.join(' '));
    check(tag, 'recognized text = the service\'s, no error', /Fake text of page 1/.test(text) && /Fake text of page 2/.test(text) && !alert, `${text.slice(0, 120)} | ${alert}`);
    check(tag, `notice after: "${after}"`, /Our own OCR service recognized pages 1 and 2: your PDF was sent there, then deleted\./.test(after), after);
  } else {
    check(tag, `OCR engine requested on the device (${engineRequests.length} requests)`, engineRequests.length > 0);
    check(tag, `no request to /api/pdf-ocr during the whole run (${ocrCalls.length})`, ocrCalls.length === 0, JSON.stringify(ocrCalls));
    check(tag, `run ended with the device's own result: ${alert ? `alert "${alert.slice(0, 100)}"` : `text "${text.slice(0, 60).replace(/\n/g, ' ')}"`}`, /P37/i.test(text) && !after, `${text.slice(0, 120)} | ${alert} | ${after}`);
  }
  await b.close();
}

if (!only || only === 'iphone') await scenario('iphone', webkit, { ...devices['iPhone 13'] }, { ios: true });
if (!only || only === 'ipad') {
  await scenario('ipad', webkit, {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
    viewport: { width: 820, height: 1180 }, hasTouch: true,
  }, { ios: true, touchPoints: 5 });
}
if (!only || only === 'desktop') await scenario('desktop', chromium, { viewport: { width: 1280, height: 900 } }, { ios: false });

console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
