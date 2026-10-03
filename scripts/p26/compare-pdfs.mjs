// P26: are two runs of the same conversions the same document? For every PDF of <dir-a> also in <dir-b>: page
// count, page sizes, text (pdftotext -layout) and every page rendered at 72 dpi (pdftoppm, raw pixels) must match.
// Dates and document IDs inside the file are expected to differ and are not compared.
//   node scripts/p26/compare-pdfs.mjs <dir-a> <dir-b> [name-filter-regex]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

const [a, b, filter] = process.argv.slice(2);
const re = filter ? new RegExp(filter) : /^(?!ssrf-).*\.pdf$/;
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 256 << 20 });
const info = (f) => run('pdfinfo', [f]).split(/\r?\n/).filter((l) => /^(Pages|Page size)/.test(l)).join(' ; ');
function pages(f) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'p26-cmp-'));
  execFileSync('pdftoppm', ['-r', '72', '-gray', f, path.join(d, 'p')]);
  return fs.readdirSync(d).sort().map((n) => crypto.createHash('sha256').update(fs.readFileSync(path.join(d, n))).digest('hex'));
}
let same = 0, diff = 0;
for (const n of fs.readdirSync(a).filter((x) => re.test(x)).sort()) {
  const fa = path.join(a, n), fb = path.join(b, n);
  if (!fs.existsSync(fb)) { console.log(`MISSING ${n} in ${b}`); diff++; continue; }
  const ia = info(fa), ib = info(fb);
  const ta = run('pdftotext', ['-layout', fa, '-']), tb = run('pdftotext', ['-layout', fb, '-']);
  const pa = pages(fa), pb = pages(fb);
  const px = pa.length === pb.length ? pa.filter((h, i) => h !== pb[i]).length : -1;
  const ok = ia === ib && ta === tb && px === 0;
  ok ? same++ : diff++;
  console.log(`${ok ? 'SAME' : 'DIFF'} ${n} | ${ia} | text ${ta === tb ? 'equal' : 'DIFFERENT'} (${ta.length} chars) | pages rendered ${pa.length}, differing ${px}`);
}
console.log(`compare: ${same} same, ${diff} different`);
process.exit(diff ? 1 : 0);
