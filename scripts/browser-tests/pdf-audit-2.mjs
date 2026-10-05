// PDF tools, audit of 29/09 (second pass): each check states the CORRECT behaviour; run against the build before the
// fixes it shows the defects, after them it must pass. Input PDFs are built here with pdf-lib; outputs are read here
// with pdf.js (text left in the file), pdf-lib (structure) and, for flattened pages, the pixels of the page image.
// Usage: node scripts/browser-tests/pdf-audit-2.mjs <origin> [--browser=chromium|firefox|webkit] [--no-vercel-toolbar]
import { chromium, firefox, webkit } from '@playwright/test';
import { PDFDocument, StandardFonts, PDFName, PDFRawStream, PDFArray, PDFHexString, degrees } from 'pdf-lib';
import zlib from 'node:zlib';
import UPNGenc from 'upng-js';

const origin = new URL(process.argv.slice(2).find((a) => !a.startsWith('--'))).origin;
const name = (process.argv.find((a) => a.startsWith('--browser=')) || '--browser=chromium').slice(10);
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7);
const b = await ({ chromium, firefox, webkit })[name].launch();
const ctx = await b.newContext({ acceptDownloads: true });
if (process.argv.includes('--no-vercel-toolbar')) await ctx.route((u) => u.hostname === 'vercel.live', (r) => r.abort());
let fails = 0, passes = 0;
const errors = [];
const check = (n, ok, info = '') => { if (ok) passes++; else fails++; console.log(ok ? 'PASS' : 'FAIL', `${name} ${n}`, info); };
let page;
const open = async (p) => { page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`${p}: ${e.message}`)); await page.goto(origin + p, { waitUntil: 'networkidle' }); };
const T = async (n, fn) => { if (only && !n.startsWith(only)) return; try { await fn(); } catch (e) { fails++; console.log('FAIL', `${name} ${n}`, String(e.message).split('\n')[0].slice(0, 200)); } finally { if (page) await page.close().catch(() => {}); page = null; } };
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const pageTexts = async (bytes) => { const d = await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise; const out = []; for (let i = 1; i <= d.numPages; i++) out.push((await (await d.getPage(i)).getTextContent()).items.map((t) => t.str).join(' ')); return out; };
// P34: the link gets its (retyped) address a moment after it appears (P31): wait for the href, else fetch(null) read the page
const linkBytes = async (sel, timeout = 60000) => { const href = await page.locator(`${sel}[href]`).first().getAttribute('href', { timeout }); return Buffer.from(await page.evaluate(async (u) => Array.from(new Uint8Array(await (await fetch(u)).arrayBuffer())), href)); };
// Every object of the file as text, streams decompressed (content streams, form appearances, values...).
function allText(doc) {
  let s = '';
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    if (o instanceof PDFRawStream) { s += o.dict.toString(); try { s += String(o.dict.lookup(PDFName.of('Filter'))) === '/FlateDecode' ? zlib.inflateSync(Buffer.from(o.contents)).toString('latin1') : Buffer.from(o.contents).toString('latin1'); } catch { /* not text */ } }
    else s += o.toString();
  }
  return s;
}
// The (only) image drawn on page i of a pdf-lib PDFDocument, as { w, h, rgb }.
function pageImage(doc, i) {
  const xo = doc.getPage(i).node.Resources().lookup(PDFName.of('XObject'));
  const s = doc.context.lookup(xo.get(xo.keys()[0]));
  const w = s.dict.lookup(PDFName.of('Width')).asNumber(), h = s.dict.lookup(PDFName.of('Height')).asNumber();
  if (!(s instanceof PDFRawStream) || String(s.dict.lookup(PDFName.of('Filter'))) !== '/FlateDecode') throw new Error('unexpected image encoding');
  return { w, h, rgb: zlib.inflateSync(Buffer.from(s.contents)) };
}
// Share of dark pixels in a rectangle given in PDF points (origin bottom-left) of a page of height H points.
function darkShare(im, H, x0, y0, x1, y1) {
  const k = im.w / 600;
  let n = 0, dark = 0;
  for (let y = Math.round((H - y1) * k); y < Math.round((H - y0) * k); y++) for (let x = Math.round(x0 * k); x < Math.round(x1 * k); x++) {
    const i = (y * im.w + x) * 3; n++; if (im.rgb[i] < 40 && im.rgb[i + 1] < 40 && im.rgb[i + 2] < 40) dark++;
  }
  return dark / n;
}

