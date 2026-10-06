// P37 (06/10) — the corrections asked by the independent review of PDF Redact (docs/audit/p37/relecture-redact.md),
// as unit checks of app/lib/pdfRedact.js (pass --impl=<older pdfRedact.js> to see them fail before):
//   D1 an invisible glyph (rendering mode 3: an OCR layer over a scan) has no ink of its own: padded box;
//   D2 a stroked glyph (mode 1) gets half the line width more;
//   D4 "السلام" is found in PDF.js's reading "السالم" (lam-alef reversed), in the text and in annotations;
//   D5 a glyph PDF.js re-measures: wider drawn glyph → box grows by half the difference; drawn glyph unknown → whole run;
//   D6 a right-to-left run whose text reads the same both ways is tied in reading order, not in mirror.
// The end-to-end repros of the review stay: scripts/p37/review/ocr-scan.mjs (D1), fit-adversarial.mjs (D2, D3),
// make-arabic-two-pages.mjs + arabic-terms.mjs (D4).
//   node scripts/p37/redact-review-fixes.test.mjs [--impl=<pdfRedact.js>]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const R = await import(pathToFileURL(path.resolve(ROOT, arg('impl', 'app/lib/pdfRedact.js'))).href);
let fails = 0;
const check = (name, ok, info = '') => { if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ` — ${info}` : ''}`); };
const OPS = { save: 10, restore: 11, transform: 12, beginText: 31, endText: 32, setCharSpacing: 33, setWordSpacing: 34, setHScale: 35, setLeading: 36, setFont: 37, setTextRenderingMode: 38, setTextRise: 39, moveText: 40, setLeadingMoveText: 41, setTextMatrix: 42, nextLine: 43, showText: 44, setLineWidth: 2, setGState: 9, paintFormXObjectBegin: 74, paintFormXObjectEnd: 75, beginGroup: 76, endGroup: 77 };
const font = (extra = {}) => ({ fontMatrix: [0.001, 0, 0, 0.001, 0, 0], ascent: 0.9, descent: -0.2, ...extra });
const glyph = (u, w = 500) => ({ unicode: u, fontChar: u, width: w, isSpace: u === ' ' });
// one line "ab XYZ cd" at (100, 500), 10 pt; the match is "XYZ" (characters 3..6)
const STR = 'ab XYZ cd';
function run({ mode = 0, lw = 1, f = font(), widths = {} } = {}) {
  const ops = { fnArray: [], argsArray: [] };
  const add = (fn, args) => { ops.fnArray.push(fn); ops.argsArray.push(args); };
  add(OPS.setLineWidth, [lw]);
  add(OPS.beginText, null);
  add(OPS.setFont, ['F1', 10]);
  add(OPS.setTextRenderingMode, [mode]);
  add(OPS.setTextMatrix, [[1, 0, 0, 1, 100, 500]]);
  add(OPS.showText, [[...STR].map((ch) => glyph(ch, widths[ch] || 500))]);
  add(OPS.endText, null);
  if (!R.glyphsOfOperatorList) return null;
  const glyphs = R.glyphsOfOperatorList(ops, OPS, () => f);
  const W = [...STR].reduce((s, ch) => s + (widths[ch] || 500) / 100, 0);
  const item = { str: STR, dir: 'ltr', transform: [10, 0, 0, 10, 100, 500], width: W, fontName: 'F1' };
  return { glyphs, item };
}
const inkFull = () => [0, -0.1, 0.5, 0.7]; // ink inside the advance (4 values: the older code reads only those)
const quadX = (q) => [Math.min(...q.map((p) => p[0])), Math.max(...q.map((p) => p[0]))];
const quadY = (q) => [Math.min(...q.map((p) => p[1])), Math.max(...q.map((p) => p[1]))];
const helv = { real: false, width: (s) => s.length * 50 };
function boxOf(r, inkOf, px = 0.5) {
  const geo = R.itemGeometry ? R.itemGeometry([r.item], { F1: {} }, r.glyphs, inkOf) : null;
  return R.redactionQuads([r.item], { F1: {} }, [{ k: 0, c0: 3, c1: 6 }], [], () => helv, geo, px)[0];
}
// the match "XYZ" spans x = 100 + 3*5 = 115 .. 130
{
  const base = run();
  const [x0v, x1v] = base ? quadX(boxOf(base, inkFull)) : [0, 0];
  check('reference: a visible glyph is fitted (box 115..130 + margin)', base && x0v > 114 && x1v < 131, `x ${x0v.toFixed(2)}..${x1v.toFixed(2)}`);
  // D1: same line in mode 3 → padded as before (15 % of 10 pt = 1.5 on each side, -0.3 .. 1.05 em)
  const inv = run({ mode: 3 });
  const q = inv ? boxOf(inv, inkFull) : null;
  check('D1 invisible text (mode 3) is padded: 15 % of the size on each side, -0.3..1.05 em', q && quadX(q)[0] <= 113.51 && quadX(q)[1] >= 131.49 && quadY(q)[0] <= 497.01 && quadY(q)[1] >= 510.49, q ? `x ${quadX(q).map((v) => v.toFixed(2))} y ${quadY(q).map((v) => v.toFixed(2))}` : 'no geometry');
  // D2: stroked (mode 1) with a 3 pt line → at least 1.5 more than the fill box
  const st = run({ mode: 1, lw: 3 });
  const qs = st ? boxOf(st, inkFull) : null;
  check('D2 stroked text (mode 1, line width 3) gets half the line width more', qs && quadX(qs)[0] <= x0v - 1.49 && quadX(qs)[1] >= x1v + 1.49, qs ? `x ${quadX(qs).map((v) => v.toFixed(2))} vs fill ${x0v.toFixed(2)}..${x1v.toFixed(2)}` : 'no geometry');
  // D5: re-measured font, drawn glyph 0.9 em for a 0.5 em width → centred, 0.2 em (2 pt) beyond each side
  const rm = run({ f: font({ remeasure: true }) });
  const qr = rm ? boxOf(rm, () => [0, -0.1, 0.9, 0.7, 0.9]) : null;
  check('D5 re-measured font: the box takes the centred wider glyph (≥ 2 pt beyond the advance)', qr && quadX(qr)[0] <= 113.01 && quadX(qr)[1] >= 132, qr ? `x ${quadX(qr).map((v) => v.toFixed(2))}` : 'no geometry');
  const qn = rm ? boxOf(rm, () => null) : null;
  check('D5 re-measured font, drawn glyph unknown: the whole run is covered', qn && quadX(qn)[0] <= 100 && quadX(qn)[1] >= 145, qn ? `x ${quadX(qn).map((v) => v.toFixed(2))}` : 'no geometry');
}
// D4
check('D4 "السلام" found in PDF.js\'s reading "السالم"', R.matchSpans(['قال السالم عليكم'], 'السلام').length === 1);
check('D4 "الله" found in PDF.js\'s reading "هللا"', R.matchSpans(['ورحمة هللا وبركاته'], 'الله').length === 1);
// third review (R2): an annotation's text is stored in reading order (no glyph read): the term as typed, not its
// misread forms ("سالم" in a comment is another name)
check('D4/R2 annotations: the term as typed, not a misread form', R.matchesText('تعليق: السلام', 'السلام') && !R.matchesText('تعليق: سالم', 'سلام'));
check('D4 a Latin term is unchanged (no reversed form)', R.matchSpans(['abc cba'], 'abc').length === 1);
// D6: an RTL run "ابا" drawn left to right as glyphs a(wide) b a(narrow): reading order is reversed, so the first
// character (logical) is the RIGHTMOST glyph
{
  const ops = { fnArray: [OPS.beginText, OPS.setFont, OPS.setTextMatrix, OPS.showText, OPS.endText], argsArray: [null, ['F1', 10], [[1, 0, 0, 1, 100, 500]], [[glyph('ا', 900), glyph('ب', 500), glyph('ا', 300)]], null] };
  if (R.glyphsOfOperatorList) {
    const glyphs = R.glyphsOfOperatorList(ops, OPS, () => font());
    const item = { str: 'ابا', dir: 'rtl', transform: [10, 0, 0, 10, 100, 500], width: 17, fontName: 'F1' };
    const geo = R.itemGeometry([item], { F1: {} }, glyphs, inkFull);
    const c0 = geo[0] && geo[0].chars[0];
    check('D6 RTL palindrome: character 0 (reading order) is the rightmost glyph (14..17)', c0 && c0.a0 > 13.9 && c0.a1 < 17.1, c0 ? `a ${c0.a0.toFixed(2)}..${c0.a1.toFixed(2)}` : 'not placed');
  } else check('D6 RTL palindrome', false, 'no geometry');
}
console.log(`\n${fails ? `${fails} FAIL` : 'all PASS'}`);
process.exit(fails ? 1 : 0);
