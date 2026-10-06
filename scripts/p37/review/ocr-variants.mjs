// P37 review n° 2: the OCR layer of scripts/p37/review/ocr-scan.mjs (run it first) hidden in other ways than mode 3:
// "under-image" (mode 0 text drawn BEFORE the scan, the opaque scan covers it: older scanners / "image over text"),
// "alpha-0" (mode 0 text with an ExtGState /ca 0 over the scan). The visible ink is the scan; the boxes must cover it.
//   node scripts/p37/review/ocr-variants.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const lib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdf-lib/cjs/index.js')).href).then((m) => m.default || m);
const pdfjsLib = await import(pathToFileURL(path.join(ROOT, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);
const { pageGeometry, redact } = await import(pathToFileURL(path.join(ROOT, 'scripts/p35/harness.mjs')).href);
const NEW = await import(pathToFileURL(path.join(ROOT, 'app/lib/pdfRedact.js')).href);
const DIR = path.join(os.tmpdir(), 'p37-review-redact', process.env.RED ? 'ocr-red' : 'ocr');
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const inside = (q, [x, y]) => { let s = 0; for (let i = 0; i < 4; i++) { const [x1, y1] = q[i], [x2, y2] = q[(i + 1) % 4]; const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c); } } return true; };
function pgm(file) {
  const base = file.replace(/\.pdf$/, '');
  execFileSync('pdftoppm', ['-r', '288', '-gray', '-singlefile', file, base], { stdio: 'ignore' });
  const b = fs.readFileSync(`${base}.pgm`); let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(b[pos]))) pos++; let s = ''; while (!/\s/.test(String.fromCharCode(b[pos]))) s += String.fromCharCode(b[pos++]); tok.push(s); }
  pos++; return { w: +tok[1], h: +tok[2], px: b.subarray(pos) };
}
const truth = pgm(path.join(DIR, 'times12-match.pdf'));
for (const v of ['under-image', 'alpha-0']) {
  const d = await lib.PDFDocument.load(fs.readFileSync(path.join(DIR, 'times12-ocr.pdf')));
  const p = d.getPage(0);
  const ref = p.node.get(lib.PDFName.of('Contents'));
  const st = d.context.lookup(ref);
  let src = Buffer.from(st.contents); try { src = zlib.inflateSync(src); } catch { /* raw */ }
  let s = src.toString('latin1');
  const img = 'q 612 0 0 792 0 0 cm /Im1 Do Q';
  s = s.replace(img, '').replace(/3 Tr/g, '0 Tr');
  if (v === 'under-image') s = `${s}\n${img}`;
  else {
    s = `${img}\n/GSa gs\n${s}`;
    const res = p.node.get(lib.PDFName.of('Resources'));
    d.context.lookup(res).set(lib.PDFName.of('ExtGState'), d.context.obj({ GSa: { Type: 'ExtGState', ca: 0 } }));
  }
  p.node.set(lib.PDFName.of('Contents'), d.context.register(d.context.stream(s)));
  const file = path.join(DIR, `times12-ocr-${v}.pdf`);
  fs.writeFileSync(file, await d.save());
  // the page as Poppler draws it must look like the scan (the text not seen)
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise;
  const page = await doc.getPage(1); const content = await page.getTextContent();
  const items = content.items.filter((it) => typeof it.str === 'string');
  const spans = NEW.matchSpans(items.map((it) => it.str), 'photography');
  const geo = await pageGeometry(page, items, content.styles);
  const quads = [...NEW.redactionQuads(items, content.styles, spans, [], () => ({ real: false, width: (x) => x.length * 50 }), geo.geometry, 0.5), ...NEW.glyphTermQuads(geo.glyphs, ['photography'], geo.inkOf, 0.5)];
  const vp = page.getViewport({ scale: 4 });
  let ink = 0, cov = 0;
  for (let j = 0; j < truth.h; j++) for (let i = 0; i < truth.w; i++) { if (truth.px[j * truth.w + i] >= 128) continue; ink++; if (quads.some((q) => inside(q, vp.convertToPdfPoint(i + 0.5, j + 0.5)))) cov++; }
  const r = await redact(file, ['photography']);
  console.log(`${v}: spans ${spans.length} ink ${ink} uncovered ${ink - cov} (${(100 * cov / ink).toFixed(2)} %) | pipeline ${r.status}`);
  doc.destroy();
}
