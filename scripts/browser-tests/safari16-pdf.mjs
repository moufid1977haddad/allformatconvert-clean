// P18 step 2 — the PDF.js tools under the Safari 16.4 / iOS 16.4 simulation (lib/safari16-sim.mjs: Promise.try,
// Promise.withResolvers, Set methods, iterator helpers, Uint8Array base64, URL.parse… removed in the page AND in every
// Worker). On 30/09 the real Safari 17.6 left 9 PDF tools on "Converting…" / "Reading PDF…" with "Promise.try is not
// a function". Each tool is run to its real output (a file offered for download, or the text on screen), and the
// PDF.js worker must have gone through the simulation. The two AI tools are stopped at their server call (no cost):
// the text PDF.js extracted must be in the request.
// Usage: node scripts/browser-tests/safari16-pdf.mjs <origin> [--browser=webkit|chromium|firefox] [--no-sim] [--only=a,b]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { applySafari16Sim } from './lib/safari16-sim.mjs';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=webkit').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean);
const sim = !process.argv.includes('--no-sim');
let fails = 0;
const check = (n, ok, info = '') => { if (!ok) fails++; console.log(ok ? 'PASS' : 'FAIL', `${name}${sim ? ' [Safari 16.4 sim]' : ''} ${n}`, ok ? '' : info); };

async function textPdf(lines, file) {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  for (const pageLines of lines) {
    const p = d.addPage([595, 842]);
    pageLines.forEach((t, i) => p.drawText(t, { x: 60, y: 760 - i * 40, size: 24, font: f }));
  }
  fs.writeFileSync(file, await d.save());
  return file;
}
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'safari16-pdf-'));
const A = await textPdf([['Alpha line', 'Beta line', 'Secret Name here'], ['Second page text']], path.join(dir, 'a.pdf'));
const B = await textPdf([['Alpha line', 'Beta CHANGED', 'Secret Name here'], ['Second page text']], path.join(dir, 'b.pdf'));

