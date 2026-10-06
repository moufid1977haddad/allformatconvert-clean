// P37 review n° 3: cost of the pass-1 glyph search (pageGlyphs + glyphTermMatches) against getTextContent, in Node,
// on a large PDF. node scripts/p37/review/pass1-cost.mjs [pdf] (default: builds a 300-page dense text PDF)
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const lib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdf-lib/cjs/index.js')).href).then((m) => m.default || m);
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const N = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfRedact.js')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
let file = process.argv[2];
if (!file) {
  const d = await lib.PDFDocument.create(); const f = await d.embedFont('Times-Roman');
  const line = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.';
  for (let p = 0; p < 300; p++) { const pg = d.addPage([612, 792]); for (let l = 0; l < 60; l++) pg.drawText(line, { x: 40, y: 760 - l * 12, size: 9, font: f }); }
  file = path.join(os.tmpdir(), 'p37-review-redact', 'big-300.pdf'); fs.writeFileSync(file, await d.save());
}
const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, verbosity: 0 }).promise;
let tText = 0, tGlyph = 0, glyphsTotal = 0;
const m0 = process.memoryUsage().heapUsed;
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  let t = performance.now(); await page.getTextContent(); tText += performance.now() - t;
  t = performance.now(); const g = await N.pageGlyphs(page, pdfjsLib); N.glyphTermMatches(g, ['ZORGLUB-77', 'مارس']); tGlyph += performance.now() - t; glyphsTotal += g.length;
}
console.log(`${path.basename(file)}: ${doc.numPages} pages, ${glyphsTotal} glyphs; text ${(tText / 1000).toFixed(1)} s, glyph search ${(tGlyph / 1000).toFixed(1)} s (${(tGlyph / doc.numPages).toFixed(0)} ms/page); heap +${((process.memoryUsage().heapUsed - m0) / 1048576).toFixed(0)} MB`);
