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
const { carryOver } = await import(new URL('../../app/lib/pdfCarryOver.js', import.meta.url));
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
for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('ok  ', name); } catch (e) { console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); }
}
console.log(`\n${passed}/${tests.length} passed`);
process.exit(passed === tests.length ? 0 : 1);
