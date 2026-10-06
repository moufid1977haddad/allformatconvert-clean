// P37 (06/10) — PDF Redact: does the black box fit the matched text? Real iPhone pass of 06/10: redacting "photo-2" in
// "Image d'origine : photo-2.jpg", the box covered the ":" before and ".j" after and cut the "p" of "jpg".
//
// Truth independent of the tool: each fixture is written three times with the SAME content stream, only the text
// rendering mode changing (0 = drawn, 3 = invisible): the full line (one Tj/TJ, as producers write it), the match
// alone, and everything but the match (its neighbours on the line, and a line above and below). Poppler (pdftoppm,
// 288 dpi, grey) draws the last two: their dark pixels are the true ink of the match and of its neighbours. The black
// boxes are computed by app/lib/pdfRedact.js (redactionQuads) from PDF.js's reading of the full line, as the page does
// (scripts/p35/harness.mjs pageGeometry), then compared with the ink:
//   - coverage: every ink pixel of the match (grey < 128) has its centre inside a black box — must be 100 %;
//   - neighbours: the deepest ink pixel of a neighbour inside a black box, in pt — must be at most the stated margin,
//     max(2 % of the font size, 0.5 pt = one pixel of the page's 144 dpi picture), + 0.25 pt (one pixel here).
// Fixtures: standard fonts (Helvetica 14 and 6 pt, Times-Italic, Courier-Bold 36), a simple TrueType font (Liberation
// Sans, WinAnsi), Type 0 fonts (Noto Sans, Noto Serif Italic, Noto Naskh Arabic, right to left), TJ kerning inside and
// around the match, character spacing (Tc), word spacing (Tw), horizontal scaling (Tz), a text rise, a rotated page
// (/Rotate 90) with text turned 30°, and text inside a scaled form XObject.
//   node scripts/p37/redact-box-fit.test.mjs [--impl=<pdfRedact.js to test, default app/lib/pdfRedact.js>] [--keep]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const from = (p) => pathToFileURL(path.isAbsolute(p) ? p : path.join(ROOT, p)).href;
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || `--${k}=${d}`).slice(k.length + 3);
const lib = await import(from('node_modules/pdf-lib/cjs/index.js')).then((m) => m.default || m);
const pdfjsLib = await import(from('node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const { pageGeometry } = await import(from('scripts/p35/harness.mjs'));
const fontkit = await import(from('node_modules/@pdf-lib/fontkit/dist/fontkit.umd.js')).then((m) => m.default || m);
const impl = await import(from(arg('impl', 'app/lib/pdfRedact.js')));
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const OUT = path.join(os.tmpdir(), 'p37-box-fit');
fs.mkdirSync(OUT, { recursive: true });
const DPI = 288, K = DPI / 72;

const PREFIX = "Image d'origine : ", MATCH = 'photo-2', SUFFIX = '.jpg suite';
const AR = { prefix: 'تقرير شهر ', match: 'مارس', suffix: ' سري جدا' }; // reading order
const WIN = 'C:/Windows/Fonts/';
const VARIANTS = [
  { id: 'helvetica-14', std: 'Helvetica', size: 14 },
  { id: 'helvetica-6', std: 'Helvetica', size: 6 },
  { id: 'times-italic-12', std: 'Times-Italic', size: 12 },
  { id: 'courier-bold-36', std: 'Courier-Bold', size: 36 },
  { id: 'truetype-liberation-14', simpleTtf: 'public/pdfjs/5.7.284/standard_fonts/LiberationSans-Regular.ttf', size: 14 },
  { id: 'type0-notosans-14', ttf: 'public/fonts/noto/NotoSans-Regular.ttf', size: 14 },
  { id: 'type0-notoserif-italic-14', ttf: `${WIN}NotoSerif-Italic.ttf`, size: 14 },
  { id: 'kerning-tj-14', std: 'Helvetica', size: 14, kern: true },
  { id: 'charspacing-tc-1.5', std: 'Helvetica', size: 14, Tc: 1.5 },
  { id: 'wordspacing-tw-4', std: 'Times-Roman', size: 14, Tw: 4 },
  { id: 'hscale-tz-70', std: 'Helvetica', size: 14, Tz: 70 },
  { id: 'rise-3', std: 'Helvetica', size: 14, rise: 3 },
  { id: 'rotated-page-90-text-30', std: 'Helvetica', size: 14, rotate: 90, angle: 30 },
  { id: 'form-xobject-scaled-1.3', std: 'Helvetica', size: 12, form: 1.3 },
  { id: 'arabic-type0-naskh-16', ttf: `${WIN}NotoNaskhArabic-Regular.ttf`, size: 16, arabic: true },
].filter((v) => !v.ttf || fs.existsSync(path.isAbsolute(v.ttf) ? v.ttf : path.join(ROOT, v.ttf)));

const lit = (s) => `(${s.replace(/[\\()]/g, (c) => `\\${c}`)})`;

// one fixture, 3 files: full, match only, neighbours only
async function build(v) {
  const files = {};
  for (const mode of ['full', 'match', 'others']) {
    const d = await lib.PDFDocument.create();
    d.registerFontkit(fontkit);
    let fontRef, enc;
    if (v.std) { const f = await d.embedFont(v.std); fontRef = f.ref; enc = lit; }
    else if (v.ttf) { const f = await d.embedFont(fs.readFileSync(path.isAbsolute(v.ttf) ? v.ttf : path.join(ROOT, v.ttf)), { subset: false }); fontRef = f.ref; enc = (s) => f.encodeText(s).toString(); }
    else {
      // a simple TrueType font, WinAnsi, widths from the font file
      const bytes = fs.readFileSync(path.join(ROOT, v.simpleTtf));
      const fk = fontkit.create(bytes);
      const widths = []; for (let c = 32; c <= 126; c++) widths.push(Math.round(fk.glyphForCodePoint(c).advanceWidth * 1000 / fk.unitsPerEm));
      const file = d.context.register(d.context.flateStream(bytes, { Length1: bytes.length }));
      const desc = d.context.register(d.context.obj({ Type: 'FontDescriptor', FontName: 'LiberationSans', Flags: 32, FontBBox: [-200, -300, 1200, 1000], ItalicAngle: 0, Ascent: 905, Descent: -212, CapHeight: 729, StemV: 80, FontFile2: file }));
      fontRef = d.context.register(d.context.obj({ Type: 'Font', Subtype: 'TrueType', BaseFont: 'LiberationSans', FirstChar: 32, LastChar: 126, Widths: widths, Encoding: 'WinAnsiEncoding', FontDescriptor: desc }));
      enc = lit;
    }
    // pieces of the line: strings and TJ offsets
    let pre = [PREFIX], mat = [MATCH], suf = [SUFFIX];
    if (v.kern) { pre = ["Image d'o", -30, 'rigine : ']; mat = ['ph', 60, 'oto', -80, '-2']; suf = ['.j', 50, 'pg suite']; }
    if (v.arabic) {
      // drawn right to left: the words in drawing order (pdf-lib shapes each one), the match in the middle
      const f = await d.embedFont(fs.readFileSync(v.ttf), { subset: false });
      fontRef = f.ref;
      enc = (s) => f.encodeText(s).toString();
      pre = [AR.suffix]; mat = [AR.match]; suf = [AR.prefix]; // left to right on the page
    }
    const tj = (parts) => `[${parts.map((p) => (typeof p === 'number' ? p : enc(p))).join(' ')}] TJ`;
    const tr = (on) => `${on ? 0 : 3} Tr`;
    const show = mode === 'full' ? `${tr(true)} ${tj([...pre, ...mat, ...suf])}` : `${tr(mode === 'others')} ${tj(pre)} ${tr(mode === 'match')} ${tj(mat)} ${tr(mode === 'others')} ${tj(suf)}`;
    const a = ((v.angle || 0) * Math.PI) / 180;
    const tm = `${Math.cos(a).toFixed(5)} ${Math.sin(a).toFixed(5)} ${(-Math.sin(a)).toFixed(5)} ${Math.cos(a).toFixed(5)} 72 400 Tm`;
    const state = `/F1 ${v.size} Tf ${v.Tc || 0} Tc ${v.Tw || 0} Tw ${v.Tz || 100} Tz ${v.rise || 0} Ts`;
    // the line pitch the producers give each font (Noto Naskh Arabic: ascent + descent = 1.70 em, as LibreOffice and
    // browsers set it; Latin fonts: 1.25 em)
    const lead = v.size * (v.arabic ? 1.7 : 1.25);
    const other = (dy, s) => `BT /F1 ${v.size} Tf ${tr(mode === 'others')} 1 0 0 1 72 ${400 + dy} Tm ${tj([s])} ET`;
    const above = v.arabic ? ' نص في السطر الأعلى' : 'Ligne au-dessus du texte gjpq';
    const below = v.arabic ? ' نص في السطر الأدنى' : 'Ligne en dessous du texte bdfhk';
    const body = `${other(lead, above)}\nBT ${state} ${tm} ${show} ET\n${other(-lead, below)}`;
    const page = d.addPage([612, 792]);
    const res = d.context.obj({ Font: { F1: fontRef } });
    if (v.form) {
      const form = d.context.register(d.context.stream(body, { Type: 'XObject', Subtype: 'Form', BBox: [0, 0, 612, 792], Resources: res }));
      page.node.set(lib.PDFName.of('Resources'), d.context.obj({ XObject: { X1: form } }));
      page.node.set(lib.PDFName.of('Contents'), d.context.register(d.context.stream(`q ${v.form} 0 0 ${v.form} -40 -150 cm /X1 Do Q`)));
    } else {
      page.node.set(lib.PDFName.of('Resources'), res);
      page.node.set(lib.PDFName.of('Contents'), d.context.register(d.context.stream(body)));
    }
    if (v.rotate) page.setRotation(lib.degrees(v.rotate));
    files[mode] = path.join(OUT, `${v.id}-${mode}.pdf`);
    fs.writeFileSync(files[mode], await d.save());
  }
  return files;
}

function pgm(file) {
  const base = file.replace(/\.pdf$/, '');
  execFileSync("pdftoppm", ["-r", String(DPI), "-gray", "-singlefile", file, base], { stdio: ["ignore", "ignore", "ignore"] });
  const b = fs.readFileSync(`${base}.pgm`);
  // P5 header: magic, width, height, maxval (whitespace separated), then one byte per pixel
  let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(b[pos]))) s += String.fromCharCode(b[pos++]); tok.push(s); }
  pos++;
  return { w: +tok[1], h: +tok[2], px: b.subarray(pos) };
}