// 600x400 pages. 1: one run "Name: John Smith, Date: 2020". 2: "Client " + "John" in bold + " Smith" (three runs).
// 3: "Signed by John" / "Smith on Monday" on two lines. 4: a text field whose value is "John Smith". 5: "Other page".
async function redactFixture() {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica), fb = await d.embedFont(StandardFonts.HelveticaBold);
  const geo = {};
  let p = d.addPage([600, 400]);
  p.drawText('Name: John Smith, Date: 2020', { x: 50, y: 300, size: 20, font: f });
  geo.name = [50, 50 + f.widthOfTextAtSize('Name:', 20)];
  geo.john = [50 + f.widthOfTextAtSize('Name: ', 20), 50 + f.widthOfTextAtSize('Name: John Smith', 20)];
  geo.date = [50 + f.widthOfTextAtSize('Name: John Smith, ', 20), 50 + f.widthOfTextAtSize('Name: John Smith, Date: 2020', 20)];
  p = d.addPage([600, 400]);
  let x = 50;
  for (const [t, ff] of [['Client ', f], ['John', fb], [' Smith', f]]) { p.drawText(t, { x, y: 300, size: 20, font: ff }); x += ff.widthOfTextAtSize(t, 20); }
  p = d.addPage([600, 400]);
  p.drawText('Signed by John', { x: 50, y: 300, size: 20, font: f });
  p.drawText('Smith on Monday', { x: 50, y: 270, size: 20, font: f });
  p = d.addPage([600, 400]);
  p.drawText('Customer form', { x: 50, y: 300, size: 20, font: f });
  const tf = d.getForm().createTextField('customer');
  tf.setText('John Smith');
  tf.addToPage(p, { x: 50, y: 200, width: 250, height: 30 });
  p = d.addPage([600, 400]);
  p.drawText('Other page', { x: 50, y: 300, size: 20, font: f });
  return { bytes: Buffer.from(await d.save()), geo };
}

await T('pdf-redact', async () => {
  const { bytes, geo } = await redactFixture();
  await open('/tools/pdf-tools/pdf-redact');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'contract.pdf', mimeType: 'application/pdf', buffer: bytes });
  await page.getByPlaceholder('Enter text to censor...').fill('John Smith');
  await page.getByRole('button', { name: 'Redact PDF' }).click();
  const out = await linkBytes('a[download="redacted.pdf"]');
  const texts = await pageTexts(out);
  const doc = await PDFDocument.load(out);
  const leaks = texts.map((t, i) => (/john|smith/i.test(t) ? `p${i + 1}: ${t}` : '')).filter(Boolean);
  check('pdf-redact: "John Smith" split over runs (bold word, line break) is found and removed too', !/john|smith/i.test(texts[1] + texts[2]), leaks.join(' | '));
  const raw = allText(doc);
  const hex1 = Buffer.from('John Smith', 'latin1').toString('hex'), hex2 = Buffer.from('John Smith', 'utf16le').swap16().toString('hex');
  const found = ['John Smith', hex1, hex2].find((n) => raw.toLowerCase().replace(/\s+(?=[0-9a-f]*>)/g, '').includes(n.toLowerCase()));
  check('pdf-redact: a form field whose value is "John Smith" is removed too (nowhere left in the file, as text or hex)', !found, found || '');
  check('pdf-redact: pages without the phrase keep their text', texts[4] === 'Other page', texts[4]);
  const im = pageImage(doc, 0);
  const js = darkShare(im, 400, geo.john[0] + 2, 302, geo.john[1] - 2, 312), ns = darkShare(im, 400, geo.name[0], 300, geo.name[1], 315), ds = darkShare(im, 400, geo.date[0], 300, geo.date[1], 315);
  check('pdf-redact: the phrase itself is blacked out', js > 0.95, `black ${js.toFixed(2)}`);
  check('pdf-redact: only the phrase is blacked out, not the whole line (as Adobe / PDF24)', ns < 0.5 && ds < 0.5, `"Name:" ${ns.toFixed(2)}, "Date: 2020" ${ds.toFixed(2)}`);
});

