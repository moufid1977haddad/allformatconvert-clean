// Builds test fixture files that can be produced purely in Node, using
// libraries already in this project's own dependency tree (pdf-lib, docx,
// xlsx) or by hand-encoding simple binary formats (WAV, GIF, BMP, ICO).
// No network access, no ffmpeg, no native canvas binding required.
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'files');
fs.mkdirSync(OUT, { recursive: true });
const w = (name, buf) => { fs.writeFileSync(path.join(OUT, name), buf); console.log('wrote', name, buf.length, 'bytes'); };

async function buildPdf() {
  const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 150]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Audit fixture PDF', { x: 20, y: 100, size: 18, font, color: rgb(0, 0, 0) });
  page.drawText('Line two of sample text.', { x: 20, y: 70, size: 12, font });
  const bytes = await doc.save();
  w('sample.pdf', Buffer.from(bytes));
}

async function buildDocx() {
  const { Document, Packer, Paragraph, TextRun } = require('docx');
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun('Audit fixture DOCX')] }),
        new Paragraph({ children: [new TextRun('Second paragraph of sample text.')] }),
      ],
    }],
  });
  const buf = await Packer.toBuffer(doc);
  w('sample.docx', buf);
}

function buildXlsxAndCsv() {
  const XLSX = require('xlsx');
  const rows = [['name', 'age', 'city'], ['Smith, John', 34, 'New York'], ['Jane', 29, 'Boston']];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const xbuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  w('sample.xlsx', xbuf);
  const xlsBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xls' });
  w('sample.xls', xlsBuf);
  const csv = rows.map(r => r.map(v => (typeof v === 'string' && v.includes(',')) ? `"${v}"` : v).join(',')).join('\n') + '\n';
  w('sample.csv', Buffer.from(csv));
  w('sample.tsv', Buffer.from(csv.replace(/,/g, '\t')));
}

function buildTextFormats() {
  w('sample.txt', Buffer.from('Audit fixture plain text.\nSecond line for good measure.\n'));
  w('sample.json', Buffer.from(JSON.stringify({ name: 'Audit Fixture', count: 3, tags: ['a', 'b'] }, null, 2)));
  w('sample.xml', Buffer.from('<?xml version="1.0"?>\n<root><item id="1">Audit</item><item id="2">Fixture</item></root>\n'));
  w('sample.yaml', Buffer.from('name: Audit Fixture\ncount: 3\ntags:\n  - a\n  - b\n'));
  w('sample.md', Buffer.from('# Audit Fixture\n\nSome **markdown** content with a [link](https://example.com).\n'));
  w('sample.html', Buffer.from('<!doctype html><html><body><h1>Audit Fixture</h1><p>Sample paragraph.</p></body></html>'));
  w('sample.env', Buffer.from('API_KEY=abc123\nDEBUG=true\nPORT=3000\n'));
  w('sample.sql', Buffer.from("CREATE TABLE t (id INT, name TEXT);\nINSERT INTO t VALUES (1, 'Audit');\n"));
  w('sample.toml', Buffer.from('name = "Audit Fixture"\ncount = 3\n'));
  w('sample.log', Buffer.from('2026-08-12 12:00:00 INFO starting\n2026-08-12 12:00:01 ERROR sample error line\n'));
}

// Minimal valid 44-byte-header WAV: 8-bit mono PCM, 8000Hz, ~0.5s of a simple tone.
function buildWav() {
  const sampleRate = 8000, seconds = 0.5, numSamples = Math.floor(sampleRate * seconds);
  const dataSize = numSamples; // 8-bit mono = 1 byte/sample
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24); buf.writeUInt32LE(sampleRate, 28);
  buf.writeUInt16LE(1, 32); buf.writeUInt16LE(8, 34); // block align, bits/sample
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    buf.writeUInt8(128 + Math.round(100 * Math.sin(2 * Math.PI * 440 * t)), 44 + i);
  }
  w('sample.wav', buf);
}

// Real animated GIF via gifenc (already a project dependency) -- avoids
// hand-rolling LZW bit-packing, which is easy to get subtly wrong.
function buildGif() {
  const { GIFEncoder, quantize, applyPalette } = require('gifenc');
  const width = 40, height = 40;
  const gif = GIFEncoder();
  const colors = [[255, 0, 0, 255], [0, 0, 255, 255]];
  for (const [r, g, b, a] of colors) {
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) { rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = a; }
    const palette = quantize(rgba, 8);
    const index = applyPalette(rgba, palette);
    gif.writeFrame(index, width, height, { palette, delay: 500 });
  }
  gif.finish();
  w('sample.gif', Buffer.from(gif.bytes()));
}

// Minimal valid uncompressed 24-bit BMP, 4x4 px, solid color.
function buildBmp() {
  const width = 4, height = 4, bpp = 24;
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);
  buf.write('BM', 0); buf.writeUInt32LE(fileSize, 2); buf.writeUInt32LE(54, 10);
  buf.writeUInt32LE(40, 14); buf.writeInt32LE(width, 18); buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26); buf.writeUInt16LE(bpp, 28); buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const off = 54 + y * rowSize + x * 3;
      buf[off] = 0x20; buf[off + 1] = 0x60; buf[off + 2] = 0xd0; // BGR orange-ish blue
    }
  }
  w('sample.bmp', buf);
}

