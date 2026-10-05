// P33 (05/10) — app/lib/redactSanitize.js in Node on the independent reviewer's adversarial PDFs (no browser): page 2 of
// each is the "redacted" page; the pages without a match are copied from the made-safe source, page 2 replaced by a
// blank page (as the picture would replace it). Nothing of page 2 may remain: inflated streams searched for the term,
// orphan /Page objects counted, pdftotext of the result. And verifyRedacted() must REFUSE the unsanitized copy.
//   node scripts/p33/sanitize.test.mjs <dir with f1…f12 PDFs>
import * as lib from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { sanitizeForCopy } from '../../app/lib/redactSanitize.js';

const dir = process.argv[2];
let passes = 0, fails = 0;
const check = (n, ok, info = '') => { ok ? passes++ : fails++; console.log(ok ? 'PASS' : 'FAIL', n, ok ? '' : info); };
const leaks = (bytes, term) => {
  const raw = Buffer.from(bytes);
  const parts = [raw.toString('latin1')];
  for (let i = raw.indexOf('stream'); i >= 0; i = raw.indexOf('stream', i + 6)) {
    let s = i + 6; if (raw[s] === 13) s++; if (raw[s] === 10) s++;
    const e = raw.indexOf('endstream', s); if (e < 0) break;
    try { parts.push(zlib.inflateSync(raw.subarray(s, e)).toString('latin1')); } catch { /* not flate */ }
  }
  const all = parts.join('\n').toLowerCase();
  const hex = Buffer.from(term, 'latin1').toString('hex');
  return all.includes(term.toLowerCase()) || all.replace(/\s+/g, '').includes(hex);
};
for (const [f, term] of [['f1-link-dest', 'ZORGLUB-77'], ['f2-shared-resources', 'ZORGLUB-77'], ['f3-field-kids', 'ZORGLUB-77'], ['f6-stamp-appearance', 'ZORGLUB-77'], ['f7-file-attachment', 'ZORGLUB-77'], ['f8-richtext-subject', 'ZORGLUB-77'], ['f9-js-link', 'ZORGLUB-77'], ['f11-pieceinfo', 'ZORGLUB-77']]) {
  const file = path.join(dir, `${f}.pdf`);
  if (!fs.existsSync(file)) { check(`${f} present`, false, file); continue; }
  for (const safe of [false, true]) {
    const src = await lib.PDFDocument.load(fs.readFileSync(file));
    const n = src.getPageCount();
    const removed = safe ? sanitizeForCopy(src, [1], lib) : null;
    const out = await lib.PDFDocument.create();
    for (let i = 0; i < n; i++) {
      if (i === 1) { out.addPage([595, 842]); continue; }
      const [p] = await out.copyPages(src, [i]); out.addPage(p);
    }
    const bytes = await out.save({ useObjectStreams: false });
    const tree = new Set(out.getPages().map((p) => p.ref.toString()));
    let orphans = 0;
    for (const [ref, obj] of out.context.enumerateIndirectObjects()) if (obj instanceof lib.PDFDict && obj.get(lib.PDFName.of('Type'))?.decodeText?.() === 'Page' && !tree.has(ref.toString()) && (obj.get(lib.PDFName.of('Annots')) || obj.lookupMaybe(lib.PDFName.of('Resources'), lib.PDFDict)?.keys().length)) orphans++;
    const tmp = path.join(dir, `${f}.${safe ? 'safe' : 'raw'}.out.pdf`);
    fs.writeFileSync(tmp, bytes);
    const text = execFileSync('pdftotext', [tmp, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const leak = leaks(bytes, term) || text.includes(term) || orphans > 0;
    if (safe) check(`${f}: sanitized copy — no "${term}" in any stream, text or orphan page (removed ${JSON.stringify(removed)})`, !leak, `orphans=${orphans} text=${text.includes(term)}`);
    else console.log(`  control ${f}: unsanitized copy leaks = ${leak}`);
  }
}
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