// Pages: 1 plain 600x400; 2 already cropped to [50 50 550 350]; 3 displayed rotated 90; 4 MediaBox [100 100 700 500].
await T('pdf-crop', async () => {
  const d = await PDFDocument.create();
  d.addPage([600, 400]);
  d.addPage([600, 400]).setCropBox(50, 50, 500, 300);
  d.addPage([600, 400]).setRotation(degrees(90));
  d.addPage([600, 400]).setMediaBox(100, 100, 600, 400);
  await open('/tools/pdf-tools/pdf-crop');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  const inputs = page.locator('input[type="number"]'); // top, bottom, left, right
  await inputs.nth(0).fill('10'); await inputs.nth(1).fill('30'); await inputs.nth(2).fill('40'); await inputs.nth(3).fill('20');
  await page.getByRole('button', { name: 'Crop PDF' }).click();
  const out = await PDFDocument.load(await linkBytes('a[download="cropped.pdf"]'));
  const cb = out.getPages().map((p) => { const b = p.getCropBox(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v)).join(','); });
  check('pdf-crop: plain page, margins top 10 / right 20 / bottom 30 / left 40', cb[0] === '40,30,540,360', cb[0]);
  check('pdf-crop: a page already cropped is cropped further, not reset to its full size', cb[1] === '90,80,440,260', cb[1]);
  check('pdf-crop: on a page displayed rotated 90, "top" trims the edge seen at the top', cb[2] === '10,40,560,340', cb[2]);
  check('pdf-crop: a MediaBox not starting at 0,0 is cropped from its own edges', cb[3] === '140,130,540,360', cb[3]);
  await inputs.nth(0).fill('300');
  await page.getByRole('button', { name: 'Crop PDF' }).click();
  await page.waitForTimeout(1500);
  const err = await page.locator('p.text-red-400').first().textContent({ timeout: 5000 }).catch(() => '');
  const link = await page.locator('a[download="cropped.pdf"]').count();
  check('pdf-crop: margins larger than a page are refused with a message naming the page (page 2 is 300 pt tall)', /page 2 /.test(err) && link === 0, `${err} / link ${link}`);
});

await T('pdf-unlock', async () => {
  const C = await import('@cantoo/pdf-lib');
  const d = await C.PDFDocument.create();
  const f = await d.embedFont(C.StandardFonts.Helvetica);
  const p = d.addPage([600, 400]); p.drawText('Secret report', { x: 50, y: 300, size: 20, font: f });
  const tf = d.getForm().createTextField('amount'); tf.setText('1234'); tf.addToPage(p, { x: 50, y: 200, width: 200, height: 30 });
  const ctx = d.context, outlines = ctx.nextRef(), item = ctx.nextRef();
  ctx.assign(item, ctx.obj({ Title: C.PDFHexString.fromText('Chapter 1'), Parent: outlines, Dest: [p.ref, 'XYZ', null, null, null] }));
  ctx.assign(outlines, ctx.obj({ Type: 'Outlines', First: item, Last: item, Count: 1 }));
  d.catalog.set(C.PDFName.of('Outlines'), outlines);
  d.encrypt({ userPassword: 'pw1', ownerPassword: 'own' });
  await open('/tools/pdf-tools/pdf-unlock');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'locked.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  await page.getByPlaceholder('Enter PDF password').fill('pw1');
  await page.getByRole('button', { name: 'Unlock PDF' }).click();
  const out = await linkBytes('a[download="unlocked.pdf"]');
  const doc = await PDFDocument.load(out);
  const ol = await (await pdfjs.getDocument({ data: new Uint8Array(out), verbosity: 0 }).promise).getOutline();
  check('pdf-unlock: no encryption left, text readable', !doc.isEncrypted && (await pageTexts(out))[0] === 'Secret report');
  check('pdf-unlock: form fields and bookmarks are kept (as iLovePDF / Smallpdf)', doc.getForm().getFields().length === 1 && (ol || []).length === 1, `fields ${doc.getForm().getFields().length}, bookmarks ${(ol || []).length}`);
});

await T('pdf-to-html', async () => {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  const p = d.addPage([600, 400]);
  p.drawText('Price < 5 & x > 2', { x: 50, y: 350, size: 14, font: f });
  p.drawText('<b>not bold</b>', { x: 50, y: 320, size: 14, font: f });
  p.drawText('Line one', { x: 50, y: 200, size: 14, font: f });
  p.drawText('Line two', { x: 50, y: 182, size: 14, font: f });
  await open('/tools/pdf-tools/pdf-to-html');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  await page.getByRole('button', { name: 'Convert to HTML' }).click();
  const html = (await linkBytes('a[download="doc.html"]')).toString('utf8');
  const r = await page.evaluate((h) => { const doc = new DOMParser().parseFromString(h, 'text/html'); return { text: doc.body.textContent, bold: doc.querySelectorAll('b').length, html: doc.body.innerHTML }; }, html);
  check('pdf-to-html: "<", ">" and "&" in the PDF are shown as written (escaped)', r.text.includes('Price < 5 & x > 2') && r.text.includes('<b>not bold</b>') && r.bold === 0, `bold elements ${r.bold}`);
  check('pdf-to-html: line breaks are kept (Line one / Line two on two lines)', /Line one<br>\s*Line two/.test(r.html), r.html.slice(0, 300));
});

