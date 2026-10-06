// P37 independent review of PDF Redact: a scanned page made searchable by Tesseract (the path the tool recommends:
// "run PDF OCR first"; PDF OCR adds Tesseract's text-only PDF layer). The black boxes are then fitted to the invisible
// OCR glyphs (GlyphLessFont), not to the scanned ink. Truth: the page is first written as vector text 3 times (full,
// match only, others only), the full one is rasterized at 300 dpi (the "scan"), Tesseract makes image + invisible text
// PDF from it; the match-only file drawn by Poppler gives the true ink of the match on the scan.
//   node scripts/p37/review/ocr-scan.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const from = (p) => pathToFileURL(path.join(ROOT, p)).href;
const lib = await import(from('node_modules/pdf-lib/cjs/index.js')).then((m) => m.default || m);
const pdfjsLib = await import(from('node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const { pageGeometry, redact } = await import(from('scripts/p35/harness.mjs'));
const NEW = await import(from('app/lib/pdfRedact.js'));
const OLD = await import(pathToFileURL(path.join(os.tmpdir(), 'p37-review-redact', 'pdfRedact.head.mjs')).href);
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const TESS = 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
const OUT = path.join(os.tmpdir(), 'p37-review-redact', 'ocr');
fs.mkdirSync(OUT, { recursive: true });
const lit = (s) => `(${s.replace(/[\\()]/g, (c) => `\\${c}`)})`;

const CASES = [
  { id: 'times12', font: 'Times-Roman', size: 12, lines: [['The annual report on ', 'photography', ' and typology was approved.'], ['Ligne suivante gjpq yyy pour voir les jambages.', '', '']], term: 'photography' },
  { id: 'times12-sub', font: 'Times-Roman', size: 12, lines: [['The annual report on ', 'photography', ' and typology was approved.'], ['Ligne suivante gjpq yyy pour voir les jambages.', '', '']], term: 'graph', sub: ['The annual report on photo', 'graph', 'y and typology was approved.'] },
  { id: 'helv11-ref', font: 'Helvetica', size: 11, lines: [['Account number reference: ', 'QX-4471-PJ', ' was closed in May.'], ['Another line below with gjpqy descenders here.', '', '']], term: 'QX-4471-PJ' },
  { id: 'helv11-sub-ref', font: 'Helvetica', size: 11, lines: [['Account number reference: ', 'QX-4471-PJ', ' was closed in May.'], ['Another line below with gjpqy descenders here.', '', '']], term: '4471', sub: ['Account number reference: QX-', '4471', '-PJ was closed in May.'] },
];

async function vector(c, mode) {
  const d = await lib.PDFDocument.create();
  const f = await d.embedFont(c.font);
  const page = d.addPage([612, 792]);
  const lines = c.sub ? [c.sub, ...c.lines.slice(1)] : c.lines;
  let body = '0 g';
  lines.forEach(([a, b, z], n) => {
    const tm = mode === 'others' ? 3 : 0, to = mode === 'match' ? 3 : 0;
    body += ` BT /F1 ${c.size} Tf 72 ${600 - n * c.size * 1.3} Td ${to} Tr ${lit(a)} Tj ${tm} Tr ${lit(b)} Tj ${to} Tr ${lit(z)} Tj ET`;
  });
  page.node.set(lib.PDFName.of('Resources'), d.context.obj({ Font: { F1: f.ref } }));
  page.node.set(lib.PDFName.of('Contents'), d.context.register(d.context.stream(body)));
  const file = path.join(OUT, `${c.id}-${mode}.pdf`);
  fs.writeFileSync(file, await d.save());
  return file;
}
function pgm(file, dpi) {
  const base = file.replace(/\.pdf$/, '');
  execFileSync('pdftoppm', ['-r', String(dpi), '-gray', '-singlefile', file, base], { stdio: 'ignore' });
  const b = fs.readFileSync(`${base}.pgm`); let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(b[pos]))) s += String.fromCharCode(b[pos++]); tok.push(s); }
  pos++; return { w: +tok[1], h: +tok[2], px: b.subarray(pos) };
}
const inside = (q, [x, y]) => { let s = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };

async function quads(impl, file, term) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const items = content.items.filter((it) => typeof it.str === 'string');
  const spans = impl.matchSpans(items.map((it) => it.str), term);
  const helv = await (await lib.PDFDocument.create()).embedFont(lib.StandardFonts.Helvetica);
  const measureOf = () => ({ real: false, width: (s) => { try { return helv.widthOfTextAtSize(s, 100); } catch { return s.length * 55; } } });
  let q, placed = 0;
  if (impl.itemGeometry) {
    const geo = await pageGeometry(page, items, content.styles);
    q = [...impl.redactionQuads(items, content.styles, spans, [], measureOf, geo.geometry, 0.5), ...impl.glyphTermQuads(geo.glyphs, [term], geo.inkOf, 0.5)];
    placed = spans.filter((sp) => geo.geometry[sp.k]).length;
  } else q = impl.redactionQuads(items, content.styles, spans, [], measureOf);
  const vp = page.getViewport({ scale: 4 });
  const words = items.map((it) => it.str).join('|');
  doc.destroy();
  return { q, vp, spans: spans.length, placed, words };
}

for (const c of CASES) {
  const files = {}; for (const m of ['full', 'match', 'others']) files[m] = await vector(c, m);
  execFileSync('pdftoppm', ['-r', '300', '-gray', '-png', '-singlefile', files.full, path.join(OUT, `${c.id}-scan`)], { stdio: 'ignore' });
  execFileSync(TESS, [path.join(OUT, `${c.id}-scan.png`), path.join(OUT, `${c.id}-ocr`), '--dpi', '300', '-l', 'eng', 'pdf'], { stdio: 'ignore' });
  const ocrPdf = path.join(OUT, `${c.id}-ocr.pdf`);
  const m = pgm(files.match, 288);
  for (const [name, impl] of [['NEW', NEW], ['OLD', OLD]]) {
    const r = await quads(impl, ocrPdf, c.term);
    let ink = 0, cov = 0, maxOut = 0; const miss = [];
    for (let j = 0; j < m.h; j++) for (let i = 0; i < m.w; i++) {
      if (m.px[j * m.w + i] >= 128) continue;
      ink++;
      const p = r.vp.convertToPdfPoint(i + 0.5, j + 0.5);
      if (r.q.some((q) => inside(q, p))) cov++; else if (miss.length < 3) miss.push(p.map((x) => +x.toFixed(1)));
    }
    console.log(`${c.id} [${c.term}] ${name}: spans ${r.spans} exact ${r.placed} ink ${ink} uncovered ${ink - cov} (${(100 * cov / ink).toFixed(2)} %) e.g. ${JSON.stringify(miss)}${name === 'NEW' ? ` | OCR text: ${r.words.slice(0, 140)}` : ''}`);
  }
  const rr = await redact(ocrPdf, [c.term]);
  console.log(`   pipeline: ${rr.status} layer ${JSON.stringify(rr.layer)}`);
}
