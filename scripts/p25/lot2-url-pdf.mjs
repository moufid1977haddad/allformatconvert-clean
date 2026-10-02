// P25 (03/10), lot 2: HTML to PDF from a URL (E4), used as a visitor. Each PDF is downloaded and read back with pdf.js.
// Usage: node scripts/p25/lot2-url-pdf.mjs <origin> [--browser=chromium|firefox|webkit] [--only=a,b]
// Counts against the URL fetcher's limit (20 an hour per visitor): about 6 conversions per engine.
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'node:fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const name = process.argv.find((a) => a.startsWith('--browser='))?.split('=')[1] || 'chromium';
const only = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]?.split(',');
const want = (k) => !only || only.includes(k);
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.route(/vercel\.live/, (r) => r.abort());

async function readPdf(path) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(path)), verbosity: 0 }).promise;
  let text = '';
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) text += (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join(' ') + '\n';
  const p1 = await doc.getPage(1);
  const [, , w, h] = p1.view;
  const ops = await p1.getOperatorList();
  const images = ops.fnArray.filter((f) => f === pdfjs.OPS.paintImageXObject || f === pdfjs.OPS.paintInlineImageXObject).length;
  return { pages: doc.numPages, text, w, h, images };
}
async function convert(url, setup = async () => {}) {
  const p = await ctx.newPage();
  await p.goto(`${origin}/tools/pdf-tools/html-to-pdf`, { waitUntil: 'load' });
  await p.getByRole('button', { name: 'From URL' }).click();
  await p.locator('#url-input').fill(url);
  await setup(p);
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const done = await Promise.race([
    p.locator('[data-download-ready] a[data-download]').first().waitFor({ timeout: 120000 }).then(() => 'ok'),
    p.getByRole('alert').first().waitFor({ timeout: 120000 }).then(() => 'error'),
  ]).catch(() => 'timeout');
  if (done !== 'ok') { const msg = await p.getByRole('alert').first().innerText().catch(() => done); await p.close(); return { error: msg }; }
  const dl = p.waitForEvent('download', { timeout: 30000 });
  await p.locator('[data-download-ready] a[data-download]').first().click();
  const d = await dl;
  const notice = await p.locator('[data-notice]').innerText().catch(() => '');
  const info = await readPdf(await d.path());
  const out = { ...info, name: d.suggestedFilename(), notice };
  await p.close();
  return out;
}

if (want('example')) {
  const r = await convert('example.com');
  check('example.com (typed without https://) → a PDF with its text, named after the site', !r.error && /Example Domain/.test(r.text) && r.name === 'example.com.pdf' && Math.round(r.w) === 595 && Math.round(r.h) === 842, r.error || `${r.pages} p ${Math.round(r.w)}x${Math.round(r.h)} ${r.name}`);
}
if (want('wikipedia')) {
  const r = await convert('https://en.wikipedia.org/wiki/Portable_Document_Format');
  check('Wikipedia article → many pages, its text and its images (fetched by our server, inlined)', !r.error && r.pages >= 8 && /Portable Document Format/.test(r.text) && r.images >= 1, r.error || `${r.pages} pages, ${r.images} images on p1`);
}
if (want('options')) {
  const r = await convert('https://example.com/', async (p) => {
    await p.locator('#ps-size').selectOption('Letter'); await p.locator('#ps-orient').selectOption('landscape');
    await p.locator('#url-single').check();
  });
  check('one long page, Letter landscape width', !r.error && r.pages === 1 && Math.round(r.w) === 792, r.error || `${r.pages} p ${Math.round(r.w)}x${Math.round(r.h)}`);
}
if (want('ssrf')) {
  for (const [url, why] of [['http://127.0.0.1:3100/', 'loopback'], ['http://169.254.169.254/latest/meta-data/', 'metadata'], ['http://10.0.0.1/', 'private'],
    ['https://httpbin.org/redirect-to?url=http%3A%2F%2F127.0.0.1%2F', 'redirect to loopback'], ['http://localtest.me/', 'public name → 127.0.0.1'], ['file:///etc/passwd', 'file scheme'], ['http://example.com:8080/', 'other port']]) {
    const r = await convert(url);
    check(`refused: ${why}`, !!r.error && /private network|Only http|standard web ports|not a web address/i.test(r.error), r.error || 'A PDF WAS MADE');
  }
}
await b.close();
console.log(`${name}: ${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
