// P37 third review (R3): memory kept by PDF Redact's pass 1 (text + glyph search on every page), without and with
// page.cleanup() on the pages without a match (what the page now does). Node, garbage collected before each measure.
//   node --expose-gc scripts/p37/pass1-cleanup-cost.mjs [pdf] (default: %TEMP%\p37-review-redact\big-300.pdf, made by
//   scripts/p37/review/pass1-cost.mjs)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const R = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfRedact.js')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const file = process.argv[2] || path.join(os.tmpdir(), 'p37-review-redact', 'big-300.pdf');
if (!globalThis.gc) { console.log('run with node --expose-gc'); process.exit(1); }
const heap = () => { globalThis.gc(); globalThis.gc(); return process.memoryUsage().heapUsed / 1048576; };

for (const cleanup of [false, true]) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, verbosity: 0 }).promise;
  const m0 = heap();
  const t0 = performance.now();
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const glyphs = await R.pageGlyphs(page, pdfjsLib);
    const hit = R.glyphTermMatches(glyphs, ['ZORGLUB-77', 'مارس']).length || R.confirmedTermSpans(content.items, ['ZORGLUB-77', 'مارس'], glyphs).length;
    if (!hit && cleanup) page.cleanup();
  }
  const t = (performance.now() - t0) / 1000;
  console.log(`${path.basename(file)} ${doc.numPages} pages, ${cleanup ? 'with' : 'without'} page.cleanup(): pass 1 ${t.toFixed(1)} s, heap kept +${(heap() - m0).toFixed(0)} MB`);
  await doc.destroy();
}