const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
const rewritten = sim ? await applySafari16Sim(ctx) : [];
const aiBodies = [];
await ctx.route(/\/api\/ai(\?|$|\/)/, async (r) => { aiBodies.push(r.request().postData() || ''); await r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Test stop: no AI call from the bench.' }) }); });

async function open(slug) {
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(1200);
  return { p, errors };
}
// The first file offered for download: its bytes, read in the page.
async function offered(p, re, timeout = 60000) {
  // P33: since P31 the row's link gets its (retyped) address a moment after the row appears: wait for it, or the
  // fetch below read the page itself
  await p.waitForFunction((src) => [...document.querySelectorAll('[data-file-download]')].some((el) => new RegExp(src).test(el.dataset.name || '') && el.querySelector('a[data-download][href]')), re.source, { timeout });
  const [nm, bytes] = await p.evaluate(async (src) => {
    const row = [...document.querySelectorAll('[data-file-download]')].find((el) => new RegExp(src).test(el.dataset.name || ''));
    const buf = await (await fetch(row.querySelector('a[data-download]').href)).arrayBuffer();
    return [row.dataset.name, Array.from(new Uint8Array(buf))];
  }, re.source);
  return { name: nm, bytes: Buffer.from(bytes) };
}
const T = async (slug, fn) => {
  if (only.length && !only.includes(slug)) return;
  const { p, errors } = await open(slug);
  try { await fn(p); } catch (e) { check(`${slug}: runs to its result`, false, String(e.message).split('\n')[0].slice(0, 220)); }
  const pdfjsErrors = errors.filter((e) => /Promise\.try|withResolvers|is not a function|undefined is not/.test(e));
  check(`${slug}: no "not a function" error`, pdfjsErrors.length === 0, pdfjsErrors.join(' | '));
  await p.close();
};
const pickPdf = (p, file, nth = 0) => p.locator('input[type=file][accept*="pdf"]').nth(nth).setInputFiles(file);

await T('pdf-compare', async (p) => {
  await pickPdf(p, A, 0); await pickPdf(p, B, 1);
  await p.getByRole('button', { name: 'Compare PDFs' }).click();
  await p.getByText('only in a.pdf').first().waitFor({ timeout: 60000 });
  const t = await p.locator('main').innerText();
  check('pdf-compare: the changed line is found', t.includes('Beta line') && t.includes('Beta CHANGED'), t.slice(0, 200));
});
await T('pdf-extract-text', async (p) => {
  await pickPdf(p, A);
  await p.getByRole('button', { name: 'Extract Text' }).click();
  const f = await offered(p, /\.txt$/);
  check('pdf-extract-text: a .txt file with the PDF text', f.bytes.toString('utf8').includes('Secret Name here'), f.bytes.toString('utf8').slice(0, 100));
});
await T('pdf-to-html', async (p) => {
  await pickPdf(p, A);
  await p.getByRole('button', { name: 'Convert to HTML' }).click();
  const f = await offered(p, /\.html$/);
  check('pdf-to-html: an .html file with the PDF text', f.bytes.toString('utf8').includes('Beta line'));
});
for (const [slug, btn, re, magic] of [['pdf-to-image', 'Convert pages', /\.png$/, [0x89, 0x50]], ['pdf-to-jpg', 'Convert pages', /\.jpe?g$/, [0xff, 0xd8]]]) {
  await T(slug, async (p) => {
    await pickPdf(p, A);
    await p.getByRole('button', { name: btn }).click();
    const f = await offered(p, re);
    check(`${slug}: page image produced (${f.name}, ${f.bytes.length} bytes)`, f.bytes[0] === magic[0] && f.bytes[1] === magic[1] && f.bytes.length > 2000);
    check(`${slug}: 2 pages -> "Download all (2 files, ZIP)"`, await p.locator('[data-download-all]').isVisible());
  });
}
await T('pdf-organize', async (p) => {
  await pickPdf(p, A);
  await p.getByRole('button', { name: 'Apply Changes' }).waitFor({ timeout: 60000 });
  await p.waitForFunction(() => !document.querySelector('button:disabled') || [...document.querySelectorAll('button')].some((b) => b.textContent.includes('Apply Changes') && !b.disabled), null, { timeout: 60000 });
  await p.getByRole('button', { name: 'Apply Changes' }).click();
  const f = await offered(p, /\.pdf$/);
  const d = await PDFDocument.load(f.bytes);
  check('pdf-organize: a 2-page PDF out', d.getPageCount() === 2, String(d.getPageCount()));
});
await T('pdf-redact', async (p) => {
  await pickPdf(p, A);
  await p.getByPlaceholder('Enter text to censor...').fill('Secret Name');
  await p.getByRole('button', { name: 'Redact PDF' }).click();
  const f = await offered(p, /\.pdf$/);
  check('pdf-redact: a PDF out', f.bytes.subarray(0, 4).toString() === '%PDF', f.name);
});
await T('pdf-editor', async (p) => {
  await pickPdf(p, A);
  await p.getByRole('button', { name: 'Save Changes' }).waitFor({ timeout: 60000 });
  const reading = await p.getByText('Reading PDF…').count();
  check('pdf-editor: pages shown (not stuck on "Reading PDF…")', reading === 0);
  await p.getByRole('button', { name: 'Save Changes' }).click();
  const f = await offered(p, /\.pdf$/);
  const d = await PDFDocument.load(f.bytes);
  check('pdf-editor: the saved PDF has its 2 pages', d.getPageCount() === 2, String(d.getPageCount()));
});
await T('pdf-sign', async (p) => {
  await pickPdf(p, A);
  await p.waitForFunction(() => [...document.querySelectorAll('canvas, img')].some((c) => (c.width || c.naturalWidth) > 200), null, { timeout: 60000 });
  check('pdf-sign: the page preview is drawn by PDF.js', true);
});
await T('pdf-ocr', async (p) => {
  await pickPdf(p, A);
  await p.getByRole('button', { name: 'Run OCR' }).click();
  const f = await offered(p, /\.pdf$/, 180000);
  const t = (await p.locator('main').innerText()) + ' ' + (await p.evaluate(() => [...document.querySelectorAll('textarea')].map((x) => x.value).join(' ')));
  check('pdf-ocr: text recognised and a searchable PDF offered', /Beta\s+line/i.test(t) && f.bytes.subarray(0, 4).toString() === '%PDF', t.slice(0, 120));
});
for (const [slug, btn] of [['pdf-ai-summary', 'Summarize PDF'], ['pdf-translate', 'Translate PDF']]) {
  await T(slug, async (p) => {
    const before = aiBodies.length;
    await pickPdf(p, A);
    await p.getByRole('button', { name: btn }).click();
    await p.waitForFunction((n) => window.performance.getEntriesByType('resource').some((e) => /\/api\/ai/.test(e.name)) || n < 0, before, { timeout: 60000 }).catch(() => {});
    await p.waitForTimeout(1500);
    const sent = aiBodies.slice(before).join(' ');
    check(`${slug}: the text read by PDF.js reaches the AI request (stopped by the bench)`, sent.includes('Beta line'), sent.slice(0, 120) || 'no request');
  });
}

if (sim) check('the PDF.js worker itself ran under the simulation', rewritten.some((u) => /pdf\.worker/.test(u)), rewritten.filter((u) => /worker/.test(u)).join(' ') || 'no worker script rewritten');
await b.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} FAIL (${name})` : `ALL PASS (${name}${sim ? ', Safari 16.4 simulation' : ''})`);
process.exit(fails ? 1 : 0);
