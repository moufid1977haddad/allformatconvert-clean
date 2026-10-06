// P37 review n° 6: real PDFs, word by word. For each page, words read by pdftotext (-enc UTF-8, the "truth" a reader
// copies) are taken as terms, and the page code's detectors are run as the page does (app/lib/pdfRedact.js):
//   found   = pass 1 finds it (confirmedTermSpans on PDF.js text, or glyphTermMatches) → the page is blacked out;
//   refused = pass 1 misses it but the final check's readingOrderHit sees it → the file is refused (no leak, no file);
//   missed  = neither → the word stays readable: "No match found" alone, a SILENT LEAK with another term found elsewhere.
// Also false refusals: a word found on its own page, seen by readingOrderHit on ANOTHER page where pdftotext does not
// read it as a word and pass 1 does not find it (a join across columns / cells / lines) → the file would be refused.
//   node scripts/p37/review/corpus-words.mjs <dir with PDFs> [--pages=4] [--words=12] [--minlen=4]
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const R = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfRedact.js')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
const PAGES = +arg('pages', 4), WORDS = +arg('words', 12), MINLEN = +arg('minlen', 4);
const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf'));
const tot = { words: 0, found: 0, refused: 0, missed: 0, falseRefusal: 0 };
const missedEx = [], refusedEx = [], falseEx = [];
const pick = (arr, n) => { const out = []; const step = Math.max(1, Math.floor(arr.length / n)); for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]); return out; };
for (const f of files) {
  const file = path.join(dir, f);
  let doc;
  try { doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, verbosity: 0 }).promise; } catch { continue; }
  const n = Math.min(doc.numPages, PAGES);
  const pages = [];
  for (let i = 1; i <= n; i++) {
    let txt = '';
    try { txt = execFileSync('pdftotext', ['-enc', 'UTF-8', '-f', String(i), '-l', String(i), file, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* none */ }
    const page = await doc.getPage(i);
    const items = (await page.getTextContent()).items.filter((it) => typeof it.str === 'string');
    let glyphs = [];
    try { glyphs = await R.pageGlyphs(page, pdfjsLib); } catch { glyphs = []; }
    const words = [...new Set(txt.replace(/[‎‏‪-‮⁦-⁩]/g, ' ').replace(/(\p{Script=Arabic})(?=[\p{N}\p{Script=Latin}])|([\p{N}\p{Script=Latin}])(?=\p{Script=Arabic})/gu, '$1$2 ').split(/\s+/).map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')).filter((w) => R.norm(w).length >= MINLEN))];
    pages.push({ i, items, glyphs, words: new Set(words.map(R.norm)), sample: pick(words, WORDS) });
  }
  const detect = (pg, w) => R.confirmedTermSpans(pg.items, [w], pg.glyphs).length > 0 || R.glyphTermMatches(pg.glyphs, [w]).length > 0;
  let fw = 0, ff = 0, fr = 0, fm = 0, fx = 0;
  for (const pg of pages) {
    for (const w of pg.sample) {
      fw++;
      if (detect(pg, w)) {
        ff++;
        // the same word, on the other pages: would the final check refuse the file?
        for (const other of pages) {
          if (other === pg || other.words.has(R.norm(w)) || detect(other, w)) continue;
          if (R.readingOrderHit(other.glyphs, [w])) { fx++; if (falseEx.length < 12) falseEx.push(`${f} p${other.i} « ${w} » (found p${pg.i})`); }
        }
      } else if (R.readingOrderHit(pg.glyphs, [w])) { fr++; if (refusedEx.length < 12) refusedEx.push(`${f} p${pg.i} « ${w} »`); }
      else { fm++; if (missedEx.length < 25) missedEx.push(`${f} p${pg.i} « ${w} »`); }
    }
  }
  tot.words += fw; tot.found += ff; tot.refused += fr; tot.missed += fm; tot.falseRefusal += fx;
  console.log(`${f}: ${n} p, ${fw} words — found ${ff}, refused ${fr}, MISSED ${fm}, false refusals ${fx}`);
  await doc.destroy();
}
console.log(`\nTOTAL ${JSON.stringify(tot)}`);
console.log(`missed (examples):\n  ${missedEx.join('\n  ')}`);
console.log(`refused (examples):\n  ${refusedEx.join('\n  ')}`);
console.log(`false refusals (examples):\n  ${falseEx.join('\n  ')}`);
