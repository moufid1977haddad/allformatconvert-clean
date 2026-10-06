// P37 (06/10) — seventh review of PDF Redact (docs/audit/p37/relecture-redact.md, "Relecture n° 7"), S1: a term missed
// by pass 1 on a page blacked out for another term stayed readable on the picture. Through the Node replay of the page
// (scripts/p35/harness.mjs; --harness / --impl to run an older copy), « مارس » and the term on the SAME page:
//   ar5\s-wrap.pdf « شهر أبريل » (Chromium, wrapped)        → refused by the visible-glyph check (never delivered);
//   ar5\s-latin.pdf « شركة Microsoft » (Chromium)            → refused by the visible-glyph check itself (not by the layer);
//   ar3\s-lowrap.pdf, ar3\s-lolatin.pdf « شركة Microsoft » (LibreOffice) → still redacted, term gone from the file.
//   node scripts/p37/redact-review7.test.mjs [--harness=<harness.mjs>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const { redact } = await import(pathToFileURL(path.resolve(arg('harness', path.join(ROOT, 'scripts/p35/harness.mjs')))).href);
const RV = path.join(os.tmpdir(), 'p37-review-redact');
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩\s]/g, '');
const text = (bytes) => { const f = path.join(os.tmpdir(), `p37-review7-${process.pid}.pdf`); fs.writeFileSync(f, bytes); const t = execFileSync('pdftotext', ['-enc', 'UTF-8', f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); fs.rmSync(f); return t; };
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ` — ${info}` : ''}`); };
for (const [file, term, want] of [['ar5/s-wrap.pdf', 'شهر أبريل', 'visible'], ['ar5/s-latin.pdf', 'شركة Microsoft', 'visible'], ['ar3/s-lowrap.pdf', 'شركة Microsoft', 'ok'], ['ar3/s-lolatin.pdf', 'شركة Microsoft', 'ok']]) {
  const fp = path.join(RV, file);
  if (!fs.existsSync(fp)) { check(file, false, 'missing'); continue; }
  let r;
  try { r = await redact(fp, ['مارس', term]); } catch (e) { r = { status: 'ERROR', reason: e.message }; }
  const reason = r.reason || '';
  if (want === 'visible') check(`S1 ${file} [مارس + ${term}]: refused because the term stays visible`, r.status === 'REFUSED' && /can still be read on page/.test(reason), `status ${r.status}${reason ? ` (${reason})` : ''}`);
  else check(`S1 ${file} [مارس + ${term}]: redacted, term gone`, r.status === 'ok' && !N(text(r.bytes)).includes(N(term)) && !N(text(r.bytes)).includes(N('مارس')), `status ${r.status}${reason ? ` (${reason})` : ''}`);
}
console.log(`\n${fails ? `${fails} FAIL` : 'all PASS'}`);
process.exit(fails ? 1 : 0);
