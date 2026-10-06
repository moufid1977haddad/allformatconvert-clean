// P37 review n° 6: share of drawn glyphs whose text PDF.js cannot give (empty, control character, private use) per
// PDF — a page signal for "this page's text cannot be searched reliably". node scripts/p37/review/bad-unicode-share.mjs <dir>
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const R = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfRedact.js')).href);
const dir = process.argv[2];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.pdf'))) {
  try {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, f))), verbosity: 0 }).promise;
    let all = 0, bad = 0;
    for (let i = 1; i <= Math.min(4, doc.numPages); i++) {
      const g = await R.pageGlyphs(await doc.getPage(i), pdfjsLib);
      for (const x of g) { if (x.u === ' ') continue; all++; if (!x.u || /[\u0000-\u001f\u007f-\u009f-�]/.test(x.u)) bad++; }
    }
    console.log(`${f}\t${all}\t${(100 * bad / Math.max(1, all)).toFixed(1)} %`);
    await doc.destroy();
  } catch (e) { console.log(`${f}\tERROR ${e.message}`); }
}
