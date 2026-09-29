// PDF Organize (audit 2, 29/09): pages copied into a new PDF lost the form (no AcroForm: fields no longer worked) and
// the document information. app/lib/pdfCarryOver.js rebuilds them for the kept pages. The defect is replayed, then
// the fix is checked; a removed page must still be absent from the file.
// Oracles: pdf-lib (form fields, values, title), Poppler's pdftotext (removed page's text absent).
// Run: node scripts/converter-tests/13-pdf-organize.mjs   (needs pdftotext)
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as lib from 'pdf-lib';
import zlib from 'node:zlib';
const { carryOver, carryOutline } = await import(new URL('../../app/lib/pdfCarryOver.js', import.meta.url));
const { PDFDocument, StandardFonts } = lib;
const dir = mkdtempSync(join(tmpdir(), 'organize-'));
const text = (bytes) => { const f = join(dir, `${Math.random().toString(36).slice(2)}.pdf`); writeFileSync(f, bytes); return execFileSync('pdftotext', [f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); };

async function fixture() {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  d.setTitle('Application form'); d.setAuthor('HR');
  for (const n of [1, 2, 3]) d.addPage([600, 400]).drawText(`Page ${n} private text`, { x: 50, y: 300, size: 20, font: f });
  const form = d.getForm();
  const a = form.createTextField('surname'); a.setText('Martin'); a.addToPage(d.getPage(1), { x: 50, y: 200, width: 200, height: 30 });
  const c = form.createCheckBox('agree'); c.check(); c.addToPage(d.getPage(2), { x: 50, y: 150, width: 20, height: 20 });
  const z = form.createTextField('only-on-1'); z.setText('gone'); z.addToPage(d.getPage(0), { x: 50, y: 100, width: 200, height: 30 });
  return d.save();
}
const organize = async (bytes, order, fix) => {
  const src = await PDFDocument.load(bytes); const out = await PDFDocument.create();
  (await out.copyPages(src, order.map((n) => n - 1))).forEach((p) => out.addPage(p));
  if (fix) carryOver(lib, src, out);
  return out.save();
};

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
test('WITHOUT the fix: the form and the title are lost (the defect is real)', async () => {
  const out = await PDFDocument.load(await organize(await fixture(), [3, 2], false));
  assert.equal(out.getForm().getFields().length, 0);
  assert.equal(out.getTitle(), undefined);
});
test('WITH the fix: fields of kept pages work with their values, title and author kept', async () => {
  const out = await PDFDocument.load(await organize(await fixture(), [3, 2], true));
  const form = out.getForm();
  assert.deepEqual(form.getFields().map((x) => x.getName()).sort(), ['agree', 'surname']);
  assert.equal(form.getTextField('surname').getText(), 'Martin');
  assert.equal(form.getCheckBox('agree').isChecked(), true);
  form.getTextField('surname').setText('Durand'); // still fillable
  assert.equal(out.getTitle(), 'Application form');
  assert.equal(out.getAuthor(), 'HR');
});
test('WITH the fix: the removed page (and its field) is not in the file', async () => {
  const bytes = await organize(await fixture(), [3, 2], true);
  const t = text(bytes);
  assert.ok(t.includes('Page 3 private text') && t.includes('Page 2 private text'));
  assert.ok(!t.includes('Page 1 private text'));
  assert.ok(t.indexOf('Page 3') < t.indexOf('Page 2'));
  const doc = await PDFDocument.load(bytes);
  let raw = '';
  for (const [, o] of doc.context.enumerateIndirectObjects()) {
    raw += (o instanceof lib.PDFRawStream ? o.dict : o).toString();
    if (o instanceof lib.PDFRawStream) { try { raw += zlib.inflateSync(Buffer.from(o.contents)).toString('latin1'); } catch { raw += Buffer.from(o.contents).toString('latin1'); } }
  }
  raw = raw.toLowerCase();
  assert.ok(raw.includes(Buffer.from('surname', 'utf16le').swap16().toString('hex')) || raw.includes('surname')); // the probe finds field names
  assert.ok(!raw.includes(Buffer.from('only-on-1', 'utf16le').swap16().toString('hex')) && !raw.includes('only-on-1'));
});
// Bookmarks (30/09). Oracle: Poppler's pdftohtml -xml, which lists the outline with each entry's page number.
async function outlined() {
  const d = await PDFDocument.create();
  const f = await d.embedFont(StandardFonts.Helvetica);
  for (const n of [1, 2, 3, 4]) d.addPage([600, 400]).drawText(`Page ${n} text`, { x: 50, y: 300, size: 20, font: f });
  const { PDFName, PDFString, PDFNumber, PDFHexString } = lib;
  const ctx = d.context, pg = d.getPages().map((p) => p.ref);
  const xyz = (i) => ctx.obj([pg[i], PDFName.of('XYZ'), 0, 400, null]);
  // Chapter 2 goes through a named destination in the Names tree, Chapter 3 through a GoTo action.
  d.catalog.set(PDFName.of('Names'), ctx.obj({ Dests: ctx.obj({ Names: [PDFHexString.fromText('ch2'), xyz(2)] }) }));
  const items = [
    { Title: PDFHexString.fromText('Chapter 1'), Dest: xyz(0) },
    { Title: PDFHexString.fromText('Section 1.1 é'), Dest: xyz(1) },
    { Title: PDFHexString.fromText('Chapter 2'), Dest: PDFString.of('ch2') },
    { Title: PDFHexString.fromText('Chapter 3'), A: ctx.obj({ S: 'GoTo', D: xyz(3) }) },
    { Title: PDFHexString.fromText('Website'), A: ctx.obj({ S: 'URI', URI: PDFString.of('https://example.com/') }) },
  ].map((o) => ctx.obj(o));
  const refs = items.map((o) => ctx.register(o));
  const root = ctx.obj({ Type: 'Outlines' }); const rootRef = ctx.register(root);
  const top = [0, 2, 3, 4];
  top.forEach((k, i) => {
    items[k].set(PDFName.of('Parent'), rootRef);
    if (i) items[k].set(PDFName.of('Prev'), refs[top[i - 1]]);
    if (i < top.length - 1) items[k].set(PDFName.of('Next'), refs[top[i + 1]]);
  });
  items[1].set(PDFName.of('Parent'), refs[0]);
  items[0].set(PDFName.of('First'), refs[1]); items[0].set(PDFName.of('Last'), refs[1]); items[0].set(PDFName.of('Count'), PDFNumber.of(1));
  root.set(PDFName.of('First'), refs[0]); root.set(PDFName.of('Last'), refs[4]); root.set(PDFName.of('Count'), PDFNumber.of(5));
  d.catalog.set(PDFName.of('Outlines'), rootRef);
  return d.save();
}
const withOutline = async (bytes, order) => {
  const src = await PDFDocument.load(bytes); const out = await PDFDocument.create();
  (await out.copyPages(src, order.map((n) => n - 1))).forEach((p) => out.addPage(p));
  carryOver(lib, src, out); carryOutline(lib, src, out, order);
  return out.save();
};
// [title, page, depth] from Poppler; entries without a page (links) get page 0.
const outlineOf = (bytes) => {
  const f = join(dir, `${Math.random().toString(36).slice(2)}.pdf`); writeFileSync(f, bytes);
  const xml = execFileSync('pdftohtml', ['-xml', '-stdout', '-i', '-q', f], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const res = []; let depth = -1;
  for (const m of xml.matchAll(/<outline>|<\/outline>|<item(?: page="(\d+)")?>([^<]*)<\/item>/g)) {
    if (m[0] === '<outline>') depth++; else if (m[0] === '</outline>') depth--; else res.push([m[2].replace(/&amp;/g, '&'), Number(m[1] || 0), depth]);
  }
  return res;
};
test('bookmarks: the source outline reads as expected (oracle sanity)', async () => {
  // pdftohtml does not resolve a named destination (Chapter 2 reads page 0 here); the output makes it explicit.
  assert.deepEqual(outlineOf(await outlined()), [['Chapter 1', 1, 0], ['Section 1.1 é', 2, 1], ['Chapter 2', 0, 0], ['Chapter 3', 4, 0], ['Website', 0, 0]]);
});
test('bookmarks WITHOUT the fix: the outline is lost (the gap is real)', async () => {
  assert.deepEqual(outlineOf(await organize(await outlined(), [4, 3, 1], true)), []);
});
test('bookmarks: reorder + page 2 removed -> each follows its page, the removed page\'s bookmark is gone, links kept', async () => {
  assert.deepEqual(outlineOf(await withOutline(await outlined(), [4, 3, 1])), [['Chapter 1', 3, 0], ['Chapter 2', 2, 0], ['Chapter 3', 1, 0], ['Website', 0, 0]]);
});
test('bookmarks: page 1 removed -> its bookmark is dropped and its child moves up', async () => {
  assert.deepEqual(outlineOf(await withOutline(await outlined(), [2, 3, 4])), [['Section 1.1 é', 1, 0], ['Chapter 2', 2, 0], ['Chapter 3', 3, 0], ['Website', 0, 0]]);
});
test('bookmarks: a page used twice -> the bookmark points to its first copy; the file reloads cleanly', async () => {
  const bytes = await withOutline(await outlined(), [1, 2, 1, 3, 4]);
  assert.deepEqual(outlineOf(bytes).slice(0, 3), [['Chapter 1', 1, 0], ['Section 1.1 é', 2, 1], ['Chapter 2', 4, 0]]);
  const again = await PDFDocument.load(bytes);
  assert.equal(again.getPageCount(), 5);
});
test('bookmarks: a PDF without an outline is unchanged (no empty Outlines)', async () => {
  const out = await PDFDocument.load(await withOutline(await fixture(), [3, 2]));
  assert.equal(out.catalog.get(lib.PDFName.of('Outlines')), undefined);
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('ok  ', name); } catch (e) { console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); }
}
console.log(`\n${passed}/${tests.length} passed`);
process.exit(passed === tests.length ? 0 : 1);
