// P37 independent review of PDF Redact (06/10): adversarial fixtures for the glyph-fitted black boxes.
// Same truth as scripts/p37/redact-box-fit.test.mjs: each fixture is written 3 times with the same content stream, only
// the text rendering mode of the match / of the rest changing (visible mode vs 3 = invisible). Poppler draws the
// "match" and "others" files: their dark pixels are the true ink. The black boxes are the page's (redactionQuads +
// glyphTermQuads, through scripts/p35/harness.mjs pageGeometry). Also runs the OLD code (commit 3324ed50) on the same
// fixture for comparison (regression or pre-existing).
//   node scripts/p37/review/fit-adversarial.mjs [--only=id]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const from = (p) => pathToFileURL(path.isAbsolute(p) ? p : path.join(ROOT, p)).href;
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const lib = await import(from('node_modules/pdf-lib/cjs/index.js')).then((m) => m.default || m);
const pdfjsLib = await import(from('node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const { pageGeometry, redact } = await import(from('scripts/p35/harness.mjs'));
const fontkit = await import(from('node_modules/@pdf-lib/fontkit/dist/fontkit.umd.js')).then((m) => m.default || m);
const NEW = await import(from('app/lib/pdfRedact.js'));
const OUT = path.join(os.tmpdir(), 'p37-review-redact', process.env.RED ? 'fit-red' : 'fit');
fs.mkdirSync(OUT, { recursive: true });
const OLDF = path.join(os.tmpdir(), 'p37-review-redact', 'pdfRedact.head.mjs');
const OLD = fs.existsSync(OLDF) ? await import(pathToFileURL(OLDF).href) : null;
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const DPI = 288, K = DPI / 72;
const lit = (s) => `(${s.replace(/[\\()]/g, (c) => `\\${c}`)})`;

// fixtures: body(trMatch, trOthers) → content stream; font: how F1 is made; term
const F = [];
const line = (pre, mat, suf) => (tm, to) => `${to} Tr ${lit(pre)} Tj ${tm} Tr ${lit(mat)} Tj ${to} Tr ${lit(suf)} Tj`;
const std = (name) => async (d) => (await d.embedFont(name)).ref;
F.push({ id: 'stroke-tr2-w2-24', font: std('Helvetica'), vis: 2, body: (m, o) => `0 0 0 rg 0 0 0 RG 2 w BT /F1 24 Tf 72 400 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'stroke-tr1-w3-36', font: std('Helvetica'), vis: 1, body: (m, o) => `0 0 0 RG 3 w BT /F1 36 Tf 40 400 Td ${line("Im : ", 'photo-2', '.jpg')(m, o)} ET` });
F.push({ id: 'stroke-tr2-w1-12', font: std('Helvetica-Bold'), vis: 2, body: (m, o) => `0 0 0 rg 0 0 0 RG 1 w BT /F1 12 Tf 72 400 Td ${line("Image d'origine : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'negative-font-size', font: std('Helvetica'), body: (m, o) => `BT /F1 -14 Tf 1 0 0 1 400 400 Tm ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'flipped-ctm-generator', font: std('Helvetica'), body: (m, o) => `q 1 0 0 -1 0 792 cm BT /F1 14 Tf 1 0 0 -1 72 392 Tm ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET Q` });
F.push({ id: 'shear-synthetic-italic', font: std('Helvetica'), body: (m, o) => `BT /F1 18 Tf 1 0 0.4 1 72 400 Tm ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'shadow-offset-2pt', font: std('Helvetica'), body: (m, o) => `0.6 g BT /F1 16 Tf 74 398 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET 0 g BT /F1 16 Tf 72 400 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'fake-bold-double-0.4', font: std('Helvetica'), body: (m, o) => `BT /F1 16 Tf 72 400 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET BT /F1 16 Tf 72.4 400 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'tz-300-tc-neg', font: std('Helvetica'), body: (m, o) => `BT /F1 12 Tf 300 Tz -2 Tc 20 400 Td ${line("Im : ", 'photo-2', '.jpg')(m, o)} ET` });
F.push({ id: 'rise-inside-match', font: std('Helvetica'), term: 'photo-2', body: (m, o) => `BT /F1 14 Tf 72 400 Td ${o} Tr (Image : ) Tj ${m} Tr (photo) Tj 7 Ts (-2) Tj 0 Ts ${o} Tr (.jpg suite) Tj ET` });
// Type 0 font whose /W widths are much narrower than its glyphs (glyphs overlap)
F.push({ id: 'type0-narrow-widths', ttf: 'public/fonts/noto/NotoSans-Regular.ttf', narrowW: 250, body: null, words: ["Image : ", 'photo-2', '.jpg suite'], size: 16 });
F.push({ id: 'type0-accents-stacked', ttf: 'public/fonts/noto/NotoSans-Regular.ttf', words: ['Nom : ', 'ỄỂỆphô', ' suite gjpq'], term: 'ỄỂỆphô', size: 20 });
F.push({ id: 'ligature-calibri', ttf: 'C:/Windows/Fonts/calibri.ttf', words: ['the of', 'fice', 'r file'], term: 'fice', size: 20 });
F.push({ id: 'italic-ttf-overhang', ttf: 'C:/Windows/Fonts/timesi.ttf', words: ['Nom : ', 'fjfjf', ' suite'], term: 'fjfjf', size: 24 });
// Type 3 font: each glyph draws a box wider than its advance (overhang 25 % of the em on the right, 10 % on the left)
F.push({ id: 'type3-overhang', type3: { w: 500, x0: -100, x1: 750 }, body: (m, o) => `BT /F1 14 Tf 72 400 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'type3-bbox-too-small', type3: { w: 500, x0: -100, x1: 750, bbox: [0, 0, 500, 700] }, body: (m, o) => `BT /F1 14 Tf 72 400 Td ${line('Image : ', 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'type3-bbox-zero', type3: { w: 500, x0: -100, x1: 750, bbox: [0, 0, 0, 0] }, body: (m, o) => `BT /F1 14 Tf 72 400 Td ${line('Image : ', 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'form-sets-tr3-then-visible', font: std('Helvetica'), body: (m, o) => `q BT 3 Tr ET Q BT /F1 14 Tf 72 400 Td ${line('Image : ', 'photo-2', '.jpg suite')(m, o)} ET` });
F.push({ id: 'type3-big-matrix-size1', type3: { w: 500, x0: 0, x1: 500, fm: 0.014 }, body: (m, o) => `BT /F1 1 Tf 72 400 Td ${line("Image : ", 'photo-2', '.jpg suite')(m, o)} ET` });

async function type3Font(d, t) {
  const names = { p: 'p', h: 'h', o: 'o', t: 't', '-': 'hyphen', 2: 'two', I: 'I', m: 'm', a: 'a', g: 'g', e: 'e', ' ': 'space', ':': 'colon', '.': 'period', j: 'j', s: 's', u: 'u', i: 'i' };
  const fm = t.fm || 0.001;
  const unit = 1 / (fm * 1000); // glyph space units per 1/1000 em
  const proc = (n) => d.context.register(d.context.stream(n === 'space' ? `${t.w * unit} 0 d0` : `${t.w * unit} 0 ${t.x0 * unit} ${-200 * unit} ${t.x1 * unit} ${700 * unit} d1 ${t.x0 * unit} ${-200 * unit} ${(t.x1 - t.x0) * unit} ${900 * unit} re f`));
  const procs = {}, diffs = [];
  for (const [ch, n] of Object.entries(names)) { procs[n] = proc(n); diffs.push(ch.charCodeAt(0), lib.PDFName.of(n)); }
  const codes = Object.keys(names).map((c) => c.charCodeAt(0));
  const first = Math.min(...codes), last = Math.max(...codes);
  const widths = []; for (let c = first; c <= last; c++) widths.push(t.w * unit);
  const cp = d.context.obj({}); for (const [n, r] of Object.entries(procs)) cp.set(lib.PDFName.of(n), r);
  return d.context.register(d.context.obj({ Type: 'Font', Subtype: 'Type3', FontBBox: t.bbox ? t.bbox.map((v) => v * unit) : [t.x0 * unit, -200 * unit, t.x1 * unit, 900 * unit], FontMatrix: [fm, 0, 0, fm, 0, 0], CharProcs: cp, Encoding: d.context.obj({ Type: 'Encoding', Differences: diffs }), FirstChar: first, LastChar: last, Widths: widths, Resources: d.context.obj({}) }));
}

async function build(v, mode) {
  const d = await lib.PDFDocument.create();
  d.registerFontkit(fontkit);
  const page = d.addPage([612, 792]);
  let fontRef, body;
  const tm = mode === 'others' ? 3 : (v.vis ?? 0), to = mode === 'match' ? 3 : (v.vis ?? 0);
  if (v.type3) { fontRef = await type3Font(d, v.type3); body = v.body(tm, to); }
  else if (v.ttf) {
    const f = await d.embedFont(fs.readFileSync(path.isAbsolute(v.ttf) ? v.ttf : path.join(ROOT, v.ttf)), { subset: false });
    fontRef = f.ref;
    if (v.narrowW) { await d.flush(); }
    const enc = (s) => f.encodeText(s).toString();
    const [a, b, c] = v.words;
    body = `BT /F1 ${v.size} Tf 60 400 Td ${to} Tr [${enc(a)}] TJ ${tm} Tr [${enc(b)}] TJ ${to} Tr [${enc(c)}] TJ ET`;
    if (v.narrowW) {
      // rewrite the CID font's W: every glyph narrower than drawn
      await d.save();
      const font = d.context.lookup(fontRef);
      const cid = d.context.lookup(font.get(lib.PDFName.of('DescendantFonts'))).get(0);
      const cidDict = d.context.lookup(cid);
      cidDict.set(lib.PDFName.of('W'), d.context.obj([0, [...Array(5000)].map(() => v.narrowW)]));
      cidDict.set(lib.PDFName.of('DW'), d.context.obj(v.narrowW));
    }
  } else { fontRef = await v.font(d); body = v.body(tm, to); }
  page.node.set(lib.PDFName.of('Resources'), d.context.obj({ Font: { F1: fontRef } }));
  if (process.env.RED) body = '1 0 0 rg 1 0 0 RG ' + body.replace(/\b0 0 0 (rg|RG)\b/g, '1 0 0 $1').replace(/\b0\.6 g\b/g, '1 0.6 0.6 rg').replace(/(^|\s)0 g\b/g, '$1 1 0 0 rg');
  page.node.set(lib.PDFName.of('Contents'), d.context.register(d.context.stream(body)));
  const f = path.join(OUT, `${v.id}-${mode}.pdf`);
  fs.writeFileSync(f, await d.save({ updateFieldAppearances: false }));
  return f;
}

export function pgm(file, dpi = DPI) {
  const base = file.replace(/\.pdf$/, '');
  execFileSync('pdftoppm', ['-r', String(dpi), '-gray', '-singlefile', file, base], { stdio: ['ignore', 'ignore', 'ignore'] });
  const b = fs.readFileSync(`${base}.pgm`);
  let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(b[pos]))) s += String.fromCharCode(b[pos++]); tok.push(s); }
  pos++;
  return { w: +tok[1], h: +tok[2], px: b.subarray(pos) };
}
export const inside = (q, [x, y]) => { let s = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };

async function quadsFor(impl, file, term) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const items = content.items.filter((it) => typeof it.str === 'string');
  const spans = impl.matchSpans(items.map((it) => it.str), term);
  const helv = await (await lib.PDFDocument.create()).embedFont(lib.StandardFonts.Helvetica);
  const measureOf = () => ({ real: false, width: (s) => { try { return helv.widthOfTextAtSize(s, 100); } catch { return s.length * 55; } } });
  let quads;
  if (impl.itemGeometry) {
    const geo = await pageGeometry(page, items, content.styles);
    quads = [...impl.redactionQuads(items, content.styles, spans, [], measureOf, geo.geometry, 0.5), ...impl.glyphTermQuads(geo.glyphs, [term], geo.inkOf, 0.5)];
    var placed = spans.filter((sp) => geo.geometry[sp.k]).length;
  } else quads = impl.redactionQuads(items, content.styles, spans, [], measureOf);
  const vp = page.getViewport({ scale: K, rotation: page.rotate });
  const strs = items.map((it) => JSON.stringify(it.str)).join(' ');
  doc.destroy();
  return { quads, spans: spans.length, placed, vp, strs };
}

function score(quads, vp, m, o) {
  let ink = 0, covered = 0, missPt = 0, nIn = 0, where = null;
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
    const a = m.px[j * m.w + i] < 128, b = o.px[j * o.w + i] < 128;
    if (!a && !b) continue;
    const p = vp.convertToPdfPoint(i + 0.5, j + 0.5);
    const hit = quads.some((q) => inside(q, p));
    if (a) { ink++; if (hit) covered++; else if (!where) where = p.map((x) => +x.toFixed(1)); }
    if (b && hit) nIn++;
  }
  return { ink, covered, uncovered: ink - covered, pct: ink ? +(100 * covered / ink).toFixed(2) : 0, neighbourPxInBox: nIn, firstUncovered: where };
}

const rows = [];
for (const v of F.filter((x) => !arg('only') || x.id === arg('only'))) {
  if (v.ttf && !fs.existsSync(path.isAbsolute(v.ttf) ? v.ttf : path.join(ROOT, v.ttf))) { console.log(`SKIP ${v.id} (no font)`); continue; }
  const term = v.term || 'photo-2';
  const files = {}; for (const mode of ['full', 'match', 'others']) files[mode] = await build(v, mode);
  const m = pgm(files.match), o = pgm(files.others);
  const now = await quadsFor(NEW, files.full, term);
  const sNew = score(now.quads, now.vp, m, o);
  let sOld = null;
  if (OLD) { const old = await quadsFor(OLD, files.full, term); sOld = score(old.quads, old.vp, m, o); }
  // full pipeline (text leak): harness redact on the full file
  let pipe = '';
  try { const r = await redact(files.full, [term]); pipe = `${r.status} layer=${JSON.stringify(r.layer)}`; if (r.bytes) fs.writeFileSync(files.full.replace('-full.pdf', '-out.pdf'), r.bytes); } catch (e) { pipe = `ERROR ${e.message}`; }
  const verdict = sNew.ink && sNew.uncovered === 0 ? 'PASS' : 'FAIL';
  console.log(`${verdict} ${v.id}: spans ${now.spans} exact ${now.placed} | NEW ink ${sNew.ink} uncovered ${sNew.uncovered} (${sNew.pct} %) first ${JSON.stringify(sNew.firstUncovered)} neighbours ${sNew.neighbourPxInBox} | OLD ${sOld ? `uncovered ${sOld.uncovered} (${sOld.pct} %) neighbours ${sOld.neighbourPxInBox}` : '-'} | items ${now.strs.slice(0, 160)} | ${pipe.slice(0, 300)}`);
  rows.push({ id: v.id, ...sNew, old: sOld, spans: now.spans, placed: now.placed });
}
fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(rows, null, 1));