const inside = (q, [x, y]) => { let s = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };
const depth = (q, [x, y]) => Math.min(...[0, 1, 2, 3].map((i) => { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; return Math.abs((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) / (Math.hypot(x2 - x1, y2 - y1) || 1); }));

let fails = 0;
const rows = [];
for (const v of VARIANTS) {
  const files = await build(v);
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(files.full)), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const items = content.items.filter((it) => typeof it.str === 'string');
  const term = v.arabic ? AR.match : MATCH;
  const spans = impl.matchSpans(items.map((it) => it.str), term);
  const helv = await (await lib.PDFDocument.create()).embedFont(lib.StandardFonts.Helvetica);
  const measureOf = () => ({ real: false, width: (s) => { try { return helv.widthOfTextAtSize(s, 100); } catch { return s.length * 55; } } });
  const geometry = impl.itemGeometry ? (await pageGeometry(page, items, content.styles)).geometry : null;
  const quads = impl.redactionQuads(items, content.styles, spans, [], measureOf, geometry, 0.5);
  const placed = geometry ? spans.filter((sp) => geometry[sp.k]).length : 0;
  const vp = page.getViewport({ scale: K, rotation: page.rotate });
  const fsUser = v.size * (v.form || 1);
  const allowed = Math.max(0.02 * fsUser, 0.5) + 0.25;
  const m = pgm(files.match), o = pgm(files.others);
  let ink = 0, covered = 0, nIn = 0, deep = 0, where = null;
  for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
    const a = m.px[j * m.w + i] < 128, b = o.px[j * o.w + i] < 128;
    if (!a && !b) continue;
    const p = vp.convertToPdfPoint(i + 0.5, j + 0.5);
    const qs = quads.filter((q) => inside(q, p));
    if (a) { ink++; if (qs.length) covered++; }
    if (b && qs.length) { nIn++; const dd = Math.max(...qs.map((q) => depth(q, p))); if (dd > deep) { deep = dd; where = p.map((x) => +x.toFixed(1)); } }
  }
  doc.destroy();
  const cov = ink ? (100 * covered) / ink : 0;
  const ok = spans.length > 0 && ink > 0 && covered === ink && deep <= allowed;
  if (!ok) fails++;
  rows.push({ id: v.id, spans: spans.length, exact: placed, matchInkPx: ink, coveredPct: +cov.toFixed(2), neighbourPxInBox: nIn, deepestPt: +deep.toFixed(2), allowedPt: +allowed.toFixed(2), ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${v.id}: spans ${spans.length} (exact ${placed}), match ink ${ink} px, covered ${cov.toFixed(2)} %, neighbour ink in a box ${nIn} px, deepest ${deep.toFixed(2)} pt (allowed ${allowed.toFixed(2)})${ok ? '' : ` at ${JSON.stringify(where)}, boxes ${JSON.stringify(quads.map((q) => q.map((pt) => pt.map((x) => +x.toFixed(1)))))}`}`);
}
if (!process.argv.includes('--keep')) for (const f of fs.readdirSync(OUT)) if (/\.(pgm)$/.test(f)) fs.rmSync(path.join(OUT, f));
fs.writeFileSync(path.join(OUT, `result-${path.basename(arg('impl', 'pdfRedact.js'), '.js')}.json`), JSON.stringify(rows, null, 1));
console.log(`\n${VARIANTS.length - fails}/${VARIANTS.length} fixtures pass`);
process.exit(fails ? 1 : 0);
