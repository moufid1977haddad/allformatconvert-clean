// P37 review: Arabic terms through the Node replay (scripts/p35/harness.mjs): lam-alef words, digits and Latin inside
// Arabic lines, sub-words; prints status, layer and whether pdftotext / raw streams still hold the term.
//   node scripts/p37/review/arabic-terms.mjs <pdf> "<term1>|<term2>" [kinds comma list]
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const { redact } = await import(pathToFileURL(path.join(ROOT, 'scripts/p35/harness.mjs')).href);
const [pdf, termsArg, kindsArg] = process.argv.slice(2);
const terms = termsArg.split('|').filter(Boolean), kinds = kindsArg ? kindsArg.split(',') : [];
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, '').toLowerCase();
const r = await redact(pdf, terms, kinds);
console.log('status', r.status, r.reason || '', 'exact', JSON.stringify(r.exact));
if (r.layer) console.log('layer', JSON.stringify(r.layer));
if (r.bytes) {
  const out = path.join(os.tmpdir(), 'p37-review-redact', `ar-${path.basename(pdf, '.pdf')}-${Date.now()}.pdf`);
  fs.writeFileSync(out, r.bytes);
  const txt = execFileSync('pdftotext', ['-enc', 'UTF-8', out, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  const lay = execFileSync('pdftotext', ['-layout', '-enc', 'UTF-8', out, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  for (const t of terms) console.log(`term ${t}: pdftotext ${N(txt).includes(N(t)) ? 'LEAK' : 'absent'}, -layout ${N(lay).includes(N(t)) ? 'LEAK' : 'absent'}, reversed ${N(txt).includes(N([...t].reverse().join(''))) ? 'LEAK?' : 'absent'}`);
  console.log('out', out);
}