// Minimal valid ICO wrapping the BMP-style bitmap data (1 image, 16x16, 24bpp + AND mask).
function buildIco() {
  const size = 16, bpp = 24;
  const rowSize = Math.floor((bpp * size + 31) / 32) * 4;
  const andRowSize = Math.floor((size + 31) / 32) * 4;
  const imgDataSize = 40 + rowSize * size + andRowSize * size;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const dirEntry = Buffer.alloc(16);
  dirEntry.writeUInt8(size, 0); dirEntry.writeUInt8(size, 1); dirEntry.writeUInt8(0, 2); dirEntry.writeUInt8(0, 3);
  dirEntry.writeUInt16LE(1, 4); dirEntry.writeUInt16LE(bpp, 6);
  dirEntry.writeUInt32LE(imgDataSize, 8); dirEntry.writeUInt32LE(22, 12);
  const img = Buffer.alloc(imgDataSize);
  img.writeUInt32LE(40, 0); img.writeInt32LE(size, 4); img.writeInt32LE(size * 2, 8);
  img.writeUInt16LE(1, 12); img.writeUInt16LE(bpp, 14);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const off = 40 + y * rowSize + x * 3;
    img[off] = 0x40; img[off + 1] = 0x90; img[off + 2] = 0xe0;
  }
  w('sample.ico', Buffer.concat([header, dirEntry, img]));
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (crc ^ buf[i]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Minimal store-only (uncompressed) ZIP writer supporting multiple entries —
// valid per the PKZIP spec, and reused for both the plain .zip fixture and
// the .epub fixture (an EPUB is a ZIP with a fixed internal structure).
function buildStoreZip(entries) {
  const localParts = [], centralParts = [];
  let offset = 0;
  for (const { name: rawName, data } of entries) {
    const name = Buffer.from(rawName);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    localParts.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8); central.writeUInt16LE(0, 10); central.writeUInt16LE(0, 12);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + data.length;
  }
  const centralStart = offset;
  const centralSize = centralParts.reduce((n, b) => n + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralSize, 12); eocd.writeUInt32LE(centralStart, 16);
  return Buffer.concat([...localParts, ...centralParts, eocd]);
}

function buildZip() {
  w('sample.zip', buildStoreZip([{ name: 'sample.txt', data: Buffer.from('Audit fixture inside a zip.\n') }]));
}

function buildEpub() {
  const containerXml = `<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
  const contentOpf = `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Audit Fixture</dc:title><dc:language>en</dc:language><dc:identifier id="BookId">audit-fixture-epub</dc:identifier></metadata><manifest><item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/></manifest><spine toc="ncx"><itemref idref="ch1"/></spine></package>`;
  const tocNcx = `<?xml version="1.0"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head><meta name="dtb:uid" content="audit-fixture-epub"/></head><docTitle><text>Audit Fixture</text></docTitle><navMap><navPoint id="n1"><navLabel><text>Chapter 1</text></navLabel><content src="chapter1.xhtml"/></navPoint></navMap></ncx>`;
  const chapter = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Audit Fixture</h1><p>Sample chapter text.</p></body></html>`;
  w('sample.epub', buildStoreZip([
    { name: 'mimetype', data: Buffer.from('application/epub+zip') },
    { name: 'META-INF/container.xml', data: Buffer.from(containerXml) },
    { name: 'OEBPS/content.opf', data: Buffer.from(contentOpf) },
    { name: 'OEBPS/toc.ncx', data: Buffer.from(tocNcx) },
    { name: 'OEBPS/chapter1.xhtml', data: Buffer.from(chapter) },
  ]));
}

// USTAR-format tar archive, one small text file, no compression.
function buildTar() {
  const content = Buffer.from('Audit fixture inside a tar.\n');
  const header = Buffer.alloc(512);
  header.write('sample.txt', 0);
  header.write('0000644\0', 100); // mode
  header.write('0000000\0', 108); // uid
  header.write('0000000\0', 116); // gid
  header.write(content.length.toString(8).padStart(11, '0') + '\0', 124); // size (octal)
  header.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0', 136); // mtime
  header.write('        ', 148); // checksum placeholder (spaces while computing)
  header.write('0', 156); // typeflag: normal file
  header.write('ustar\0', 257); header.write('00', 263); // ustar magic/version
  let sum = 0;
  for (let i = 0; i < 512; i++) sum += header[i];
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  const paddedContentLen = Math.ceil(content.length / 512) * 512;
  const contentBlock = Buffer.alloc(paddedContentLen);
  content.copy(contentBlock);
  const end = Buffer.alloc(1024); // two zero blocks terminator
  w('sample.tar', Buffer.concat([header, contentBlock, end]));
}

(async () => {
  await buildPdf();
  await buildDocx();
  buildXlsxAndCsv();
  buildTextFormats();
  buildWav();
  buildGif();
  buildBmp();
  buildIco();
  buildZip();
  buildEpub();
  buildTar();
  console.log('Node-buildable fixtures done ->', OUT);
})();
