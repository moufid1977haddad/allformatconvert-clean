// P37 (06/10) — second review of PDF Redact (docs/audit/p37/relecture-redact.md, "Relecture n° 2"), end to end through
// the Node replay of the page (scripts/p35/harness.mjs; --harness=<another copy> to run an older version):
//   N4 a phrase PDF.js reads out of order or with its lam-alef reversed — « وبركاته لا إله إلا الله » alone, and with
//      « مارس » (found on another page): never "no match", never a file that still holds it (pdftotext);
//   N5 a lam-alef reading must not black out other names: « سلام » blacks out « السلام » but not « سالم » (Salem),
//      « فلاح » blacks out « الفلاح » but not « فالح » (Faleh) — no black box over their glyphs;
//   the form PDF.js reads comes first in termVariants (a long phrase kept it within the 64 forms).
// Fixtures: node scripts/p37/review/make-arabic-two-pages.mjs (%TEMP%\p37-review-redact\ar2) and
// node scripts/p37/make-arabic-fixtures.mjs (%TEMP%\p37-arabic\lo-Arial-names.pdf).
//   node scripts/p37/redact-review2.test.mjs [--harness=<harness.mjs>] [--impl=<pdfRedact.js>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const { redact } = await import(pathToFileURL(path.resolve(arg('harness', path.join(ROOT, 'scripts/p35/harness.mjs')))).href);
const R = await import(pathToFileURL(path.resolve(arg('impl', path.join(ROOT, 'app/lib/pdfRedact.js')))).href);
const pdfjs = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const TWO = path.join(os.tmpdir(), 'p37-review-redact', 'ar2', 'two-pages.pdf');
const NAMES = path.join(os.tmpdir(), 'p37-arabic', 'lo-Arial-names.pdf');
const N = (s) => s.normalize('NFKC').replace(/[ً-ٰٟـ‎‏‪-‮⁦-⁩\s]/g, '');
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ` — ${info}` : ''}`); };
const text = (bytes) => { const f = path.join(os.tmpdir(), `p37-review2-${process.pid}.pdf`); fs.writeFileSync(f, bytes); const t = execFileSync('pdftotext', ['-enc', 'UTF-8', f, '-'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); fs.rmSync(f); return t; };

// N4
const PHRASE = 'وبركاته لا إله إلا الله';
for (const terms of [[PHRASE], ['مارس', PHRASE]]) {
  const r = await redact(TWO, terms);
  const t = r.bytes ? text(r.bytes) : '';
  check(`N4 ${terms.join(' + ')}: found, and gone from the file`, r.status === 'ok' && !N(t).includes(N(PHRASE)), `status ${r.status}${r.reason ? ` (${r.reason})` : ''}, pdftotext ${r.bytes ? (N(t).includes(N(PHRASE)) ? 'STILL HOLDS IT' : 'clean') : '-'}`);
}
{
  const long = 'السلام عليكم ورحمة الله وبركاته لا إله إلا الله';
  const v = R.termVariants ? R.termVariants(long) : [];
  const pdfjsForm = (v[0] || '').replace(/الله|لا/g, (m) => ({ 'الله': 'هللا', 'لا': 'ال' })[m]);
  check('N4 the form PDF.js reads is among the first two forms of a long phrase', v.slice(0, 2).includes(pdfjsForm), `${v.length} forms`);
}

// N5: the glyphs of a word under a black box?
async function covered(file, term, word) {
  const r = await redact(file, [term]);
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, verbosity: 0 }).promise;
  const page = await doc.getPage(1);
  const items = (await page.getTextContent()).items;
  // the word's position: the run that holds it (as PDF.js reads it), its box from the run's matrix and width
  const it = items.find((x) => N(x.str).includes(N(word)) || N(x.str).includes(N(word).replace(/لا/g, 'ال')));
  await doc.destroy();
  if (!it || !r.quads) return { status: r.status, hit: null };
  const [a, b, , , e, f] = it.transform;
  const s = it.str, n = N(s), w = N(word), i0 = Math.max(n.indexOf(w), n.indexOf(w.replace(/لا/g, 'ال')));
  // right to left: the word's place counted from the run's right end
  const len = n.length || 1, x1 = e + (a / Math.hypot(a, b)) * it.width * (1 - i0 / len), x0 = e + (a / Math.hypot(a, b)) * it.width * (1 - (i0 + w.length) / len);
  const inside = (q, [x, y]) => { let sg = 0; for (let k = 0; k < 4; k++) { const [p1, q1] = q[k], [p2, q2] = q[(k + 1) % 4]; const c = (p2 - p1) * (y - q1) - (q2 - q1) * (x - p1); if (c !== 0) { if (sg && Math.sign(c) !== sg) return false; sg = Math.sign(c); } } return true; };
  const pts = [0.3, 0.5, 0.7].map((u) => [x0 + (x1 - x0) * u, f + 3]);
  const hit = (r.quads[1] || []).some((q) => pts.some((p) => inside(q, p)));
  return { status: r.status, hit, run: s };
}
if (fs.existsSync(NAMES)) {
  for (const [term, keep, black] of [['سلام', 'سالم', 'السلام'], ['فلاح', 'فالح', 'الفلاح']]) {
    const k = await covered(NAMES, term, keep);
    check(`N5 « ${term} » leaves « ${keep} » visible`, k.status === 'ok' && k.hit === false, `status ${k.status}, box over it: ${k.hit}`);
    const g = await covered(NAMES, term, black);
    check(`N5 « ${term} » blacks out « ${black} »`, g.status === 'ok' && g.hit === true, `status ${g.status}, box over it: ${g.hit}`);
  }
} else check('N5 fixture', false, `missing ${NAMES}: run scripts/p37/make-arabic-fixtures.mjs`);
console.log(`\n${fails ? `${fails} FAIL` : 'all PASS'}`);
process.exit(fails ? 1 : 0);
