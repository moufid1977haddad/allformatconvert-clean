// P24 (03/10), PDF lot: every option added this night, used as a visitor would, each result reopened with pdf.js
// (text and where it really is on the page as displayed) and pdf-lib (page sizes, rotation, boxes, encryption).
// Usage: node scripts/p24/pdf-lot.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar] [--only=a,b]
//        [--server] (also the tools printed by our Chromium service: HTML, Markdown, Text with emoji — preview / www only)
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, StandardFonts, PDFName, PDFArray, PDFRawStream, PDFHeader, degrees, decodePDFRawStream } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--')) || 'http://localhost:3100').origin;
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const name = arg('browser') || 'chromium';
const only = (arg('only') || '').split(',').filter(Boolean);
const server = process.argv.includes('--server');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'p24-pdf-'));
let fails = 0, passes = 0;
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };

// ---- fixtures ------------------------------------------------------------------------------------------------------
async function makePdf(file, pages, { version } = {}) {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  for (const p of pages) {
    const page = d.addPage(p.size || [595, 842]);
    for (const [t, x, y] of p.texts || [[p.text || 'Body text', 72, 700]]) page.drawText(t, { x, y, size: 14, font: f });
    if (p.rotate) page.setRotation(degrees(p.rotate));
    if (p.crop) page.setCropBox(...p.crop);
  }
  if (version) d.context.header = PDFHeader.forVersion(...version);
  fs.writeFileSync(path.join(dir, file), await d.save());
  return path.join(dir, file);
}
const plain5 = await makePdf('five.pdf', [1, 2, 3, 4, 5].map((i) => ({ text: `Body of page ${i}` })));
const mixed = await makePdf('mixed.pdf', [{ text: 'Cover page' }, { text: 'Rotated page', rotate: 90 }, { text: 'Cropped page', crop: [100, 100, 400, 600] }]);
const old13 = await makePdf('old13.pdf', [{ text: 'Old PDF 1.3' }], { version: [1, 3] });
const v20 = await makePdf('v20.pdf', [{ text: 'PDF 2.0 file' }], { version: [2, 0] });
const contact = await makePdf('contact.pdf', [{ texts: [['Write to jane.doe', 72, 700], ['@example.com today', 177, 700], ['Call +1 514 555 0199 now', 72, 650], ['Keep this line', 72, 600]] }, { text: 'Nothing to hide here' }]);

// ---- reading results -----------------------------------------------------------------------------------------------
async function textItems(bytes, password) {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(bytes), password, isEvalSupported: false, useSystemFonts: false }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const p = await doc.getPage(i); const vp = p.getViewport({ scale: 1 });
    const tc = await p.getTextContent();
    pages.push({ w: vp.width, h: vp.height, items: tc.items.filter((it) => it.str.trim()).map((it) => {
      const m = pdfjs.Util.transform(vp.transform, it.transform); // in viewport space (as displayed, y down)
      return { str: it.str, x: m[4], y: m[5], dirX: m[0], dirY: m[1] };
    }) });
  }
  return pages;
}
const textOf = (page) => page.items.map((i) => i.str).join(' ');

