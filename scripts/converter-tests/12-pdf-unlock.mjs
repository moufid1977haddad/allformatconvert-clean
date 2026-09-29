// PDF Unlock (audit 2, 29/09): app/lib/pdfUnlock.js. The old tool copied the decrypted pages into a new PDF, which
// dropped bookmarks, form fields and document-level data; the defect is replayed here, then the fix is checked.
// Oracles: Poppler's pdftotext (text readable without a password), pdf-lib (no encryption, form fields), pdf.js
// (bookmarks). Fixtures: pypdf RC4-128 / AES-256 / AES-128 with a user password (fixtures/make-encrypted-pdf.mjs), and
// one made here with @cantoo/pdf-lib carrying a form field and a bookmark.
// Run: node scripts/converter-tests/12-pdf-unlock.mjs   (needs pdftotext)
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as C from '@cantoo/pdf-lib';
import { PDFDocument } from 'pdf-lib';
const { unlockPdfBytes } = await import(new URL('../../app/lib/pdfUnlock.js', import.meta.url));
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

const fx = (n) => new Uint8Array(readFileSync(new URL(`./fixtures/${n}`, import.meta.url)));
const dir = mkdtempSync(join(tmpdir(), 'unlock-'));
const text = (bytes) => { const f = join(dir, `${Math.random().toString(36).slice(2)}.pdf`); writeFileSync(f, bytes); try { return execFileSync('pdftotext', [f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };
const noEncryption = (bytes) => !Buffer.from(bytes).toString('latin1').includes('/Encrypt');
const outline = async (bytes) => ((await (await pdfjs.getDocument({ data: new Uint8Array(bytes), verbosity: 0 }).promise).getOutline()) || []).map((o) => o.title);
const oldUnlock = async (bytes, password) => { const d = await C.PDFDocument.load(bytes, { password }); const n = await C.PDFDocument.create(); (await n.copyPages(d, d.getPageIndices())).forEach((p) => n.addPage(p)); return n.save(); };

async function formAndBookmark() {
  const d = await C.PDFDocument.create();
  const f = await d.embedFont(C.StandardFonts.Helvetica);
  const p = d.addPage([600, 400]);
  p.drawText('Secret report', { x: 50, y: 300, size: 20, font: f });
  const tf = d.getForm().createTextField('amount'); tf.setText('1234'); tf.addToPage(p, { x: 50, y: 200, width: 200, height: 30 });
  const ctx = d.context, outlines = ctx.nextRef(), item = ctx.nextRef();
  ctx.assign(item, ctx.obj({ Title: C.PDFHexString.fromText('Chapter 1'), Parent: outlines, Dest: [p.ref, 'XYZ', null, null, null] }));
  ctx.assign(outlines, ctx.obj({ Type: 'Outlines', First: item, Last: item, Count: 1 }));
  d.catalog.set(C.PDFName.of('Outlines'), outlines);
  d.encrypt({ userPassword: 'pw1', ownerPassword: 'own' });
  return d.save();
}

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const readable = (t) => t.includes('Hello encrypted world page 1') && t.includes('Hello encrypted world page 2');
for (const [f, pw] of [['encrypted-rc4-128.pdf', ''], ['encrypted-aes-256.pdf', ''], ['encrypted-user-password.pdf', 'open-me']]) {
  test(`${f}: unlocked file has no encryption and its text reads back`, async () => {
    const { bytes, wasEncrypted } = await unlockPdfBytes(fx(f), pw);
    assert.equal(wasEncrypted, true);
    assert.ok(noEncryption(bytes));
    assert.ok(readable(text(bytes)));
  });
}
test('encrypted-user-password.pdf: wrong password is refused', async () => {
  await assert.rejects(unlockPdfBytes(fx('encrypted-user-password.pdf'), 'nope'), /Password incorrect/);
  await assert.rejects(unlockPdfBytes(fx('encrypted-user-password.pdf'), ''), /NEEDS PASSWORD/);
});
test('plain.pdf: reported as not encrypted, nothing produced', async () => {
  assert.deepEqual(await unlockPdfBytes(fx('plain.pdf'), ''), { bytes: null, wasEncrypted: false });
});
test('form field and bookmark: the OLD tool lost both (the defect is real)', async () => {
  const out = await oldUnlock(await formAndBookmark(), 'pw1');
  assert.equal((await PDFDocument.load(out)).getForm().getFields().length, 0);
  assert.deepEqual(await outline(out), []);
});
test('form field and bookmark: kept by the fix, with user or owner password', async () => {
  const enc = await formAndBookmark();
  for (const pw of ['pw1', 'own']) {
    const { bytes } = await unlockPdfBytes(enc, pw);
    assert.ok(noEncryption(bytes));
    const d = await PDFDocument.load(bytes);
    assert.deepEqual(d.getForm().getFields().map((x) => `${x.getName()}=${x.getText()}`), ['amount=1234']);
    assert.deepEqual(await outline(bytes), ['Chapter 1']);
    assert.ok(text(bytes).includes('Secret report'));
  }
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('ok  ', name); } catch (e) { console.log('FAIL', name, '\n     ', e.message.split('\n')[0]); }
}
console.log(`\n${passed}/${tests.length} passed`);
process.exit(passed === tests.length ? 0 : 1);
