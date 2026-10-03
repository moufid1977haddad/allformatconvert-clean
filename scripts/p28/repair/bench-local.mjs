// P28: services/pdf-tools/src/repair.js run IN THIS PROCESS on every damaged PDF (no network), with local binaries
// (QPDF_BIN, GS_BIN, PDFTOTEXT_BIN env vars). For each file: the method used, and whether the repaired file's text is
// the text of the ORIGINAL undamaged PDF and of the damaged source as Ghostscript (txtwrite) and Poppler (pdftotext)
// can read it -- a repair must never deliver altered text silently.
//   node scripts/p28/repair/bench-local.mjs <damaged-dir> <originals-dir> [--out=<dir>]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { repairPdf } = require('../../../services/pdf-tools/src/repair.js');
const [dir, origDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const out = process.argv.find((a) => a.startsWith('--out='))?.split('=')[1];
if (out) fs.mkdirSync(out, { recursive: true });
const GS = process.env.GS_BIN || 'gs';
const PDFTOTEXT = process.env.PDFTOTEXT_BIN || 'pdftotext';
const LAYOUT = /[ \t\n\r\f\v]+/g;
function read(file) {
  const t = {};
  try { t.pp = execFileSync(PDFTOTEXT, ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60000 }); } catch { t.pp = null; }
  const gsOut = path.join(os.tmpdir(), `p28-${process.pid}-${path.basename(file)}.gs.txt`); // never next to the corpus
  try { execFileSync(GS, ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=txtwrite', `-sOutputFile=${gsOut}`, file], { stdio: 'ignore', timeout: 60000 }); t.gs = fs.readFileSync(gsOut, 'utf8'); } catch { t.gs = null; }
  return t;
}
const same = (a, b) => a !== null && b !== null && a.replace(LAYOUT, '') === b.replace(LAYOUT, '');
const tally = {};
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.pdf')).sort()) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'p28-rep-'));
  fs.copyFileSync(path.join(dir, f), path.join(work, 'input.pdf'));
  const t0 = Date.now();
  const r = await repairPdf(work, new AbortController().signal);
  const ms = Date.now() - t0;
  let verdict;
  if (!r.ok) verdict = `REFUSED ${(r.error || '').slice(0, 70)}`;
  else {
    const orig = read(path.join(origDir, f.split('__')[0] + '.pdf'));
    const src = read(path.join(work, 'input.pdf'));
    const got = read(r.outputPath);
    const vsOrig = `orig pp:${same(orig.pp, got.pp) ? '=' : '≠'} gs:${same(orig.gs, got.gs) ? '=' : '≠'}`;
    const vsSrc = `src pp:${src.pp === null ? 'unreadable' : same(src.pp, got.pp) ? '=' : '≠'} gs:${src.gs === null ? 'unreadable' : same(src.gs, got.gs) ? '=' : '≠'}`;
    verdict = `${r.method} ${r.message || ''}| ${vsOrig} | ${vsSrc}${r.textCheck ? ' | check ' + r.textCheck : ''}`;
    if (out) fs.copyFileSync(r.outputPath, path.join(out, f));
  }
  const key = verdict.replace(/REFUSED.*/, 'REFUSED').replace(/\|.*$/, '').trim() + (verdict.includes('≠') ? ' (text differs somewhere)' : '');
  tally[key] = (tally[key] || 0) + 1;
  console.log(`${f} ${ms} ms -> ${verdict}`);
  fs.rmSync(work, { recursive: true, force: true });
}
console.log('TALLY', JSON.stringify(tally, null, 1));
