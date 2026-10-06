// P35 (05/10) — Node replay of PDF Redact's pipeline WITH the invisible text layer of D3 (copied from the P33 review's
// harness, %TEMP%\p33-review-redact\harness.mjs): pass 1 → sanitizeForCopy → copy the other pages → each hit page
// rebuilt (a blank picture here, the black boxes are not drawn) + textLayerWords / drawInvisibleWords → save →
// verifyRedacted. The word positions use Helvetica's widths as the measure (the page uses the browser's canvas), so
// this is a fast check of the layer's logic; the real page is run by redact-bench.mjs.
// P37 (06/10): as the page now does, the glyphs of each redacted page are placed from PDF.js's operator list
// (glyphsOfOperatorList / itemGeometry) and the black boxes fit the matched characters; a glyph's ink box comes from the
// font PDF.js converted (fontkit on font.data; the page measures it with the browser's canvas instead); Arabic words
// of the invisible layer are written in Noto Sans Arabic (invisibleTextFont); text read as NFC as the page's
// app/lib/pdfjs.js does. The result also gives the black boxes of each page (quads, PDF user space) and how many
// spans were placed exactly.
//   node scripts/p35/harness.mjs <pdf> "term1|term2" [out.pdf]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const from = (p) => pathToFileURL(path.join(ROOT, p)).href;
const lib = await import(from('node_modules/pdf-lib/cjs/index.js')).then((m) => m.default || m);
const pdfjsLib = await import(from('node_modules/pdfjs-dist/legacy/build/pdf.mjs'));
if (typeof globalThis.regeneratorRuntime === 'undefined') globalThis.regeneratorRuntime = (await import(from('node_modules/regenerator-runtime/runtime.js'))).default || globalThis.regeneratorRuntime;
const fontkit = await import(from('node_modules/@pdf-lib/fontkit/dist/fontkit.umd.js')).then((m) => m.default || m);
const { matchSpans, annotationText, patternSpans, annotationMatches, redactionQuads, textLayerWords, drawInvisibleWords, glyphsOfOperatorList, itemGeometry, invisibleTextFont, hasArabic } = await import(from('app/lib/pdfRedact.js'));
const { sanitizeForCopy, verifyRedacted, UNREADABLE_ANNOTATIONS } = await import(from('app/lib/redactSanitize.js'));
const { withActualTextUnicode } = await import(from('app/lib/pdfActualText.js'));
const SFD = path.join(ROOT, 'node_modules/pdfjs-dist/standard_fonts/').replace(/\\/g, '/');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
export const ARABIC_FONT = path.join(ROOT, 'public/fonts/noto/NotoSansArabic-Regular.ttf');

// the page's text as app/lib/pdfjs.js gives it (NFC when a combining mark is in a run)
async function textOf(page) {
  const content = await page.getTextContent();
  for (const it of content.items) if (typeof it.str === 'string' && /\p{M}/u.test(it.str)) it.str = it.str.normalize('NFC');
  return content;
}

/** The glyph geometry of a page, as the page computes it (ink from fontkit here, canvas there). */
export async function pageGeometry(page, items, styles, { ink = true } = {}) {
  const ops = await page.getOperatorList({ annotationMode: pdfjsLib.AnnotationMode.DISABLE });
  const names = new Set();
  ops.fnArray.forEach((fn, i) => { if (fn === pdfjsLib.OPS.setFont) names.add(ops.argsArray[i][0]); });
  const fonts = new Map();
  for (const n of names) fonts.set(n, await new Promise((resolve) => { try { page.commonObjs.get(n, resolve); } catch { resolve(null); } }));
  const glyphs = glyphsOfOperatorList(ops, pdfjsLib.OPS, (n) => fonts.get(n) || null);
  const parsed = new Map();
  const inkOf = (font, ch) => {
    if (!ink || !font || !font.data || font.isType3Font) return null;
    if (!parsed.has(font)) { try { parsed.set(font, fontkit.create(Buffer.from(font.data))); } catch { parsed.set(font, null); } }
    const fk = parsed.get(font);
    if (!fk) return null;
    try {
      const g = fk.glyphForCodePoint(ch.codePointAt(0));
      const b = g.bbox, u = fk.unitsPerEm;
      return [b.minX / u, b.minY / u, b.maxX / u, b.maxY / u].map((v) => (Number.isFinite(v) ? v : 0));
    } catch { return null; }
  };
  return { glyphs, geometry: itemGeometry(items, styles, glyphs, inkOf) };
}

