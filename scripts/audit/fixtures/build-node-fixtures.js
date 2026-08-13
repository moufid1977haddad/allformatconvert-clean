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

// Minimal uncompressed TIFF: 4x4 RGB, one strip, little-endian.
function buildTiff() {
  const width = 4, height = 4, samplesPerPixel = 3, bitsPerSample = 8;
  const pixelDataSize = width * height * samplesPerPixel;
  const ifdEntryCount = 8;
  const headerSize = 8;
  const ifdOffset = headerSize;
  const ifdSize = 2 + ifdEntryCount * 12 + 4;
  const pixelDataOffset = ifdOffset + ifdSize;
  const buf = Buffer.alloc(pixelDataOffset + pixelDataSize);
  buf.write('II', 0); buf.writeUInt16LE(42, 2); buf.writeUInt32LE(ifdOffset, 4);
  let off = ifdOffset;
  buf.writeUInt16LE(ifdEntryCount, off); off += 2;
  const entry = (tag, type, count, value) => {
    buf.writeUInt16LE(tag, off); buf.writeUInt16LE(type, off + 2); buf.writeUInt32LE(count, off + 4);
    if (type === 3 && count === 1) buf.writeUInt16LE(value, off + 8); else buf.writeUInt32LE(value, off + 8);
    off += 12;
  };
  entry(256, 3, 1, width);              // ImageWidth
  entry(257, 3, 1, height);             // ImageLength
  entry(258, 3, 1, bitsPerSample);      // BitsPerSample (single value applies to all samples here)
  entry(259, 3, 1, 1);                  // Compression = none
  entry(262, 3, 1, 2);                  // PhotometricInterpretation = RGB
  entry(273, 4, 1, pixelDataOffset);    // StripOffsets
  entry(277, 3, 1, samplesPerPixel);    // SamplesPerPixel
  entry(279, 4, 1, pixelDataSize);      // StripByteCounts
  buf.writeUInt32LE(0, off);            // next IFD offset (none)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = pixelDataOffset + (y * width + x) * 3;
      buf[p] = 0x30 + x * 20; buf[p + 1] = 0x60; buf[p + 2] = 0xb0 - y * 10;
    }
  }
  w('sample.tiff', buf);
}

// Minimal PPTX: a single-slide OOXML package built on the same store-only
// zip writer as the EPUB fixture. PowerPoint/LibreOffice-family parsers
// need every one of these parts present, even for one blank slide.
function buildPptx() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
  const presentationXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rIdMaster1"/></p:sldMasterIdLst>
<p:sldIdLst><p:sldId id="256" r:id="rIdSlide1"/></p:sldIdLst>
<p:sldSz cx="9144000" cy="6858000"/>
<p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
  const presentationRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
<Relationship Id="rIdSlide1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
<Relationship Id="rIdTheme1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
  const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr/>
<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr>
<p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Audit Fixture</a:t></a:r></a:p></p:txBody></p:sp>
</p:spTree></p:cSld>
<p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sld>`;
  const slideRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`;
  const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr/>
</p:spTree></p:cSld>
<p:clrMapOvr><a:overrideClrMapping bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/></p:clrMapOvr>
</p:sldLayout>`;
  const slideLayoutRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`;
  const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr/>
</p:spTree></p:cSld>
<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`;
  const slideMasterRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`;
  const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Audit Theme">
