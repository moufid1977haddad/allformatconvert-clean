// Minimal MOBI 6 book with one image (audit 2, 29/09), for MOBI to EPUB / MOBI to PDF: the only sample MOBI in
// the repo has no images in its chapters. Layout (MobileRead wiki, "MOBI" and "PDB" pages): a PalmDB header and
// record list; record 0 = PalmDOC header (no compression) + MOBI header (UTF-8) + full name; record 1 = the HTML
// text (under 4096 bytes); record 2 = a PNG, referenced from the text by <img recindex="00001">; then the end
// of file record. Returns a Buffer.
import UPNG from 'upng-js';

export function mobiWithImage(title = 'Image test') {
  const html = Buffer.from('<html><head></head><body><h1>Chapter one</h1><p>Before the picture.</p><img recindex="00001" /><p>After the picture.</p><mbp:pagebreak /><h1>Chapter two</h1><p>The end.</p></body></html>', 'utf8');
  const px = new Uint8Array(8 * 8 * 4); for (let i = 0; i < 64; i++) px.set([20, 160, 60, 255], i * 4);
  const png = Buffer.from(UPNG.encode([px.buffer], 8, 8, 0));
  const name = Buffer.from(title, 'utf8');
  const mobiLen = 232;
  // EXTH (the parser requires it): author (100) and updated title (503).
  const exthRecs = [[100, Buffer.from('Test Author', 'utf8')], [503, name]];
  let exthLen = 12 + exthRecs.reduce((a, [, d]) => a + 8 + d.length, 0);
  const exthPad = (4 - (exthLen % 4)) % 4;
  const exth = Buffer.alloc(exthLen + exthPad, 0);
  exth.write('EXTH', 0); exth.writeUInt32BE(exthLen, 4); exth.writeUInt32BE(exthRecs.length, 8);
  let eo = 12;
  for (const [t, d] of exthRecs) { exth.writeUInt32BE(t, eo); exth.writeUInt32BE(8 + d.length, eo + 4); d.copy(exth, eo + 8); eo += 8 + d.length; }
  const nameOff = 16 + mobiLen + exth.length;
  const rec0 = Buffer.alloc(nameOff + name.length + 4, 0);
  rec0.writeUInt16BE(1, 0); // no compression
  rec0.writeUInt32BE(html.length, 4);
  rec0.writeUInt16BE(1, 8); // one text record
  rec0.writeUInt16BE(4096, 10);
  const m = 16;
  rec0.write('MOBI', m);
  rec0.writeUInt32BE(mobiLen, m + 4);
  rec0.writeUInt32BE(2, m + 8); // book
  rec0.writeUInt32BE(65001, m + 12); // UTF-8
  rec0.writeUInt32BE(1234, m + 16);
  rec0.writeUInt32BE(6, m + 20); // version 6
  for (let o = 24; o < 64; o += 4) rec0.writeUInt32BE(0xffffffff, m + o); // orthographic/inflection/index slots
  rec0.writeUInt32BE(2, m + 64); // first non-book record
  rec0.writeUInt32BE(nameOff, m + 68); // full name offset (from record 0 start)
  rec0.writeUInt32BE(name.length, m + 72);
  rec0.writeUInt32BE(9, m + 76); // locale: English
  rec0.writeUInt32BE(6, m + 88); // min version
  rec0.writeUInt32BE(2, m + 92); // first image record
  rec0.writeUInt32BE(0x40, m + 112); // EXTH present
  for (const o of [148, 152, 156, 160, 164, 168]) rec0.writeUInt32BE(0xffffffff, m + o);
  rec0.writeUInt16BE(1, m + 176); // first content record
  rec0.writeUInt16BE(2, m + 178); // last content record
  rec0.writeUInt32BE(1, m + 180);
  for (const o of [184, 192, 208, 212, 220]) rec0.writeUInt32BE(0xffffffff, m + o);
  rec0.writeUInt32BE(0, m + 224); // extra record data flags (bytes 242-243 of record 0)
  rec0.writeUInt32BE(0xffffffff, m + 228); // no INDX
  exth.copy(rec0, 16 + mobiLen);
  name.copy(rec0, nameOff);
  const eof = Buffer.from([0xe9, 0x8e, 0x0d, 0x0a]);
  const records = [rec0, html, png, eof];
  const headerLen = 78 + records.length * 8 + 2;
  const pdb = Buffer.alloc(headerLen, 0);
  Buffer.from(title.slice(0, 31), 'latin1').copy(pdb, 0);
  pdb.write('BOOK', 60); pdb.write('MOBI', 64);
  pdb.writeUInt32BE(records.length * 2 - 1, 68);
  pdb.writeUInt16BE(records.length, 76);
  let off = headerLen;
  records.forEach((r, i) => { pdb.writeUInt32BE(off, 78 + i * 8); pdb.writeUInt32BE(i * 2, 78 + i * 8 + 4); off += r.length; });
  return Buffer.concat([pdb, ...records]);
}
