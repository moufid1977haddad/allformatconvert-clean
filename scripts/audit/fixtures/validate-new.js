const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const FILES = path.join(__dirname, 'files');

(async () => {
  // TIFF: decode via Chromium's own <img> (Chromium supports TIFF natively? -- it does NOT
  // in stock Chromium, so validate structurally instead: check tag count/IFD offsets parse back out.
  const tiffBuf = fs.readFileSync(path.join(FILES, 'sample.tiff'));
  const byteOrder = tiffBuf.toString('ascii', 0, 2);
  const magic = tiffBuf.readUInt16LE(2);
  const ifdOffset = tiffBuf.readUInt32LE(4);
  const entryCount = tiffBuf.readUInt16LE(ifdOffset);
  console.log('TIFF: byteOrder=', byteOrder, 'magic=', magic, '(expect 42) ifdOffset=', ifdOffset, 'entryCount=', entryCount);
  let width, height;
  for (let i = 0; i < entryCount; i++) {
    const eOff = ifdOffset + 2 + i * 12;
    const tag = tiffBuf.readUInt16LE(eOff);
    const value = tiffBuf.readUInt32LE(eOff + 8);
    if (tag === 256) width = value;
    if (tag === 257) height = value;
  }
  console.log('TIFF: parsed width=', width, 'height=', height);

  // PPTX: parse with JSZip and confirm required parts exist + XML is well-formed (parses via DOMParser in-browser).
  const JSZip = require('jszip');
  const pptxZip = await JSZip.loadAsync(fs.readFileSync(path.join(FILES, 'sample.pptx')));
  const requiredParts = ['[Content_Types].xml', '_rels/.rels', 'ppt/presentation.xml', 'ppt/slides/slide1.xml'];
  for (const p of requiredParts) {
    console.log('PPTX has', p, ':', !!pptxZip.files[p]);
  }

  // AVI: check RIFF/AVI magic + LIST hdrl/movi chunk presence.
  const aviBuf = fs.readFileSync(path.join(FILES, 'sample.avi'));
  console.log('AVI: RIFF magic=', aviBuf.toString('ascii', 0, 4), 'form type=', aviBuf.toString('ascii', 8, 12));
  console.log('AVI: has hdrl LIST=', aviBuf.includes('hdrl'), 'has movi LIST=', aviBuf.includes('movi'), 'has strh=', aviBuf.includes('strh'), 'has strf=', aviBuf.includes('strf'));

  // Cross-check the XML parts of the pptx actually parse as XML using a real browser DOMParser.
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const slideXml = await pptxZip.file('ppt/slides/slide1.xml').async('string');
  const presoXml = await pptxZip.file('ppt/presentation.xml').async('string');
  const results = await page.evaluate(([slideXml, presoXml]) => {
    const parse = (xml) => {
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const err = doc.querySelector('parsererror');
      return err ? 'PARSE ERROR: ' + err.textContent.slice(0, 200) : 'OK';
    };
    return { slide: parse(slideXml), presentation: parse(presoXml) };
  }, [slideXml, presoXml]);
  console.log('PPTX slide1.xml well-formed:', results.slide);
  console.log('PPTX presentation.xml well-formed:', results.presentation);
  await browser.close();
})();
