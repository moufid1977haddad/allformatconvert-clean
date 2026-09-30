// Builds docs/audit/fixtures-safari/safari-book.mobi (P18, 01/10): a real MOBI 6 book for the Mac's Safari bench
// (MOBI to EPUB, MOBI to PDF), which had no MOBI file to use. Written by hand from the format's public description
// (MobileRead wiki: "PDB", "MOBI", "EXTH"), then READ BACK by KindleUnpack — the reference reader, through the
// `mobi` Python package — see verify-safari-mobi.py next to this file.
// Content: title and author in EXTH, 3 chapters of UTF-8 text (accents, typographic quotes, a euro sign) spread over
// several 4096-byte text records (as every real MOBI), bold/italic, a list, a JPEG photo (the Safari fixture photo)
// referenced by recindex, page breaks between chapters.
// Usage: node docs/audit/fixtures-safari/make-safari-mobi.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TITLE = 'Safari Test Book';
const AUTHOR = 'OnlineConverTools';
const photo = fs.readFileSync(path.join(here, 'safari-small-800x600.jpg'));

const para = (i) => `<p>Paragraph ${i}: « Déjà vu » — the café’s crème brûlée costs 4,50 €. <b>Bold words</b> and <i>italic words</i> keep their style.</p>`;
const chapter = (n, from, count) => `<h1>Chapter ${n}</h1>${Array.from({ length: count }, (_, k) => para(from + k)).join('')}`;
const html = Buffer.from(
  '<html><head><guide></guide></head><body>'
  + chapter(1, 1, 20)
  + '<p>The photo below comes from the book itself:</p><p><img recindex="00001" /></p>'
  + '<mbp:pagebreak />' + chapter(2, 21, 20)
  + '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>'
  + '<mbp:pagebreak />' + chapter(3, 41, 20)
  + '<p>The end.</p></body></html>', 'utf8');

// Text records of at most 4096 bytes, never cutting a UTF-8 character.
const textRecs = [];
for (let o = 0; o < html.length;) {
  let e = Math.min(html.length, o + 4096);
  while (e < html.length && (html[e] & 0xc0) === 0x80) e--;
  textRecs.push(html.subarray(o, e));
  o = e;
}
const firstImage = 1 + textRecs.length;

const name = Buffer.from(TITLE, 'utf8');
const exthRecs = [[100, Buffer.from(AUTHOR, 'utf8')], [503, name], [524, Buffer.from('en', 'utf8')], [201, Buffer.alloc(4)]]; // author, title, language, cover offset 0
let exthLen = 12 + exthRecs.reduce((a, [, d]) => a + 8 + d.length, 0);
const exth = Buffer.alloc(exthLen + ((4 - (exthLen % 4)) % 4), 0);
exth.write('EXTH', 0); exth.writeUInt32BE(exthLen, 4); exth.writeUInt32BE(exthRecs.length, 8);
let eo = 12;
for (const [t, d] of exthRecs) { exth.writeUInt32BE(t, eo); exth.writeUInt32BE(8 + d.length, eo + 4); d.copy(exth, eo + 8); eo += 8 + d.length; }

const mobiLen = 232;
const nameOff = 16 + mobiLen + exth.length;
const rec0 = Buffer.alloc(nameOff + name.length + 4, 0);
rec0.writeUInt16BE(1, 0);                  // PalmDOC compression: none
rec0.writeUInt32BE(html.length, 4);        // text length
rec0.writeUInt16BE(textRecs.length, 8);    // text record count
rec0.writeUInt16BE(4096, 10);              // record size
const m = 16;
rec0.write('MOBI', m);
rec0.writeUInt32BE(mobiLen, m + 4);
rec0.writeUInt32BE(2, m + 8);              // type: MOBI book
rec0.writeUInt32BE(65001, m + 12);         // UTF-8
rec0.writeUInt32BE(0x5a4e4f4f, m + 16);    // unique id
rec0.writeUInt32BE(6, m + 20);             // format version 6
for (let o = 24; o < 64; o += 4) rec0.writeUInt32BE(0xffffffff, m + o);
rec0.writeUInt32BE(firstImage, m + 64);    // first non-book record
rec0.writeUInt32BE(nameOff, m + 68);
rec0.writeUInt32BE(name.length, m + 72);
rec0.writeUInt32BE(9, m + 76);             // locale: English
rec0.writeUInt32BE(6, m + 88);             // min reader version
rec0.writeUInt32BE(firstImage, m + 92);    // first image record
rec0.writeUInt32BE(0x40, m + 112);         // EXTH present
for (const o of [148, 152, 156, 160, 164, 168]) rec0.writeUInt32BE(0xffffffff, m + o);
rec0.writeUInt16BE(1, m + 176);            // first content record
rec0.writeUInt16BE(firstImage, m + 178);   // last content record
rec0.writeUInt32BE(1, m + 180);
for (const o of [184, 192, 208, 212, 220]) rec0.writeUInt32BE(0xffffffff, m + o);
rec0.writeUInt32BE(0, m + 224);            // no trailing entries after text records
rec0.writeUInt32BE(0xffffffff, m + 228);   // no INDX
exth.copy(rec0, 16 + mobiLen);
name.copy(rec0, nameOff);

const eof = Buffer.from([0xe9, 0x8e, 0x0d, 0x0a]);
const records = [rec0, ...textRecs, photo, eof];
const headerLen = 78 + records.length * 8 + 2;
const pdb = Buffer.alloc(headerLen, 0);
Buffer.from('Safari_Test_Book', 'latin1').copy(pdb, 0);
const now = Math.floor(Date.UTC(2026, 9, 1) / 1000) + 2082844800; // PalmOS epoch 1904, fixed for a stable file
pdb.writeUInt32BE(now, 36); pdb.writeUInt32BE(now, 40);
pdb.write('BOOK', 60); pdb.write('MOBI', 64);
pdb.writeUInt32BE(records.length * 2 - 1, 68);
pdb.writeUInt16BE(records.length, 76);
let off = headerLen;
records.forEach((r, i) => { pdb.writeUInt32BE(off, 78 + i * 8); pdb.writeUInt32BE(i * 2, 78 + i * 8 + 4); off += r.length; });
const out = path.join(here, 'safari-book.mobi');
fs.writeFileSync(out, Buffer.concat([pdb, ...records]));
console.log(`${out}: ${fs.statSync(out).size} bytes, ${textRecs.length} text records, 1 JPEG image (${photo.length} bytes)`);