// Signature: a short horizontal stroke drawn on the pad; the PDF's last page is displayed rotated 90.
await T('pdf-sign', async () => {
  const d = await PDFDocument.create();
  d.addPage([600, 400]);
  d.addPage([600, 400]).setRotation(degrees(90));
  await open('/tools/pdf-tools/pdf-sign');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  const pad = page.locator('canvas').first();
  const bb = await pad.boundingBox();
  await page.mouse.move(bb.x + bb.width * 0.1, bb.y + bb.height * 0.5);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(bb.x + bb.width * (0.1 + 0.01 * i), bb.y + bb.height * (0.5 + (i % 2 ? 0.1 : -0.1)));
  await page.mouse.up();
  const cols = await page.evaluate(() => { const c = document.querySelector('canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const xs = []; for (let x = 0; x < c.width; x++) for (let y = 0; y < c.height; y++) if (d[(y * c.width + x) * 4 + 3] > 0 && !(d[(y * c.width + x) * 4] > 240 && d[(y * c.width + x) * 4 + 1] > 240)) { xs.push(x); break; } return { min: Math.min(...xs), max: Math.max(...xs), w: c.width }; });
  check('pdf-sign: the stroke is drawn under the pointer (10-20 % of the pad)', Math.abs(cols.min - 0.1 * cols.w) < 8 && Math.abs(cols.max - 0.2 * cols.w) < 8, JSON.stringify(cols));
  await page.getByRole('button', { name: 'Add Signature to PDF' }).click();
  const out = await PDFDocument.load(await linkBytes('a[download="signed.pdf"]'));
  const last = out.getPage(1);
  const xo = last.node.Resources().lookup(PDFName.of('XObject'));
  const img = out.context.lookup(xo.get(xo.keys()[0]));
  const iw = img.dict.lookup(PDFName.of('Width')).asNumber(), ih = img.dict.lookup(PDFName.of('Height')).asNumber();
  const sm = img.dict.lookup(PDFName.of('SMask'));
  const alpha = sm ? zlib.inflateSync(Buffer.from(sm.contents)) : null;
  const clear = alpha ? alpha.filter((a) => a === 0).length / alpha.length : 0;
  check('pdf-sign: the signature has a transparent background (it hides nothing under it)', clear > 0.5, `transparent share ${clear.toFixed(2)}`);
  // Transformation of the image on the page: product of the cm operators before Do.
  const cs = [].concat(last.node.Contents() instanceof PDFArray ? last.node.Contents().asArray() : [last.node.get(PDFName.of('Contents'))]).map((r) => out.context.lookup(r)).map((s) => { try { return zlib.inflateSync(Buffer.from(s.contents)).toString('latin1'); } catch { return Buffer.from(s.contents).toString('latin1'); } }).join('\n');
  const blk = cs.slice(cs.lastIndexOf('q', cs.indexOf(' Do')), cs.indexOf(' Do'));
  let M = [1, 0, 0, 1, 0, 0];
  for (const m of blk.matchAll(/(-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) cm/g)) {
    const [a, b, c, dd, e, f] = m.slice(1).map(Number);
    M = [a * M[0] + b * M[2], a * M[1] + b * M[3], c * M[0] + dd * M[2], c * M[1] + dd * M[3], e * M[0] + f * M[2] + M[4], e * M[1] + f * M[3] + M[5]];
  }
  const wPt = Math.hypot(M[0], M[1]), hPt = Math.hypot(M[2], M[3]);
  check('pdf-sign: the signature keeps its proportions (not squeezed into 200 x 80)', Math.abs(wPt / hPt - iw / ih) / (iw / ih) < 0.03, `drawn ${wPt.toFixed(0)}x${hPt.toFixed(0)}, image ${iw}x${ih}`);
  // Page rotated 90: visible (vx, vy) = (y, W - x). The image centre must be at the visible bottom right, upright.
  const cx = M[4] + (M[0] + M[2]) / 2, cy = M[5] + (M[1] + M[3]) / 2;
  const vx = cy, vy = 600 - cx;
  check('pdf-sign: on a page displayed rotated, the signature is upright in the bottom-right corner the reader sees', M[1] > 0 && Math.abs(M[0]) < 1e-6 && vx > 200 && vy < 300, `matrix ${M.map((v) => v.toFixed(1))}, visible centre ${vx.toFixed(0)},${vy.toFixed(0)} of 400x600`);
});

// Free placement (30/09): the last page is displayed rotated (visible 400 x 600); the signature is dragged to 10 % /
// 10 % of the page as seen and widened to 40 % of it; the PDF must have it exactly there, upright.
await T('pdf-sign-drag', async () => {
  const d = await PDFDocument.create();
  d.addPage([300, 300]);
  d.addPage([600, 400]).setRotation(degrees(90));
  await open('/tools/pdf-tools/pdf-sign');
  await page.setViewportSize({ width: 1280, height: 1400 }); // the whole page preview on screen, below the sticky header
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'contract.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  const bb = await page.locator('canvas').first().boundingBox();
  await page.mouse.move(bb.x + bb.width * 0.2, bb.y + bb.height * 0.5);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(bb.x + bb.width * (0.2 + 0.02 * i), bb.y + bb.height * (0.5 + (i % 2 ? 0.15 : -0.15)));
  await page.mouse.up();
  await page.locator('#sign-corner').selectOption('custom');
  const box = page.locator('[data-sign-box]');
  await box.waitFor({ timeout: 30000 });
  const stage = page.locator('[data-sign-stage]');
  await stage.scrollIntoViewIfNeeded();
  const st = await stage.boundingBox();
  check('pdf-sign-drag: the page shown is the last one, as seen (portrait 400 x 600)', Math.abs(st.width / st.height - 400 / 600) < 0.02, `${st.width.toFixed(0)}x${st.height.toFixed(0)}`);
  let b0 = await box.boundingBox();
  await page.mouse.move(b0.x + 5, b0.y + 5);
  await page.mouse.down();
  await page.mouse.move(st.x + st.width * 0.1 + 5, st.y + st.height * 0.1 + 5, { steps: 8 });
  await page.mouse.up();
  b0 = await box.boundingBox();
  const hb = await page.locator('[data-sign-resize]').boundingBox();
  const grow = st.width * 0.4 - b0.width;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down();
  await page.mouse.move(hb.x + hb.width / 2 + grow, hb.y + hb.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  const b1 = await box.boundingBox();
  const shown = { l: (b1.x - st.x) / st.width, t: (b1.y - st.y) / st.height, w: b1.width / st.width, h: b1.height / st.height };
  check('pdf-sign-drag: dragged and resized on screen (left 10 %, top 10 %, width 40 %)', Math.abs(shown.l - 0.1) < 0.01 && Math.abs(shown.t - 0.1) < 0.01 && Math.abs(shown.w - 0.4) < 0.01, JSON.stringify(Object.fromEntries(Object.entries(shown).map(([k, v]) => [k, +v.toFixed(3)]))));
  await page.getByRole('button', { name: 'Add Signature to PDF' }).click();
  const out = await PDFDocument.load(await linkBytes('a[download="signed.pdf"]'));
  const last = out.getPage(1);
  const cs = [].concat(last.node.Contents() instanceof PDFArray ? last.node.Contents().asArray() : [last.node.get(PDFName.of('Contents'))]).map((r) => out.context.lookup(r)).map((x) => { try { return zlib.inflateSync(Buffer.from(x.contents)).toString('latin1'); } catch { return Buffer.from(x.contents).toString('latin1'); } }).join('\n');
  const blk = cs.slice(cs.lastIndexOf('q', cs.indexOf(' Do')), cs.indexOf(' Do'));
  let M = [1, 0, 0, 1, 0, 0];
  for (const m of blk.matchAll(/(-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) (-?[\d.e-]+) cm/g)) {
    const [a, b, c, dd, e, f] = m.slice(1).map(Number);
    M = [a * M[0] + b * M[2], a * M[1] + b * M[3], c * M[0] + dd * M[2], c * M[1] + dd * M[3], e * M[0] + f * M[2] + M[4], e * M[1] + f * M[3] + M[5]];
  }
  // Corners of the image in page space, then as seen (rotated 90: visible x = y, visible y from the top = x).
  const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => [M[0] * u + M[2] * v + M[4], M[1] * u + M[3] * v + M[5]]).map(([x, y]) => [y, x]);
  const L = Math.min(...pts.map((q) => q[0])), R = Math.max(...pts.map((q) => q[0])), Tp = Math.min(...pts.map((q) => q[1])), B = Math.max(...pts.map((q) => q[1]));
  check('pdf-sign-drag: in the PDF, at the same place as on screen, same size, upright', Math.abs(L / 400 - shown.l) < 0.01 && Math.abs(Tp / 600 - shown.t) < 0.01 && Math.abs((R - L) / 400 - shown.w) < 0.01 && Math.abs((B - Tp) / 600 - shown.h) < 0.015 && M[1] > 0 && Math.abs(M[0]) < 1e-6, `left ${L.toFixed(1)} top ${Tp.toFixed(1)} width ${(R - L).toFixed(1)} height ${(B - Tp).toFixed(1)} of 400x600`);
  check('pdf-sign-drag: the first page is untouched', !(out.getPage(0).node.Resources()?.lookup(PDFName.of('XObject'))));
});

await T('pdf-forms', async () => {
  const d = await PDFDocument.create();
  const p = d.addPage([600, 400]);
  const form = d.getForm();
  const city = form.createTextField('city'); city.setText('Paris'); city.addToPage(p, { x: 50, y: 330, width: 200, height: 24 });
  form.createTextField('name').addToPage(p, { x: 50, y: 290, width: 200, height: 24 });
  form.createCheckBox('agree').addToPage(p, { x: 50, y: 250, width: 18, height: 18 });
  const dd = form.createDropdown('country'); dd.addOptions(['France', 'Spain']); dd.addToPage(p, { x: 50, y: 200, width: 200, height: 24 });
  await open('/tools/pdf-tools/pdf-forms');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'form.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  await page.getByText('country').first().waitFor({ timeout: 20000 });
  const row = (n) => page.locator(`[data-field="${n}"]`);
  const hasRows = await row('name').count();
  if (hasRows) {
    await row('name').locator('input').fill('Ana');
    await row('agree').locator('input[type="checkbox"]').check();
    await row('country').locator('select').selectOption('Spain');
  } else {
    // Old page: one text box per field, in order city, name, agree, country.
    const boxes = page.locator('input[type="text"]:visible');
    await boxes.nth(1).fill('Ana'); await boxes.nth(2).fill('yes'); await boxes.nth(3).fill('Spain');
  }
  await page.getByRole('button', { name: 'Fill and Download PDF' }).click();
  const out = await PDFDocument.load(await linkBytes('a[download="filled_form.pdf"]'));
  const f2 = out.getForm();
  const has = (n) => f2.getFields().some((x) => x.getName() === n);
  check('pdf-forms: a value already in the form (city = Paris) is kept when left alone', has('city') && f2.getTextField('city').getText() === 'Paris', has('city') ? f2.getTextField('city').getText() : 'field gone (flattened)');
  check('pdf-forms: text, checkbox and dropdown are filled (as Sejda / Smallpdf)', has('name') && f2.getTextField('name').getText() === 'Ana' && f2.getCheckBox('agree').isChecked() && f2.getDropdown('country').getSelected()[0] === 'Spain', has('name') ? `${f2.getTextField('name').getText()} ${f2.getCheckBox('agree').isChecked()} ${f2.getDropdown('country').getSelected()}` : 'fields gone (flattened)');
});

await T('pdf-organize', async () => {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  d.setTitle('Application form');
  for (const n of [1, 2]) d.addPage([600, 400]).drawText(`Page ${n}`, { x: 50, y: 300, size: 20, font: f });
  const tf = d.getForm().createTextField('surname'); tf.setText('Martin'); tf.addToPage(d.getPage(1), { x: 50, y: 200, width: 200, height: 30 });
  // Bookmarks (30/09): "Intro" on page 1 (removed below), "Form" on page 2 -> only "Form", on the output's page 1.
  const pg = d.getPages().map((p) => p.ref), c = d.context;
  const items = [['Intro', 0], ['Form', 1]].map(([t, i]) => c.obj({ Title: PDFHexString.fromText(t), Dest: c.obj([pg[i], PDFName.of('Fit')]) }));
  const refs = items.map((o) => c.register(o)), root = c.register(c.obj({ Type: 'Outlines', First: refs[0], Last: refs[1], Count: 2 }));
  items.forEach((o) => o.set(PDFName.of('Parent'), root)); items[0].set(PDFName.of('Next'), refs[1]); items[1].set(PDFName.of('Prev'), refs[0]);
  d.catalog.set(PDFName.of('Outlines'), root);
  await open('/tools/pdf-tools/pdf-organize');
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  await page.getByRole('button', { name: 'Remove' }).first().click();
  await page.getByRole('button', { name: 'Apply Changes' }).click();
  const out = await PDFDocument.load(await linkBytes('a[download="organized.pdf"]'));
  check('pdf-organize: the form field of a kept page still works, the title is kept', out.getPageCount() === 1 && out.getForm().getFields().length === 1 && out.getTitle() === 'Application form', `pages ${out.getPageCount()}, fields ${out.getForm().getFields().length}, title ${out.getTitle()}`);
  const js = await pdfjs.getDocument({ data: new Uint8Array(await out.save()), verbosity: 0 }).promise;
  const ol = (await js.getOutline()) || [];
  const at = ol.length ? await js.getPageIndex(ol[0].dest[0]) : -1;
  check('pdf-organize: bookmarks follow their page; the bookmark of the removed page is gone', ol.length === 1 && ol[0].title === 'Form' && at === 0, JSON.stringify(ol.map((o) => o.title)) + ` -> page index ${at}`);
});

await T('markdown-to-pdf', async () => {
  await open('/tools/pdf-tools/markdown-to-pdf');
  await page.evaluate(() => { window.print = () => {}; window.open = ((o) => (...a) => { const w = o.apply(window, a); if (w) w.print = () => {}; return w; })(window.open); });
  await page.getByRole('button', { name: /Paste/ }).click();
  await page.getByPlaceholder('Paste your Markdown here...').fill('# Title\n\n<img src="x" onerror="(window.opener || window.parent).__pwned = 1">\n\n<script>(window.opener || window.parent).__pwned = 2</script>\n\nText');
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await page.waitForTimeout(3000);
  const pwned = await page.evaluate(() => window.__pwned);
  check('markdown-to-pdf: HTML inside the Markdown cannot run scripts on the site', pwned === undefined, `__pwned = ${pwned}`);
});

// A scanned A4 page (an image, no text layer) at 300 dpi with 7 pt text. Needs cdn.jsdelivr.net (Tesseract data).
const OCR_LINES = ['The quick brown fox jumps over the lazy dog near the river bank.', 'Invoice number 48213 was paid on 12 March 2024 by transfer.', 'Please return the signed contract before the end of the month.', 'Small print matters: every clause of this agreement is binding.'];
const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
if (!process.argv.includes('--no-ocr')) await T('pdf-ocr', async () => {
  await open('/tools/pdf-tools/pdf-ocr');
  const png = await page.evaluate(async (lines) => {
    const c = document.createElement('canvas'); c.width = 2480; c.height = 3508;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#000'; x.font = '29px Arial'; // 7 pt at 300 dpi
    lines.forEach((l, i) => x.fillText(l, 250, 400 + i * 45));
    const b = await new Promise((r) => c.toBlob(r, 'image/png'));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  }, OCR_LINES);
  const d = await PDFDocument.create();
  const im = await d.embedPng(Buffer.from(png));
  d.addPage([595.28, 841.89]).drawImage(im, { x: 0, y: 0, width: 595.28, height: 841.89 });
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await d.save()) });
  await page.getByRole('button', { name: 'Run OCR' }).click();
  const text = await page.locator('textarea').first().inputValue({ timeout: 240000 }).then(async () => { await page.waitForFunction(() => document.querySelector('textarea')?.value.length > 50, null, { timeout: 240000 }); return page.locator('textarea').first().inputValue(); });
  const want = OCR_LINES.join(' ').replace(/\s+/g, ' '), got = text.replace(/--- Page \d+ ---/g, '').replace(/\s+/g, ' ').trim();
  const cer = lev(want, got) / want.length;
  check('pdf-ocr: 7 pt text of a 300 dpi scan is read with under 2 % character errors', cer < 0.02, `CER ${(cer * 100).toFixed(1)} % -> ${got.slice(0, 120)}`);
  const link = page.locator('a[download$=".pdf"]');
  const has = await link.count();
  let searchable = false;
  if (has) {
    const out = await linkBytes('a[download$=".pdf"]');
    const t = (await pageTexts(out))[0];
    const img = (await PDFDocument.load(out)).getPage(0).node.Resources().lookup(PDFName.of('XObject'));
    searchable = /invoice/i.test(t) && /contract/i.test(t) && !!img;
  }
  check('pdf-ocr: a searchable PDF is offered (the scan kept, the recognized text added under it, as iLovePDF / PDF24)', searchable, has ? 'no text layer in the PDF' : 'no PDF offered');
});