// ---- browser -------------------------------------------------------------------------------------------------------
const b = await { chromium, firefox, webkit }[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
await ctx.addCookies([{ name: 'oct_automation', value: '1', url: origin }]);
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route(/vercel\.live/, (r) => r.abort());
async function open(slug) { const p = await ctx.newPage(); await p.goto(`${origin}/tools/pdf-tools/${slug}`, { waitUntil: 'load' }); await p.waitForTimeout(800); return p; }
async function result(p, timeout = 60000) {
  const r = await Promise.race([
    p.locator('[data-file-download] [data-download]').first().waitFor({ timeout }).then(() => 'ok'),
    p.locator('main [role=alert]').filter({ hasText: /./ }).first().waitFor({ timeout }).then(() => 'alert'),
  ]).catch(() => 'timeout');
  if (r !== 'ok') return { alert: r === 'alert' ? await p.locator('main [role=alert]').filter({ hasText: /./ }).first().innerText() : 'no result' };
  const b64 = await p.locator('[data-file-download] [data-download]').first().evaluate(async (a) => {
    const staged = /\/zipdl\/f\//.test(a.getAttribute('href') || '');
    const res = staged ? await (await caches.open('ocv-downloads-v1')).match(a.href) : await fetch(a.href);
    const u = new Uint8Array(await res.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s);
  });
  return { bytes: Buffer.from(b64, 'base64') };
}
const want = (k) => !only.length || only.includes(k);

if (want('number-pages')) {
  const p = await open('pdf-number-pages');
  await p.locator('input[type=file]').first().setInputFiles(mixed);
  await p.locator('#pn-format').selectOption('Page {n} of {p}');
  await p.locator('#pn-first').fill('5');
  await p.locator('#pn-skip').check();
  await p.getByRole('button', { name: 'Add Page Numbers' }).click();
  const r = await result(p);
  if (!r.bytes) check('number-pages: result', false, r.alert); else {
    const pages = await textItems(r.bytes);
    check('number-pages: cover skipped', !/Page \d of/.test(textOf(pages[0])), textOf(pages[0]));
    for (const [i, want] of [[1, 'Page 5 of 6'], [2, 'Page 6 of 6']]) {
      const it = pages[i].items.find((x) => x.str === want);
      // upright as displayed (direction along +x), near the bottom centre of the page as displayed
      const ok = it && it.dirX > 0 && Math.abs(it.dirY) < 1e-6 && Math.abs(it.x + 40 - pages[i].w / 2) < pages[i].w * 0.15 && it.y > pages[i].h * 0.85 && it.y <= pages[i].h;
      check(`number-pages: "${want}" upright at the bottom centre of page ${i + 1} (${i === 1 ? 'rotated 90°' : 'CropBox offset'})`, !!ok, it ? `x=${it.x.toFixed(0)} y=${it.y.toFixed(0)} of ${pages[i].w.toFixed(0)}×${pages[i].h.toFixed(0)} dir=${it.dirX.toFixed(2)},${it.dirY.toFixed(2)}` : textOf(pages[i]));
    }
  }
  await p.locator('#pn-format').selectOption('custom');
  await p.locator('#pn-custom').fill('no number here');
  await p.getByRole('button', { name: 'Add Page Numbers' }).click();
  const r2 = await result(p, 15000);
  check('number-pages: a custom text without {n} is refused with a sentence', /must contain \{n\}/.test(r2.alert || ''), r2.alert);
  // review 03/10: Cyrillic was dropped without a word — now drawn as an image
  await p.locator('#pn-custom').fill('Страница {n}');
  await p.locator('#pn-skip').uncheck();
  await p.getByRole('button', { name: 'Add Page Numbers' }).click();
  await p.waitForTimeout(300);
  const r3 = await result(p);
  if (!r3.bytes) check('number-pages: Cyrillic', false, r3.alert); else {
    const d = await PDFDocument.load(r3.bytes); let images = 0;
    d.context.enumerateIndirectObjects().forEach(([, o]) => { if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image') && o.dict.get(PDFName.of('SMask'))) images++; }); // the picture, not its transparency mask
    check('number-pages: a Cyrillic text is drawn (one image per page), not dropped', images === 3, `images ${images}`);
  }
  await p.close();
}

if (want('watermark')) {
  const p = await open('pdf-watermark');
  await p.locator('input[type=file]').first().setInputFiles(plain5);
  await p.locator('#wm-text').fill('DRAFT');
  await p.locator('#wm-rotation').selectOption('0');
  await p.locator('#wm-to').fill('2');
  await p.getByRole('button', { name: 'Add Watermark' }).click();
  let r = await result(p);
  if (!r.bytes) check('watermark: result', false, r.alert); else {
    const pages = await textItems(r.bytes);
    const it = pages[0].items.find((x) => x.str === 'DRAFT');
    // centred: the text's middle (half its width, ~0.35 × font size high) at the page centre
    check('watermark: "DRAFT" centred on page 1', !!it && Math.abs(it.y - pages[0].h / 2) < 40 && it.x < pages[0].w / 2 && it.x > pages[0].w * 0.2, it ? `x=${it.x.toFixed(0)} y=${it.y.toFixed(0)}` : textOf(pages[0]));
    check('watermark: only pages 1-2', textOf(pages[1]).includes('DRAFT') && !textOf(pages[2]).includes('DRAFT'));
  }
  // Chinese text (not in Helvetica): drawn as an image, no error
  await p.locator('#wm-text').fill('機密文件');
  await p.locator('#wm-mosaic').check();
  await p.locator('#wm-layer').selectOption('below');
  await p.getByRole('button', { name: 'Add Watermark' }).click();
  await p.waitForTimeout(500);
  r = await result(p);
  if (!r.bytes) check('watermark: Chinese text', false, r.alert); else {
    const d = await PDFDocument.load(r.bytes);
    const pg = d.getPage(0);
    const contents = pg.node.Contents();
    const first = contents instanceof PDFArray ? d.context.lookup(contents.get(0)) : null;
    const ops = first ? Buffer.from(first instanceof PDFRawStream ? decodePDFRawStream(first).decode() : first.getContents()).toString('latin1') : '';
    let images = 0; d.context.enumerateIndirectObjects().forEach(([, o]) => { if (o instanceof PDFRawStream && o.dict.get(PDFName.of('Subtype')) === PDFName.of('Image')) images++; });
    const doCount = (ops.match(/ Do\b/g) || []).length;
    check('watermark: Chinese text drawn as an image, in a mosaic, below the content (first content stream)', images >= 1 && doCount >= 4, `images ${images}, Do in first stream ${doCount}`); // mosaic: at least 4 copies on an A4 page
  }
  await p.close();
}

if (want('rotate')) {
  const p = await open('pdf-rotate');
  await p.locator('input[type=file]').first().setInputFiles(mixed);
  await p.getByRole('button', { name: '90° clockwise' }).click();
  await p.locator('#rot-pages').fill(' 2 - 2 ');
  await p.getByRole('button', { name: 'Rotate PDF' }).click();
  const r = await result(p);
  if (!r.bytes) check('rotate: result', false, r.alert); else {
    const d = await PDFDocument.load(r.bytes);
    const a = d.getPages().map((pg) => pg.getRotation().angle);
    check('rotate: page 2 (already 90°) → 180°, pages 1 and 3 unchanged', a[0] === 0 && a[1] === 180 && a[2] === 0, a.join(','));
  }
  await p.locator('#rot-pages').fill('9');
  await p.getByRole('button', { name: 'Rotate PDF' }).click();
  const r2 = await result(p, 15000);
  check('rotate: a page past the end is said', /page 9 does not exist/.test(r2.alert || ''), r2.alert);
  await p.close();
}

if (want('delete-pages')) {
  const p = await open('pdf-delete-pages');
  await p.locator('input[type=file]').first().setInputFiles(plain5);
  await p.waitForTimeout(800);
  await p.getByPlaceholder('1, 3, 5-7').fill('2-3');
  await p.getByRole('button', { name: 'Delete Pages' }).click();
  const r = await result(p);
  if (!r.bytes) check('delete-pages: result', false, r.alert); else {
    const pages = await textItems(r.bytes);
    check('delete-pages: "2-3" removes pages 2 AND 3', pages.length === 3 && /page 1/.test(textOf(pages[0])) && /page 4/.test(textOf(pages[1])) && /page 5/.test(textOf(pages[2])), pages.map(textOf).join(' | '));
  }
  await p.getByPlaceholder('1, 3, 5-7').fill('1-5');
  await p.getByRole('button', { name: 'Delete Pages' }).click();
  const r2 = await result(p, 15000);
  check('delete-pages: deleting every page is refused', /at least one page must stay/.test(r2.alert || ''), r2.alert);
  await p.getByPlaceholder('1, 3, 5-7').fill('two');
  await p.getByRole('button', { name: 'Delete Pages' }).click();
  const r3 = await result(p, 15000);
  check('delete-pages: a word is said, not ignored', /not a page or a range/.test(r3.alert || ''), r3.alert);
  await p.close();
}

if (want('crop')) {
  const p = await open('pdf-crop');
  await p.locator('input[type=file]').first().setInputFiles(plain5);
  await p.locator('input[aria-label="margin (pt)"]').first().fill('50');
  await p.locator('#crop-pages').fill('1');
  await p.getByRole('button', { name: 'Crop PDF' }).click();
  const r = await result(p);
  if (!r.bytes) check('crop: result', false, r.alert); else {
    const d = await PDFDocument.load(r.bytes);
    const h = d.getPages().map((pg) => Math.round(pg.getCropBox().height));
    check('crop: page 1 cropped (842 → 792 pt high), page 2 untouched', h[0] === 792 && h[1] === 842, h.join(','));
  }
  await p.close();
}

if (want('protect')) {
  const p = await open('pdf-protect');
  await p.locator('input[type=file]').first().setInputFiles(old13);
  await p.locator('input[type=password]').first().fill('open-Secret-1');
  await p.getByRole('button', { name: 'Protect PDF' }).click();
  const r = await result(p);
  if (!r.bytes) check('protect: result', false, r.alert); else {
    const raw = r.bytes.toString('latin1');
    check('protect: a PDF 1.3 is encrypted with AES-128 (V 4, AESV2), not RC4-40', /\/V 4/.test(raw) && /AESV2/.test(raw), raw.slice(0, 9));
    let needs = false; try { await textItems(r.bytes); } catch (e) { needs = /password/i.test(e.name + e.message); }
    const opened = await textItems(r.bytes, 'open-Secret-1').then((pg) => textOf(pg[0])).catch((e) => 'ERR ' + e.message);
    check('protect: needs the password, opens with it', needs && /Old PDF 1.3/.test(opened), opened);
  }
  // review 03/10: a PDF 2.0 fell to RC4 40-bit
  await p.locator('input[type=file]').first().setInputFiles(v20);
  await p.getByRole('button', { name: 'Protect PDF' }).click();
  await p.waitForTimeout(300);
  const rv = await result(p);
  check('protect: a PDF 2.0 is encrypted with AES-128 too', !!rv.bytes && /\/V 4/.test(rv.bytes.toString('latin1')) && /AESV2/.test(rv.bytes.toString('latin1')), rv.alert || '');
  await p.locator('summary').click();
  await p.locator('#pp-owner').fill('open-Secret-1');
  await p.getByRole('button', { name: 'Protect PDF' }).click();
  const r2 = await result(p, 15000);
  check('protect: permissions password = open password is refused', /must be different/.test(r2.alert || ''), r2.alert);
  await p.close();
}

if (want('organize')) {
  const p = await open('pdf-organize');
  await p.locator('input[type=file]').first().setInputFiles(plain5);
  await p.getByRole('button', { name: 'Blank after' }).first().click();
  await p.getByRole('button', { name: /^Rotate position 3 / }).click();
  await p.getByRole('button', { name: 'Duplicate' }).nth(5).click();
  await p.getByRole('button', { name: 'Apply Changes' }).click();
  const r = await result(p);
  if (!r.bytes) check('organize: result', false, r.alert); else {
    const pages = await textItems(r.bytes);
    const d = await PDFDocument.load(r.bytes);
    const rot = d.getPages().map((pg) => pg.getRotation().angle);
    const t = pages.map(textOf);
    check('organize: blank page after page 1, page 2 turned 90°, page 5 duplicated', pages.length === 7 && t[1] === '' && /page 2/.test(t[2]) && rot[2] === 90 && /page 5/.test(t[5]) && /page 5/.test(t[6]), `${t.join(' | ')} rot=${rot.join(',')}`);
  }
  await p.close();
}

if (want('redact')) {
  const p = await open('pdf-redact');
  await p.locator('input[type=file]').first().setInputFiles(contact);
  await p.locator('#rd-terms').fill('Keep this');
  await p.getByLabel('E-mail addresses').check();
  await p.getByLabel('Phone numbers').check();
  await p.getByRole('button', { name: 'Redact PDF' }).click();
  const r = await result(p, 90000);
  if (!r.bytes) check('redact: result', false, r.alert); else {
    const pages = await textItems(r.bytes);
    const t0 = textOf(pages[0]), t1 = textOf(pages[1]);
    // page 1 flattened (no text left at all), page 2 untouched (its text still there)
    check('redact: page with an e-mail split over two items, a phone and a term → flattened, nothing extractable', t0 === '' && /Nothing to hide/.test(t1), `p1="${t0}" p2="${t1}"`);
    const summary = await p.locator('[data-summary]').innerText().catch(() => '');
    check('redact: 3 occurrences counted (term, e-mail, phone)', /\b3\b/.test(summary), summary);
  }
  await p.close();
}

if (want('text-to-pdf')) {
  const p = await open('text-to-pdf');
  await p.getByRole('button', { name: 'Upload File' }).click();
  const ansi = path.join(dir, 'ansi.txt'); fs.writeFileSync(ansi, Buffer.from('Café crème à la française\r\nLigne deux\r\n', 'latin1'));
  await p.locator('input[type=file]').first().setInputFiles(ansi);
  await p.locator('#tp-page').selectOption('Letter');
  await p.locator('#tp-orient').selectOption('landscape');
  await p.locator('#tp-size').selectOption('18');
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const r = await result(p);
  if (!r.bytes) check('text-to-pdf: result', false, r.alert); else {
    const d = await PDFDocument.load(r.bytes); const { width, height } = d.getPage(0).getSize();
    const t = textOf((await textItems(r.bytes))[0]);
    check('text-to-pdf: Letter landscape (792 × 612 pt)', Math.round(width) === 792 && Math.round(height) === 612, `${width}×${height}`);
    check('text-to-pdf: a Windows (ANSI) .txt read in its encoding — "Café crème à la française"', /Café crème à la française/.test(t), t.slice(0, 60));
  }
  if (server) {
    await p.getByRole('button', { name: 'Paste Text' }).click();
    await p.locator('textarea').first().fill('Emoji 😀 and text');
    await p.locator('#tp-page').selectOption('A5');
    await p.locator('#tp-orient').selectOption('portrait');
    await p.getByRole('button', { name: 'Convert to PDF' }).click();
    const r2 = await result(p, 120000);
    if (!r2.bytes) check('text-to-pdf (our Chromium): result', false, r2.alert); else {
      const d = await PDFDocument.load(r2.bytes); const { width, height } = d.getPage(0).getSize();
      check('text-to-pdf (our Chromium, emoji): A5 portrait (420 × 595 pt)', Math.abs(width - 420) < 2 && Math.abs(height - 595) < 2, `${width.toFixed(1)}×${height.toFixed(1)}`);
    }
  }
  await p.close();
}

if (server && want('html-to-pdf')) {
  const p = await open('html-to-pdf');
  const html = path.join(dir, 'page.html'); fs.writeFileSync(html, '<!doctype html><html><head><meta charset="utf-8"><title>t</title></head><body><p>Hello landscape A5</p></body></html>');
  await p.locator('input[type=file]').first().setInputFiles(html);
  await p.locator('#ps-size').selectOption('A5');
  await p.locator('#ps-orient').selectOption('landscape');
  await p.locator('#ps-margin').selectOption('30mm');
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const r = await result(p, 120000);
  if (!r.bytes) check('html-to-pdf: result', false, r.alert); else {
    const d = await PDFDocument.load(r.bytes); const { width, height } = d.getPage(0).getSize();
    const it = (await textItems(r.bytes))[0].items.find((x) => /Hello/.test(x.str));
    check('html-to-pdf: A5 landscape (595 × 420 pt)', Math.abs(width - 595) < 2 && Math.abs(height - 420) < 2, `${width.toFixed(1)}×${height.toFixed(1)}`);
    check('html-to-pdf: 30 mm margins (text starts ~85 pt from the left)', !!it && Math.abs(it.x - 85) < 10, it ? `x=${it.x.toFixed(1)}` : 'no text');
  }
  await p.close();
}
if (server && want('markdown-to-pdf')) {
  const p = await open('markdown-to-pdf');
  const md = path.join(dir, 'doc.md'); fs.writeFileSync(md, '# Title\n\nSome *text*.\n');
  await p.locator('input[type=file]').first().setInputFiles(md);
  await p.locator('#ps-size').selectOption('Letter');
  await p.getByRole('button', { name: 'Convert to PDF' }).click();
  const r = await result(p, 120000);
  if (!r.bytes) check('markdown-to-pdf: result', false, r.alert); else {
    const d = await PDFDocument.load(r.bytes); const { width, height } = d.getPage(0).getSize();
    check('markdown-to-pdf: Letter (612 × 792 pt)', Math.abs(width - 612) < 2 && Math.abs(height - 792) < 2, `${width.toFixed(1)}×${height.toFixed(1)}`);
  }
  await p.close();
}

await b.close();
console.log(fails ? `${fails} FAIL, ${passes} pass (${name})` : `ALL PASS: ${passes} checks (${name})`);
process.exit(fails ? 1 : 0);
