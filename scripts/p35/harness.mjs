// P35 (05/10) — Node replay of PDF Redact's pipeline WITH the invisible text layer of D3 (copied from the P33 review's
// harness, %TEMP%\p33-review-redact\harness.mjs): pass 1 → sanitizeForCopy → copy the other pages → each hit page
// rebuilt (a blank picture here, the black boxes are not drawn) + textLayerWords / drawInvisibleWords → save →
// verifyRedacted. The word positions use Helvetica's widths as the measure (the page uses the browser's canvas), so
// this is a fast check of the layer's logic; the real page is run by redact-bench.mjs.
//   node scripts/p35/harness.mjs <pdf> "term1|term2" [out.pdf]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const from = (p) => pathToFileURL(path.join(ROOT, p)).href;
const lib = await import(from('node_modules/pdf-lib/cjs/index.js')).then((m) => m.default || m);
const pdfjsLib = await import(from('node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
const { matchSpans, annotationText, patternSpans, annotationMatches, redactionQuads, textLayerWords, drawInvisibleWords } = await import(from('app/lib/pdfRedact.js'));
const { sanitizeForCopy, verifyRedacted, UNREADABLE_ANNOTATIONS } = await import(from('app/lib/redactSanitize.js'));
const { withActualTextUnicode } = await import(from('app/lib/pdfActualText.js'));
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

export async function redact(file, terms, kinds = []) {
  const ab = fs.readFileSync(file);
  const srcDoc = await lib.PDFDocument.load(ab, { ignoreEncryption: true });
  const outDoc = await lib.PDFDocument.create();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await withActualTextUnicode(ab.buffer.slice(ab.byteOffset, ab.byteOffset + ab.length))), standardFontDataUrl: SFD, verbosity: 0 }).promise;
  const textMatches = (strs, eols) => terms.some((t) => matchSpans(strs, t).length) || patternSpans(strs, kinds, eols).length > 0;
  const spansOf = (strs) => [...terms.flatMap((t) => matchSpans(strs, t)), ...patternSpans(strs, kinds)];
  const helv = await outDoc.embedFont(lib.StandardFonts.Helvetica);
  const measureOf = () => ({ real: false, width: (s) => { try { return helv.widthOfTextAtSize(s, 100); } catch { return s.length * 55; } } });
  const found = new Map();
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const content = await page.getTextContent();
    const items = content.items.filter((it) => typeof it.str === 'string');
    const strs = items.map((it) => it.str);
    const spans = [...terms.flatMap((t, ti) => matchSpans(strs, t).map((sp) => ({ ...sp, m: `t${ti}:${sp.m}` }))), ...patternSpans(strs, kinds, items.map((it) => !!it.hasEOL))];
    const all = await page.getAnnotations();
    const annots = all.filter((an) => an.rect && annotationMatches(annotationText(an), terms, kinds));
    if (!spans.length && !annots.length) continue;
    const opaque = all.filter((an) => an.rect && UNREADABLE_ANNOTATIONS.has(an.subtype) && !annots.includes(an));
    found.set(i, { page, content, items, spans, boxes: [...annots, ...opaque] });
  }
  if (!found.size) return { status: 'nomatch' };
  const removed = sanitizeForCopy(srcDoc, [...found.keys()], lib);
  const img = await outDoc.embedPng(PNG);
  const kept = {};
  for (let i = 0; i < pdf.numPages; i++) {
    const hit = found.get(i);
    if (!hit) { const [c] = await outDoc.copyPages(srcDoc, [i]); outDoc.addPage(c); continue; }
    const { page, content, items, spans, boxes } = hit;
    const unit = page.getViewport({ scale: 1, rotation: 0 });
    const quads = redactionQuads(items, content.styles, spans, boxes.map((an) => an.rect), measureOf);
    const p = outDoc.addPage([unit.width, unit.height]);
    p.drawImage(img, { x: 0, y: 0, width: 10, height: 10 });
    const words = textLayerWords(items, content.styles, spans, quads, measureOf, spansOf);
    kept[i + 1] = drawInvisibleWords(p, helv, words, ([x, y]) => { const [vx, vy] = unit.convertToViewportPoint(x, y); return [vx, unit.height - vy]; }, lib);
    if (page.rotate) p.setRotation(lib.degrees(page.rotate));
  }
  const bytes = await outDoc.save();
  const check = await verifyRedacted(bytes, { terms, textMatches, annotMatches: (t) => annotationMatches(t, terms, kinds), annotText: annotationText, pdfjsLib: { getDocument: (o) => pdfjsLib.getDocument({ ...o, standardFontDataUrl: SFD, verbosity: 0 }) }, lib, pageCount: pdf.numPages });
  return { status: check.ok ? 'ok' : 'REFUSED', reason: check.reason, hits: [...found.keys()].map((i) => i + 1), kept, pages: pdf.numPages, removed, bytes };
}

if (process.argv[2] && !process.argv[2].startsWith('--') && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await redact(process.argv[2], process.argv[3].split('|'));
  if (r.bytes && process.argv[4]) fs.writeFileSync(process.argv[4], r.bytes);
  delete r.bytes; console.log(JSON.stringify(r));
}
