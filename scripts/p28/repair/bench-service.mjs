// P28: every damaged PDF through the LIVE pdf-tools /v1/repair, the answer kept, and the delivered file's text compared
// HERE (local Ghostscript txtwrite and Poppler pdftotext) with what each reader reads in the damaged file and in the
// undamaged original -- the same verdicts as bench-local.mjs, against the real service.
//   node scripts/p26/with-pdftools-key.mjs PDFTOOLS_KEY node scripts/p28/repair/bench-service.mjs <damaged-dir> <originals-dir> <out-dir>
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [dir, origDir, out] = process.argv.slice(2);
const url = process.env.PDFTOOLS_LIVE_URL, key = process.env.PDFTOOLS_KEY;
fs.mkdirSync(out, { recursive: true });
const GS = process.env.GS_BIN || 'gs';
const LAYOUT = /[ \t\n\r\f\v]+/g;
function read(file) {
  const t = {};
  try { t.pp = execFileSync('pdftotext', ['-enc', 'UTF-8', file, '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 }); } catch { t.pp = null; }
  const gsOut = path.join(os.tmpdir(), `p28-${process.pid}-${path.basename(file)}.gs.txt`); // never next to the corpus
  try { execFileSync(GS, ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-sDEVICE=txtwrite', `-sOutputFile=${gsOut}`, file], { stdio: 'ignore', timeout: 120000 }); t.gs = fs.readFileSync(gsOut, 'utf8'); } catch { t.gs = null; }
  return t;
}
const same = (a, b) => a !== null && b !== null && a.replace(LAYOUT, '') === b.replace(LAYOUT, '');
const health = await fetch(`${url}/health`).then((r) => r.json());
console.log('health', JSON.stringify(Object.fromEntries(Object.entries(health.binaries).map(([k, v]) => [k, v.ok ? v.version : v.detail]))));
const tally = {};
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.pdf')).sort()) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(path.join(dir, f))]), f);
  const t0 = Date.now();
  const r = await fetch(`${url}/v1/repair`, { method: 'POST', headers: { 'X-API-Key': key }, body: fd, signal: AbortSignal.timeout(240000) });
  const j = JSON.parse(await r.text());
  const ms = Date.now() - t0;
  let verdict;
  if (!j.ok) verdict = `REFUSED ${r.status} ${(j.error || '').slice(0, 60)}`;
  else {
    const dest = path.join(out, f);
    fs.writeFileSync(dest, Buffer.from(j.file, 'base64'));
    const orig = read(path.join(origDir, f.split('__')[0] + '.pdf')), src = read(path.join(dir, f)), got = read(dest);
    const vsSrc = ['pp', 'gs'].map((k) => `${k}:${src[k] === null ? 'unreadable' : same(src[k], got[k]) ? '=' : '≠'}`).join(' ');
    const vsOrig = ['pp', 'gs'].map((k) => `${k}:${same(orig[k], got[k]) ? '=' : '≠'}`).join(' ');
    verdict = `${j.method}${j.textCheck ? ' ' + j.textCheck : ''} | src ${vsSrc} | orig ${vsOrig}`;
  }
  const altered = /src [^|]*≠/.test(verdict);
  const key2 = verdict.split(' |')[0].replace(/^REFUSED.*/, 'REFUSED') + (altered ? ' TEXT-ALTERED-VS-READABLE-SOURCE' : '');
  tally[key2] = (tally[key2] || 0) + 1;
  console.log(`${f} ${ms} ms -> ${verdict}`);
}
console.log('TALLY', JSON.stringify(tally, null, 1));
