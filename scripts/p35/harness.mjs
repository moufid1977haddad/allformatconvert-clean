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
// spans were placed exactly. The terms are also searched in the glyphs drawn and those glyphs covered (glyphTermQuads).
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
const { matchSpans, annotationText, patternSpans, annotationMatches, redactionQuads, textLayerWords, drawInvisibleWords, pageGlyphs, glyphTermMatches, confirmedTermSpans, readingOrderHit, unreadableShare, UNREADABLE_SHARE, removeInvisibleWords, visibleTermLeft, itemGeometry, glyphTermQuads, invisibleTextFont, hasArabic } = await import(from('app/lib/pdfRedact.js'));
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
export async function pageGeometry(page, items, styles, { ink = true, glyphs: given = null } = {}) {
  const parsed = new Map();
  const inkOf = (font, ch, uni = '') => {
    if (!ink || !font || !font.data || font.isType3Font) return null; // (Node: PDF.js draws paths from this same font data)
    if (!parsed.has(font)) { try { parsed.set(font, fontkit.create(Buffer.from(font.data))); } catch { parsed.set(font, null); } }
    const fk = parsed.get(font);
    if (!fk) return null;
    try {
      const g = fk.glyphForCodePoint(ch.codePointAt(0));
      const b = g.bbox, u = fk.unitsPerEm;
      // nothing drawn: a space, else not known (as canvasInk)
      if (!(b.maxX > b.minX) && !(uni && !/\S/.test(uni))) return null;
      return [b.minX / u, b.minY / u, b.maxX / u, b.maxY / u, g.advanceWidth / u].map((v) => (Number.isFinite(v) ? v : 0));
    } catch { return null; }
  };
  const glyphs = given || await pageGlyphs(page, pdfjsLib);
  return { glyphs, inkOf, geometry: itemGeometry(items, styles, glyphs, inkOf) };
}