export async function redact(file, terms, kinds = [], { arabic = true } = {}) {
  const ab = fs.readFileSync(file);
  const srcDoc = await lib.PDFDocument.load(ab, { ignoreEncryption: true });
  const outDoc = await lib.PDFDocument.create();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await withActualTextUnicode(ab.buffer.slice(ab.byteOffset, ab.byteOffset + ab.length))), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise;
  const textMatches = (strs, eols) => terms.some((t) => matchSpans(strs, t).length) || patternSpans(strs, kinds, eols).length > 0;
  const spansOf = (strs) => [...terms.flatMap((t) => matchSpans(strs, t)), ...patternSpans(strs, kinds)];
  const helv = await outDoc.embedFont(lib.StandardFonts.Helvetica);
  const measureOf = () => ({ real: false, width: (s) => { try { return helv.widthOfTextAtSize(s, 100); } catch { return s.length * 55; } } });
  const found = new Map();
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const content = await textOf(page);
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
  const kept = {}, quadsOf = {}, exact = { spans: 0, placed: 0 }, layer = {};
  let arabicFont = null;
  for (let i = 0; i < pdf.numPages; i++) {
    const hit = found.get(i);
    if (!hit) { const [c] = await outDoc.copyPages(srcDoc, [i]); outDoc.addPage(c); continue; }
    const { page, content, items, spans, boxes } = hit;
    const unit = page.getViewport({ scale: 1, rotation: 0 });
    let geometry = null;
    try { geometry = (await pageGeometry(page, items, content.styles)).geometry; } catch { geometry = null; }
    const quads = redactionQuads(items, content.styles, spans, boxes.map((an) => an.rect), measureOf, geometry, 0.5);
    exact.spans += spans.length;
    exact.placed += spans.filter((sp) => geometry && geometry[sp.k]).length;
    quadsOf[i + 1] = quads;
    const p = outDoc.addPage([unit.width, unit.height]);
    p.drawImage(img, { x: 0, y: 0, width: 10, height: 10 });
    const words = textLayerWords(items, content.styles, spans, quads, measureOf, spansOf, geometry);
    if (arabic && !arabicFont && words.some((w) => hasArabic(w.str))) arabicFont = invisibleTextFont(outDoc, fontkit.create(fs.readFileSync(ARABIC_FONT)), lib);
    layer[i + 1] = words.map((w) => w.str);
    kept[i + 1] = drawInvisibleWords(p, helv, words, ([x, y]) => { const [vx, vy] = unit.convertToViewportPoint(x, y); return [vx, unit.height - vy]; }, lib, arabicFont);
    if (page.rotate) p.setRotation(lib.degrees(page.rotate));
  }
  if (arabicFont) await arabicFont.finalize();
  const bytes = await outDoc.save();
  const check = await verifyRedacted(bytes, { terms, textMatches, annotMatches: (t) => annotationMatches(t, terms, kinds), annotText: annotationText, pdfjsLib: { getDocument: (o) => pdfjsLib.getDocument({ ...o, standardFontDataUrl: SFD, verbosity: 0 }) }, lib, pageCount: pdf.numPages });
  return { status: check.ok ? 'ok' : 'REFUSED', reason: check.reason, hits: [...found.keys()].map((i) => i + 1), kept, layer, quads: quadsOf, exact, pages: pdf.numPages, removed, bytes };
}

if (process.argv[2] && !process.argv[2].startsWith('--') && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await redact(process.argv[2], process.argv[3].split('|'));
  if (r.bytes && process.argv[4]) fs.writeFileSync(process.argv[4], r.bytes);
  delete r.bytes; delete r.quads; console.log(JSON.stringify(r));
}
