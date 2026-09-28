// PDF Extract Text layout (29/09). A PDF built with pdf-lib where the text
// positions are known: two lines, a word drawn in two pieces ("Hel" + "lo"),
// and two words separated by a gap. Read with pdf.js (the page's engine),
// laid out by app/lib/pdfTextLayout.js. (pdf.js already merges "Hel"+"lo"
// drawn in the same font, so the old join's defect here is the lost lines.) Oracle: the text as drawn (three
// baselines 30 pt apart). Poppler's pdftotext was tried as a second oracle and
// rejected: on this file it prints the first two lines as one.
// Run: node scripts/converter-tests/11-pdf-text.mjs
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const { itemsToText } = await import(new URL('../../app/lib/pdfTextLayout.js', import.meta.url));

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.addPage([400, 300]);
const size = 14;
page.drawText('Hel', { x: 40, y: 250, size, font });
page.drawText('lo', { x: 40 + font.widthOfTextAtSize('Hel', size), y: 250, size, font });
page.drawText('world', { x: 40 + font.widthOfTextAtSize('Hello ', size), y: 250, size, font });
page.drawText('Second line, café', { x: 40, y: 220, size, font });
page.drawText('Third', { x: 40, y: 190, size, font });
const bytes = await doc.save();

const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: false }).promise;
const tc = await (await pdf.getPage(1)).getTextContent();
const ours = itemsToText(tc.items);
const old = tc.items.map((i) => i.str).join(' ');

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; } };
test('old join: the whole page on one line (the defect is real)', () => {
  assert.equal(old, 'Hello world Second line, café Third');
});
test('new layout: lines kept, split word joined, gap becomes a space', () => {
  assert.equal(ours, 'Hello world\nSecond line, café\nThird');
});
console.log(`${passed} passed`);