export async function redact(file, terms, kinds = [], { arabic = true } = {}) {
  const ab = fs.readFileSync(file);
  const srcDoc = await lib.PDFDocument.load(ab, { ignoreEncryption: true });
  const outDoc = await lib.PDFDocument.create();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(await withActualTextUnicode(ab.buffer.slice(ab.byteOffset, ab.byteOffset + ab.length))), standardFontDataUrl: SFD, fontExtraProperties: true, verbosity: 0 }).promise;
  // P37 final check (reviews 3 to 5): each term as typed in the text (always), its lam-alef forms where the run draws
  // that ligature (confirmedTermSpans), the terms still DRAWN in drawing order (glyphTermMatches) and in the reading
  // order rebuilt from the glyphs (readingOrderHit: a Latin word inside Arabic, a phrase wrapped onto the next line) —
  // not every permuted form ("سالم", another name, on another page made a "سلام" redaction refused). The glyphs of each
  // page are read once.
  const glyphCache = new WeakMap();
  const glyphsOf = async (pg) => { if (!glyphCache.has(pg)) glyphCache.set(pg, pageGlyphs(pg, pdfjsLib).catch(() => null)); return glyphCache.get(pg); };
  const textMatches = async (strs, eols, pg, its) => (its ? confirmedTermSpans(its, terms, pg && terms.length ? await glyphsOf(pg) : null).length > 0 : terms.some((t) => matchSpans(strs, t, { forms: 'exact' }).length)) || patternSpans(strs, kinds, eols).length > 0;
  const spansOf = (strs) => [...terms.flatMap((t) => matchSpans(strs, t)), ...patternSpans(strs, kinds)];
  const helv = await outDoc.embedFont(lib.StandardFonts.Helvetica);
  const measureOf = () => ({ real: false, width: (s) => { try { return helv.widthOfTextAtSize(s, 100); } catch { return s.length * 55; } } });
  const found = new Map();
  const unreadable = [];
  for (let i = 0; i < pdf.numPages; i++) {
    const page = await pdf.getPage(i + 1);
    const content = await textOf(page);
    const items = content.items.filter((it) => typeof it.str === 'string');
    const strs = items.map((it) => it.str);
    const all = await page.getAnnotations();
    const annots = all.filter((an) => an.rect && annotationMatches(annotationText(an), terms, kinds));
    // as the page (second review N4): the terms are also searched in the glyphs drawn; third review: the text matches
    // of an Arabic term only where the glyphs confirm them; a page without a match is cleaned up (R3)
    let glyphs = null;
    try { glyphs = await pageGlyphs(page, pdfjsLib); } catch { glyphs = null; }
    const drawnHits = glyphs && terms.length ? glyphTermMatches(glyphs, terms).length : 0;
    // sixth review (L5): pages part of whose text cannot be read (as the page reports them)
    if (glyphs && terms.length) { const u = unreadableShare(glyphs); if (u.share > UNREADABLE_SHARE && u.bad >= 3) unreadable.push(i + 1); }
    const spans = [...confirmedTermSpans(items, terms, glyphs), ...patternSpans(strs, kinds, items.map((it) => !!it.hasEOL))];
    if (!spans.length && !annots.length && !drawnHits) { page.cleanup(); continue; }
    const opaque = all.filter((an) => an.rect && UNREADABLE_ANNOTATIONS.has(an.subtype) && !annots.includes(an));
    found.set(i, { page, content, items, spans, boxes: [...annots, ...opaque], glyphs });
  }
  if (!found.size) return { status: 'nomatch', unreadable };
  const removed = sanitizeForCopy(srcDoc, [...found.keys()], lib);
  const img = await outDoc.embedPng(PNG);
  const kept = {}, quadsOf = {}, exact = { spans: 0, placed: 0 }, layer = {};
  let arabicFont = null;
  const layered = new Map();
  const stillVisible = [];
  for (let i = 0; i < pdf.numPages; i++) {
    const hit = found.get(i);
    if (!hit) { const [c] = await outDoc.copyPages(srcDoc, [i]); outDoc.addPage(c); continue; }
    const { page, content, items, spans, boxes, glyphs } = hit;
    const unit = page.getViewport({ scale: 1, rotation: 0 });
    let geo = null;
    try { geo = await pageGeometry(page, items, content.styles, { glyphs }); } catch { geo = null; }
    const geometry = geo && geo.geometry;
    // the black boxes: the matched characters of the text runs, plus the terms found in the glyphs drawn (P37)
    const quads = [...redactionQuads(items, content.styles, spans, boxes.map((an) => an.rect), measureOf, geometry, 0.5), ...(geo ? glyphTermQuads(geo.glyphs, terms, geo.inkOf, 0.5) : [])];
    // as the page (seventh review S1): a term still visible outside the boxes of a blacked-out page → refused
    if (terms.length) { let g = geo && geo.glyphs; if (!g) { try { g = await pageGlyphs(page, pdfjsLib); } catch { g = null; } } if (!g || visibleTermLeft(g, quads, terms)) stillVisible.push(i + 1); }
    exact.spans += spans.length;
    exact.placed += spans.filter((sp) => geometry && geometry[sp.k]).length;
    quadsOf[i + 1] = quads;
    const p = outDoc.addPage([unit.width, unit.height]);
    p.drawImage(img, { x: 0, y: 0, width: 10, height: 10 });
    const words = textLayerWords(items, content.styles, spans, quads, measureOf, spansOf, geometry);
    if (arabic && !arabicFont && words.some((w) => hasArabic(w.str))) arabicFont = invisibleTextFont(outDoc, fontkit.create(fs.readFileSync(ARABIC_FONT)), lib);
    layer[i + 1] = words.map((w) => w.str);
    layered.set(i + 1, p);
    kept[i + 1] = drawInvisibleWords(p, helv, words, ([x, y]) => { const [vx, vy] = unit.convertToViewportPoint(x, y); return [vx, unit.height - vy]; }, lib, arabicFont);
    if (page.rotate) p.setRotation(lib.degrees(page.rotate));
  }
  if (arabicFont) await arabicFont.finalize();
  if (stillVisible.length) return { status: 'REFUSED', reason: `a term can still be read on page ${stillVisible.join(', ')}`, stillVisible, unreadable, hits: [...found.keys()].map((i) => i + 1), quads: quadsOf, pages: pdf.numPages, removed, bytes: await outDoc.save() };
  let bytes = await outDoc.save();
  const verify = (b) => verifyRedacted(b, { terms, textMatches, annotMatches: (t) => annotationMatches(t, terms, kinds), annotText: annotationText, pdfjsLib: { getDocument: (o) => pdfjsLib.getDocument({ ...o, standardFontDataUrl: SFD, verbosity: 0 }) }, lib, pageCount: pdf.numPages, glyphHit: terms.length ? async (pg) => { const g = await glyphsOf(pg); if (!g) throw new Error('the glyphs of a page could not be read'); return glyphTermMatches(g, terms).length > 0 || readingOrderHit(g, terms); } : null });
  let check = await verify(bytes);
  // as the page (sixth review): a term in the text of a redacted page comes from its invisible words — the page loses them
  const layerless = [];
  while (!check.ok && check.where === 'text' && layered.has(check.page) && !layerless.includes(check.page) && removeInvisibleWords(layered.get(check.page), lib)) {
    layerless.push(check.page);
    bytes = await outDoc.save();
    check = await verify(bytes);
  }
  return { status: check.ok ? 'ok' : 'REFUSED', reason: check.reason, unreadable, layerless, hits: [...found.keys()].map((i) => i + 1), kept, layer, quads: quadsOf, exact, pages: pdf.numPages, removed, bytes };
}

if (process.argv[2] && !process.argv[2].startsWith('--') && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await redact(process.argv[2], process.argv[3].split('|'));
  if (r.bytes && process.argv[4]) fs.writeFileSync(process.argv[4], r.bytes);
  delete r.bytes; delete r.quads; console.log(JSON.stringify(r));
}
