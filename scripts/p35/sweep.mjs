// P35 (05/10) — false-refusal sweep of the P33 review (round 3), with the text layer: every PDF of a corpus list, ~40
// words each (6 words found on one page only, the 3 most frequent, and words found in PDF internals: Adobe, Identity,
// Calibri…), redacted by scripts/p35/harness.mjs (Node replay WITH the invisible text layer); counts ok / REFUSED /
// nomatch and checks pdftotext of every output for the term (leak).
//   node scripts/p35/sweep.mjs <corpus.txt> [<root of the paths>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { redact } = await import(pathToFileURL(path.join(HERE, 'harness.mjs')).href);
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const base = process.argv[3] || ROOT;
const files = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const COMMON = ['the', 'Adobe', 'Identity', 'Table', 'Header', 'Footer', 'Figure', 'Page', 'Calibri', 'Arial', 'Times', 'Normal', 'Title', 'Heading', 'Microsoft', 'LibreOffice', 'Document', 'Image', 'Span', 'Artifact', 'Layout', 'Text', 'Bold', 'Sheet', 'Slide', 'Link', 'http', 'www', 'Contents', 'Annot'];
const norm = (s) => s.normalize('NFKD').replace(/[\p{M}¨´]/gu, '').toLowerCase().replace(/\s+/g, '').replace(/[-­‐-―−]/g, '');
const OUT = path.join(process.env.TEMP || '.', 'p35-sweep-out.pdf');
const tally = { ok: 0, REFUSED: 0, nomatch: 0, error: 0, leaks: 0, keptWords: 0, redactedPages: 0 };
for (const f of files) {
  const file = path.resolve(base, f);
  let words;
  try {
    const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
    const perPage = [];
    for (let i = 1; i <= Math.min(doc.numPages, 60); i++) { const tc = await (await doc.getPage(i)).getTextContent(); perPage.push(new Set(tc.items.map((x) => x.str).join(' ').match(/[\p{L}][\p{L}\p{N}'-]{3,}/gu) || [])); }
    const count = new Map(); perPage.forEach((s) => s.forEach((w) => count.set(w, (count.get(w) || 0) + 1)));
    words = [...new Set([...[...count].filter(([, c]) => c === 1).map(([w]) => w).slice(0, 6), ...[...count].sort((a, b) => b[1] - a[1]).map(([w]) => w).slice(0, 3), ...COMMON])];
    await doc.destroy();
  } catch (e) { console.log('ERR open', f, e.message); continue; }
  for (const t of words) {
    try {
      const r = await redact(file, [t]);
      tally[r.status]++;
      if (r.status === 'REFUSED') console.log('REFUSED', f, JSON.stringify(t), r.reason, 'hits', r.hits.join(','), '/', r.pages);
      if (r.bytes) {
        fs.writeFileSync(OUT, r.bytes);
        if (norm(execFileSync('pdftotext', [OUT, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString()).includes(norm(t))) { tally.leaks++; console.log('LEAK', f, JSON.stringify(t)); }
      }
      if (r.kept) for (const n of Object.values(r.kept)) { tally.keptWords += n; tally.redactedPages++; }
    } catch (e) { tally.error++; console.log('ERROR', f, t, e.message.slice(0, 120)); }
  }
  console.log('done', f, words.length, 'terms');
}
console.log(JSON.stringify(tally));
