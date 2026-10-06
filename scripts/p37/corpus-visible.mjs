// P37 seventh review (S1) — would the new "term still visible on a blacked-out page" check refuse real files wrongly?
// For each PDF of a folder (first pages), the words pdftotext reads on a page are taken as terms; for each word pass 1
// finds on that page (confirmedTermSpans or glyphTermMatches), the page's black boxes are computed as the page does
// (scripts/p35/harness.mjs pageGeometry, redactionQuads + glyphTermQuads) and visibleTermLeft is asked whether the word
// can still be read outside them. A "yes" is a refusal: listed, to be looked at (a real miss of pass 1, or a false
// refusal).
//   node scripts/p37/corpus-visible.mjs <dir> [--pages=4] [--words=12] [--minlen=4]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const R = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfRedact.js')).href);
const { pageGeometry } = await import(pathToFileURL(path.join(ROOT, 'scripts/p35/harness.mjs')).href);
const { withActualTextUnicode } = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfActualText.js')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
const PAGES = +arg('pages', 4), WORDS = +arg('words', 12), MINLEN = +arg('minlen', 4);
const pick = (arr, n) => { const out = []; const step = Math.max(1, Math.floor(arr.length / n)); for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]); return out; };
const helv = { real: false, width: (s) => s.length * 55 };
let tried = 0, refused = 0;
const ex = [];
for (const f of fs.readdirSync(dir).filter((x) => x.toLowerCase().endsWith('.pdf'))) {
  const file = path.join(dir, f);
  let doc;
  try { const ab = fs.readFileSync(file); doc = await pdfjsLib.getDocument({ data: new Uint8Array(await withActualTextUnicode(ab.buffer.slice(ab.byteOffset, ab.byteOffset + ab.length))), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise; } catch { continue; }
  for (let i = 1; i <= Math.min(doc.numPages, PAGES); i++) {
    let txt = '';
    try { txt = execFileSync('pdftotext', ['-enc', 'UTF-8', '-f', String(i), '-l', String(i), file, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch { /* none */ }
    const words = pick([...new Set((txt.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu) || []).filter((w) => R.norm(w).length >= MINLEN))], WORDS);
    if (!words.length) continue;
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    for (const it of content.items) if (typeof it.str === 'string' && /\p{M}/u.test(it.str)) it.str = it.str.normalize('NFC');
    const items = content.items.filter((it) => typeof it.str === 'string');
    let geo;
    try { geo = await pageGeometry(page, items, content.styles); } catch { continue; }
    for (const w of words) {
      const spans = R.confirmedTermSpans(items, [w], geo.glyphs);
      if (!spans.length && !R.glyphTermMatches(geo.glyphs, [w]).length) continue;
      tried++;
      const quads = [...R.redactionQuads(items, content.styles, spans, [], () => helv, geo.geometry, 0.5), ...R.glyphTermQuads(geo.glyphs, [w], geo.inkOf, 0.5)];
      if (R.visibleTermLeft(geo.glyphs, quads, [w])) { refused++; ex.push(`${f} p${i} « ${w} »`); }
    }
  }
  await doc.destroy();
}
console.log(`${path.basename(dir)}: ${tried} words found by pass 1, refused by the visible-glyph check: ${refused}`);
for (const e of ex.slice(0, 40)) console.log('  ' + e);