// The rendering service PLAYED in the page: fetch() to /api/convert-html-to-pdf is answered with a one-page PDF and the
// HTML file it carried is kept in window.__sentHtml (Playwright's WebKit does not give the multipart file part to route()).
async function capturePosted(p) {
  await p.evaluate(() => {
    const real = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      if (/\/api\/convert-html-to-pdf/.test(url) && init && init.body instanceof FormData) {
        window.__sentHtml = await init.body.get('file').text();
        const pdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 10 10]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n';
        return new Response(new Blob([pdf], { type: 'application/pdf' }), { status: 200, headers: { 'Content-Type': 'application/pdf' } });
      }
      return real(input, init);
    };
  });
}
// EPUB with an SVG cover page (<svg><image xlink:href>), as calibre and Sigil write it, a chapter image and a CSS
// background image. The conversion service is PLAYED here (route intercepted): the HTML the page sends is checked.
async function epubFixture() {
  const JSZip = (await import('jszip')).default;
  const z = new JSZip();
  const png = (rgb) => { const c = new Uint8Array(4 * 4 * 4); for (let i = 0; i < 16; i++) c.set([...rgb, 255], i * 4); return Buffer.from(UPNGenc.encode([c.buffer], 4, 4, 0)); };
  z.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  z.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  z.file('OEBPS/content.opf', '<?xml version="1.0" encoding="utf-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">x</dc:identifier><dc:title>Test book</dc:title><dc:language>en</dc:language><meta name="cover" content="cimg"/></metadata><manifest><item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" properties="svg"/><item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/><item id="css" href="style.css" media-type="text/css"/><item id="cimg" href="images/cover.png" media-type="image/png" properties="cover-image"/><item id="fig" href="images/fig.png" media-type="image/png"/><item id="bg" href="images/bg.png" media-type="image/png"/><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/></manifest><spine><itemref idref="cover"/><itemref idref="ch1"/></spine></package>');
  z.file('OEBPS/nav.xhtml', '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>nav</title></head><body><nav epub:type="toc"><ol><li><a href="ch1.xhtml">Chapter 1</a></li></ol></nav></body></html>');
  z.file('OEBPS/cover.xhtml', '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Cover</title></head><body><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100%" height="100%" viewBox="0 0 4 4"><image width="4" height="4" xlink:href="images/cover.png"/></svg></body></html>');
  z.file('OEBPS/ch1.xhtml', '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter 1</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body><h1 class="deco">Chapter 1</h1><p>Once upon a time.</p><img src="images/fig.png" alt="fig"/></body></html>');
  z.file('OEBPS/style.css', '.deco { background: url("images/bg.png") no-repeat; }');
  z.file('OEBPS/images/cover.png', png([200, 30, 30]));
  z.file('OEBPS/images/fig.png', png([30, 200, 30]));
  z.file('OEBPS/images/bg.png', png([30, 30, 200]));
  return z.generateAsync({ type: 'nodebuffer', mimeType: 'application/epub+zip' });
}
await T('epub-to-pdf', async () => {
  await open('/tools/pdf-tools/epub-to-pdf');
  let sent = null;
  await capturePosted(page);
  await page.locator('input[type="file"]').first().setInputFiles({ name: 'book.epub', mimeType: 'application/epub+zip', buffer: await epubFixture() });
  await page.getByRole('button', { name: /Convert/ }).first().click();
  for (let t = 0; t < 120 && sent === null; t++) { await page.waitForTimeout(500); sent = await page.evaluate(() => window.__sentHtml ?? null); }
  if (!sent) console.log('page says:', (await page.locator('main, body').first().innerText()).slice(0, 600).replace(/\s+/g, ' '));
  const html = sent || '';
  const dataImgs = (html.match(/data:image\/png;base64,/g) || []).length;
  check('epub-to-pdf: the HTML sent for rendering has no blob: or relative image address left (the server cannot fetch them)', html.length > 0 && !/blob:/.test(html) && !/["(]images\/(cover|fig|bg)\.png/.test(html), `${html.length} bytes, blob: ${(html.match(/blob:[^"')\s]*/g) || []).slice(0, 3)}`);
  check('epub-to-pdf: the SVG cover page, the chapter image and the CSS background are all inlined, the cover only once', dataImgs === 3, `data URIs ${dataImgs}`);
});

console.log(`\n${name}: ${passes} passed, ${fails} failed`);
if (errors.length) console.log('page errors:', errors.join('\n'));
await b.close();
process.exit(fails ? 1 : 0);