<a:themeElements>
<a:clrScheme name="Audit"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
<a:dk2><a:srgbClr val="1F497D"/></a:dk2><a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
<a:accent1><a:srgbClr val="4F81BD"/></a:accent1><a:accent2><a:srgbClr val="C0504D"/></a:accent2>
<a:accent3><a:srgbClr val="9BBB59"/></a:accent3><a:accent4><a:srgbClr val="8064A2"/></a:accent4>
<a:accent5><a:srgbClr val="4BACC6"/></a:accent5><a:accent6><a:srgbClr val="F79646"/></a:accent6>
<a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink></a:clrScheme>
<a:fontScheme name="Audit"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Audit"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
</a:themeElements>
</a:theme>`;
  const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:title>Audit Fixture</dc:title></cp:coreProperties>`;
  const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>audit-fixture</Application></Properties>`;
  w('sample.pptx', buildStoreZip([
    { name: '[Content_Types].xml', data: Buffer.from(contentTypes) },
    { name: '_rels/.rels', data: Buffer.from(rootRels) },
    { name: 'ppt/presentation.xml', data: Buffer.from(presentationXml) },
    { name: 'ppt/_rels/presentation.xml.rels', data: Buffer.from(presentationRels) },
    { name: 'ppt/slides/slide1.xml', data: Buffer.from(slideXml) },
    { name: 'ppt/slides/_rels/slide1.xml.rels', data: Buffer.from(slideRels) },
    { name: 'ppt/slideLayouts/slideLayout1.xml', data: Buffer.from(slideLayoutXml) },
    { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: Buffer.from(slideLayoutRels) },
    { name: 'ppt/slideMasters/slideMaster1.xml', data: Buffer.from(slideMasterXml) },
    { name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', data: Buffer.from(slideMasterRels) },
    { name: 'ppt/theme/theme1.xml', data: Buffer.from(themeXml) },
    { name: 'docProps/core.xml', data: Buffer.from(coreXml) },
    { name: 'docProps/app.xml', data: Buffer.from(appXml) },
  ]));
}

// Minimal uncompressed (RGB24 DIB) AVI: RIFF/AVI container, 2 frames, no
// video codec needed since uncompressed frames are a valid "Video for
// Windows" stream any AVI-capable decoder (ffmpeg included) can read.
function buildAvi() {
  const width = 16, height = 16, fps = 10, frameCount = 2;
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const frameSize = rowSize * height;
  const makeFrame = (r, g, b) => {
    const buf = Buffer.alloc(frameSize);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const off = y * rowSize + x * 3;
      buf[off] = b; buf[off + 1] = g; buf[off + 2] = r;
    }
    return buf;
  };
  const frames = [makeFrame(0x20, 0x60, 0xd0), makeFrame(0xd0, 0x60, 0x20)];

  const fourcc = (s) => Buffer.from(s, 'ascii');
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0, 0); return b; };
  const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n, 0); return b; };

  const avih = Buffer.concat([
    u32(Math.round(1000000 / fps)), u32(frameSize * fps), u32(0), u32(0x10),
    u32(frameCount), u32(0), u32(1), u32(0),
    u32(width), u32(height), u32(0), u32(0), u32(0), u32(0),
  ]);
  const strh = Buffer.concat([
    fourcc('vids'), fourcc('DIB '), u32(0), u32(0), u32(0), u32(0),
    u32(1), u32(fps), u32(0), u32(frameCount), u32(frameSize * fps), u32(-1 >>> 0),
    u32(0), u32(0), u16(0), u16(0), u16(width), u16(height),
  ]);
  const strf = Buffer.concat([
    u32(40), u32(width), u32(height), u16(1), u16(24), u32(0), u32(frameSize),
    u32(0), u32(0), u32(0), u32(0),
  ]);

  const chunk = (id, data) => {
    const padded = data.length % 2 === 0 ? data : Buffer.concat([data, Buffer.from([0])]);
    return Buffer.concat([fourcc(id), u32(data.length), padded]);
  };
  const list = (type, ...chunks) => {
    const body = Buffer.concat([fourcc(type), ...chunks]);
    return Buffer.concat([fourcc('LIST'), u32(body.length), body]);
  };

  const strl = list('strl', chunk('strh', strh), chunk('strf', strf));
  const hdrl = list('hdrl', chunk('avih', avih), strl);
  const moviChunks = frames.map((f) => chunk('00db', f));
  const movi = list('movi', ...moviChunks);

  const riffBody = Buffer.concat([fourcc('AVI '), hdrl, movi]);
  w('sample.avi', Buffer.concat([fourcc('RIFF'), u32(riffBody.length), riffBody]));
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
  buildTiff();
  buildPptx();
  buildAvi();
  console.log('Node-buildable fixtures done ->', OUT);
})();
