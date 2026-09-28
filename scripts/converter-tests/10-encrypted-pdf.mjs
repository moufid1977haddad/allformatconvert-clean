// Encrypted PDFs through the pdf-lib tools (29/09). Replays what merge/split
// (copyPages into a new document) and watermark/rotate/number (edit in place)
// do, with and without app/lib/pdfDecrypt.js. Oracle: Poppler's pdftotext
// must read the text of every page back ("Hello encrypted world page N").
// Fixtures: fixtures/make-encrypted-pdf.mjs (pypdf, RC4-128 and AES-256).
// Run: node scripts/converter-tests/10-encrypted-pdf.mjs   (needs pdftotext)
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
const { openablePdfBytes, PdfNeedsPasswordError } = await import(new URL('../../app/lib/pdfDecrypt.js', import.meta.url));

const fx = (n) => new Uint8Array(readFileSync(new URL(`./fixtures/${n}`, import.meta.url)));
const dir = mkdtempSync(join(tmpdir(), 'encpdf-'));
const text = (bytes) => { const f = join(dir, `${Math.random().toString(36).slice(2)}.pdf`); writeFileSync(f, bytes); try { return execFileSync('pdftotext', [f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { return ''; } };
const merged = async (bytes) => { const src = await PDFDocument.load(bytes, { ignoreEncryption: true }); const out = await PDFDocument.create(); (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p)); return out.save(); };
const watermarked = async (bytes) => { const d = await PDFDocument.load(bytes, { ignoreEncryption: true }); const f = await d.embedFont(StandardFonts.Helvetica); d.getPages().forEach((p) => p.drawText('WM', { x: 5, y: 5, size: 12, font: f })); return d.save(); };
const readable = (t) => t.includes('Hello encrypted world page 1') && t.includes('Hello encrypted world page 2');

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
for (const f of ['encrypted-rc4-128.pdf', 'encrypted-aes-256.pdf']) {
  test(`${f}: WITHOUT the fix, pdf-lib output is unreadable (the defect is real)`, async () => {
    assert.equal(readable(text(await merged(fx(f)))), false);
    assert.equal(readable(text(await watermarked(fx(f)))), false);
  });
  test(`${f}: WITH openablePdfBytes, merge-like and edit-in-place outputs read back`, async () => {
    const b = await openablePdfBytes(fx(f));
    assert.ok(readable(text(await merged(b))));
    const w = text(await watermarked(b));
    assert.ok(readable(w) && w.includes('WM'));
  });
}
test('a PDF that needs a password to open is refused with a clear message', async () => {
  await assert.rejects(() => openablePdfBytes(fx('encrypted-user-password.pdf')), (e) => e instanceof PdfNeedsPasswordError && /PDF Unlock/.test(e.message));
});
test('an unencrypted PDF is returned as is (same bytes, no copy)', async () => {
  const b = fx('plain.pdf');
  assert.equal(await openablePdfBytes(b), b);
});

for (const [name, fn] of tests) {
  try { await fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; }
}
console.log(`${passed}/${tests.length} passed`);
