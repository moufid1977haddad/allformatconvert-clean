// P27: app/lib/pdfActualText.js (the in-browser ActualText -> ToUnicode pass) on the permanent PDF corpus, in Node with
// the same pdf-lib and PDF.js the site ships. For every PDF: does the pass change anything, and what PDF.js reads before
// and after, word for word against Poppler's pdftotext (which reads ActualText: the reference). A file the pass changes
// must read CLOSER to the reference and never further; a file it does not change must come back as the same bytes.
//   node scripts/p27/actualtext-browser.test.mjs [dir=scripts/p27/pdfa-corpus] [extra.pdf ...]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { withActualTextUnicode } from '../../app/lib/pdfActualText.js';

const POPPLER = process.env.POPPLER_PDFTOTEXT || 'C:/Users/moufi/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdftotext.exe';
const [dirArg, ...extra] = process.argv.slice(2);
const dir = dirArg || 'scripts/p27/pdfa-corpus';
const files = [...fs.readdirSync(dir).filter((f) => f.endsWith('.pdf')).map((f) => path.join(dir, f)), ...extra];

const words = (t) => t.normalize('NFC').split(/\s+/).filter(Boolean);
async function pdfjsWords(bytes) {
  const doc = await getDocument({ data: new Uint8Array(bytes), verbosity: 0, isEvalSupported: false }).promise;
  let out = '';
  for (let i = 1; i <= doc.numPages; i++) out += (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str + (x.hasEOL ? '\n' : '')).join('') + '\n';
  await doc.destroy();
  return words(out);
}
// a word of PDF.js that Poppler (the reference) does not have: a misread word (reading order aside)
const misread = (w, ref) => { const set = new Set(ref); return w.filter((x) => !set.has(x)).length; };

let pass = 0, fail = 0, changed = 0;
for (const f of files) {
  const original = fs.readFileSync(f);
  let ref = null;
  try { ref = words(execFileSync(POPPLER, ['-enc', 'UTF-8', f, '-'], { encoding: 'utf8', maxBuffer: 64 << 20 })); } catch { /* encrypted for Poppler */ }
  const out = await withActualTextUnicode(new Uint8Array(original));
  const same = out.length === original.length && Buffer.from(out).equals(original);
  if (same) { pass++; console.log(`PASS unchanged ${path.basename(f)}`); continue; }
  changed++;
  if (!ref) { fail++; console.log(`FAIL ${path.basename(f)}: changed but no reference text`); continue; }
  const before = misread(await pdfjsWords(original), ref);
  const after = misread(await pdfjsWords(out), ref);
  const ok = after < before;
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} changed ${path.basename(f)}: PDF.js words not in the reference ${before} -> ${after} (of ${ref.length})`);
}
console.log(`actualtext-browser: ${pass} pass, ${fail} fail (${changed} changed)`);
process.exit(fail ? 1 : 0);
