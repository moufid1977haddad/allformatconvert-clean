// PDF Redact matching (audit 2, 29/09).
// Before: a phrase was searched inside ONE pdf.js text item at a time. A phrase split over several items -- a word in
// bold, a line break, a kerning gap -- was not found and stayed in the file, silently; the redaction then covered the
// whole item (often the whole line) instead of the phrase; form field values and comments were never searched.
// Now the page's text is searched as one string, ignoring spaces and line breaks, case-insensitive (NFKC, so
// ligatures and full-width forms match), and each match is mapped back to the character range it covers in every item.

// P33 (independent review 05/10): accents are dropped (NFKD, combining marks and the spacing accents TeX draws as their
// own glyph: "u" + "¨" is "u"), and so are hyphens and dashes ("ZORG-" at a line end + "LUB-77" was not found as
// "ZORGLUB-77"). Both sides are folded the same way: "Muller" also finds "Müller" — over-redaction is the safe side.
const norm = (s) => s.normalize('NFKD').replace(/[\p{M}¨´ˆ-˝`¯¸]/gu, '').toLowerCase().replace(/\s+/g, '').replace(/[-­‐-―−]/g, '');

// strs: the items' strings, in order. Returns [{ k: item index, c0, c1 (exclusive), m: match id }], one entry per
// item per match.
export function matchSpans(strs, keyword) {
  const needle = norm(keyword);
  if (!needle) return [];
  let hay = '';
  const at = []; // at[j] = [item, char] of hay[j]
  strs.forEach((str, k) => {
    for (let c = 0; c < str.length; c++) for (const ch of norm(str[c])) { hay += ch; at.push([k, c]); }
  });
  const spans = [];
  for (let j = hay.indexOf(needle); j >= 0; j = hay.indexOf(needle, j + 1)) {
    const byItem = new Map();
    for (let q = j; q < j + needle.length; q++) {
      const [k, c] = at[q];
      const s = byItem.get(k);
      if (s) { s.c0 = Math.min(s.c0, c); s.c1 = Math.max(s.c1, c + 1); } else byItem.set(k, { k, c0: c, c1: c + 1 });
    }
    for (const v of byItem.values()) spans.push({ ...v, m: j });
  }
  return spans;
}

// Text a pdf.js annotation carries (form field value, comment, alternate text; P33: a link's address too — a
// "Contact me" link to mailto:jane@… on a page whose text does not hold the address was copied as it was, address
// included).
const decoded = (u) => { try { return typeof u === 'string' ? decodeURIComponent(u) : null; } catch { return null; } };
export function annotationText(a) {
  // P33 review: rich text (/RC), subject, an attached file's name, JavaScript actions too
  const actions = a.actions && typeof a.actions === 'object' ? Object.values(a.actions).flat() : [];
  const parts = [a.fieldValue, a.contentsObj && a.contentsObj.str, a.contents, a.alternativeText, a.textContent && [].concat(a.textContent).join(' '), a.url, a.unsafeUrl, decoded(a.unsafeUrl), a.titleObj && a.titleObj.str,
    a.richText && a.richText.str, a.subject, a.subjectObj && a.subjectObj.str, a.file && a.file.filename, ...actions, a.options && [].concat(a.options).map((o) => o && (o.displayValue || o.exportValue))];
  return parts.flat().filter((v) => typeof v === 'string').join(' ');
}

export const matchesText = (text, keyword) => !!norm(keyword) && norm(text).includes(norm(keyword));

// ---- P24 (03/10): several terms and automatic patterns, as iLovePDF's redaction offers (text search plus automatic
// e-mail, phone and card numbers; read 02/10). Patterns run on the page's text with the items joined as they follow
// each other (an address split between two items — a link in another font — is found), a line end (pdf.js hasEOL)
// becoming a line break no pattern crosses; every match is mapped back to the characters it covers in each item.
const LUHN = (digits) => { let s = 0; for (let i = 0; i < digits.length; i++) { let d = +digits[digits.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } s += d; } return s % 10 === 0; };
export const PATTERNS = {
  email: { label: 'E-mail addresses', re: /[\p{L}\p{N}._%+'’-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.\p{L}{2,}/gu, ok: () => true },
  // 9 to 15 digits with the usual separators (+1 514 555 0199, (514) 555-0199, 06 12 34 56 78); not an ISO date
  phone: { label: 'Phone numbers', re: /(?<!\d[ \t.-]?)(?:\+\d{1,3}[ \t.-]?)?(?:\(\d{1,4}\)[ \t.-]?)?\d[\d \t.-]{5,}\d/g, ok: (m) => { const n = m.replace(/\D/g, '').length; return n >= 9 && n <= 15 && !/^\d{4}-\d{2}-\d{2}$/.test(m.trim()); } },
  // 13 to 19 digits, grouped by spaces or dashes, passing the Luhn check (every real card number does)
  // the whole run of digits is taken (never a piece of a longer number); a run holding several numbers is cut by
  // digitRuns below
  card: { label: 'Card numbers', re: /(?<!\d[ -]?)\d(?:[ -]?\d){12,}/g, ok: (m) => { const d = m.replace(/\D/g, ''); return d.length >= 13 && d.length <= 19 && LUHN(d); } },
};

// strs: the items' strings, in order; kinds: keys of PATTERNS; eols[k]: item k ends a line. Same output as matchSpans.
export function patternSpans(strs, kinds, eols = []) {
  let hay = '';
  const at = [];
  strs.forEach((str, k) => {
    for (let c = 0; c < str.length; c++) { hay += str[c]; at.push([k, c]); }
    if (eols[k]) { hay += '\n'; at.push(null); }
  });
  const spans = [];
  for (const kind of kinds) {
    const { re, ok } = PATTERNS[kind];
    re.lastIndex = 0;
    for (let m; (m = re.exec(hay));) {
      // a run that holds a real number next to other digits (card + CVV or expiry, two phone numbers in a row) is
      // redacted WHOLE: cutting it into the "right" numbers can guess wrong and leave one readable (review 03/10)
      const found = ok(m[0]) || digitRuns(m[0], m.index, ok).length ? [[m.index, m.index + m[0].length]] : [];
      for (const [a0, a1] of found) {
      const byItem = new Map();
      for (let q = a0; q < a1; q++) {
        if (!at[q]) continue;
        const [k, c] = at[q];
        const s = byItem.get(k);
        if (s) { s.c0 = Math.min(s.c0, c); s.c1 = Math.max(s.c1, c + 1); } else byItem.set(k, { k, c0: c, c1: c + 1 });
      }
      for (const v of byItem.values()) spans.push({ ...v, m: `${kind}:${a0}` });
      }
    }
  }
  return spans;
}

// Runs of contiguous digit groups inside `s` (at offset `base` in the page text) that pass `ok`, longest first, never
// overlapping: [[start, end], …] in page-text offsets.
function digitRuns(s, base, ok) {
  const groups = [...s.matchAll(/\+?\(?\d+\)?/g)].map((g) => [g.index, g.index + g[0].length]);
  const out = [], used = new Array(groups.length).fill(false);
  for (let len = groups.length; len >= 1; len--) {
    for (let i = 0; i + len <= groups.length; i++) {
      if (used.slice(i, i + len).some(Boolean)) continue;
      const a = groups[i][0], z = groups[i + len - 1][1];
      if (ok(s.slice(a, z))) { out.push([base + a, base + z]); for (let k = i; k < i + len; k++) used[k] = true; }
    }
  }
  return out;
}

/** "a\nb, c" typed by the visitor → the terms (one per line; a line is one term, commas included). */
export const termsOf = (text) => String(text || '').split(/\r?\n/).map((t) => t.trim()).filter((t) => norm(t));

/** Does an annotation's text hold one of the terms or patterns? */
export function annotationMatches(text, terms, kinds) {
  if (terms.some((t) => matchesText(text, t))) return true;
  return kinds.some((kind) => { const { re, ok } = PATTERNS[kind]; re.lastIndex = 0; for (let m; (m = re.exec(text));) if (ok(m[0])) return true; return false; });
}

// ---- P35 (05/10): the black boxes of a redacted page, and its invisible text layer ----
// Decision D3 of the owner: on a page rebuilt from its picture, the words OUTSIDE the black boxes stay selectable, as in
// Adobe Acrobat. Both are computed here from the pdf.js text items of pass 1, in the page's own coordinates (PDF user
// space, before the view box and the rotation), so the page and the benches run the same code.
// measureOf(item, style) → { width(str) → width at a 100-unit font size, real: the run's own font was used }.

// P35: a run in one of the standard PDF fonts that is not embedded (Helvetica-Bold, Times-Roman…, common in generated
// PDFs) is measured with that font's own published widths (pdf-lib's AFM metrics) — the browser's fallback family is
// regular-weight Arial or similar, and put "PDF avec images" in Helvetica-Bold 4 pt off. font: the pdf.js font object
// (page.commonObjs.get(item.fontName)). Returns width(str) at a 100-unit size (null when a character has no width
// there), or null when the run is not in such a font.
const STANDARD_FONTS = new Set(['Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique', 'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique', 'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic']);
const standardEmbedders = new Map();
export function standardWidthOf(font, lib) {
  if (!font || !font.missingFile || typeof font.name !== 'string') return null;
  const name = font.name.replace(/^[A-Z]{6}\+/, '');
  if (!STANDARD_FONTS.has(name) || !lib.StandardFontEmbedder) return null;
  if (!standardEmbedders.has(name)) standardEmbedders.set(name, lib.StandardFontEmbedder.for(name));
  const e = standardEmbedders.get(name);
  return (s) => { try { return e.widthOfTextAtSize(s, 100); } catch { return null; } };
}

function runGeom(it) {
  const [ta, tb, tc, td, tx, ty] = it.transform;
  const fs = Math.hypot(tc, td) || it.height || 12;
  const dl = Math.hypot(ta, tb) || 1;
  const ux = [ta / dl, tb / dl], uy = [tc / (Math.hypot(tc, td) || 1), td / (Math.hypot(tc, td) || 1)];
  return { fs, dl, ux, uy, tx, ty };
}
const quadOf = (g, lo, hi, dn, up) => {
  const P = (u, v) => [g.tx + g.ux[0] * u + g.uy[0] * v, g.ty + g.ux[1] * u + g.uy[1] * v];
  return [P(lo, dn), P(hi, dn), P(hi, up), P(lo, up)];
};

// Where characters c0..c1 (exclusive) of a run lie along its baseline. box: the range a black box covers ({x0, x1,
// extra}); at: the measured position (for the text layer), null when it is not known. Only the matched characters are
// covered (as Adobe Acrobat and PDF24 do), not the whole text run. Their position inside the run is measured with the
// run's font (the font pdf.js loaded for it, else its fallback family); the box is widened by 15 % of the font size,
// plus 4 % of the text before the match when only the fallback font could be used. P33 (review 05/10): when the
// measured run differs from the PDF's own width by more than 3 % (character / word spacing Tc, Tw), the box is the
// WHOLE run (over-redaction is the safe side).
function runRange(it, style, c0, c1, measureOf, g) {
  let x0 = 0, x1 = it.width || g.fs * it.str.length * 0.6, extra = 0, at = null;
  if (!style.vertical && it.str.length > 1) {
    const m = measureOf(it, style);
    const all = m.width(it.str) || 1;
    const pre = m.width(it.str.slice(0, c0)), upto = m.width(it.str.slice(0, c1));
    const W = it.width || all * g.fs / 100;
    at = { x0: W * pre / all, x1: W * upto / all };
    if (it.width && Math.abs(all * g.fs / 100 - it.width) > 0.03 * it.width) { x0 = 0; x1 = W; } // spacing the measure cannot follow: whole run
    else {
      x0 = at.x0; x1 = at.x1;
      if (!m.real) extra = 0.04 * x0 + 0.04 * (x1 - x0);
      // a match that reaches the start or the end of the run is covered to that edge (second review: the last letter
      // of "Müller", drawn after a separate accent glyph, stayed visible)
      if (c0 === 0) x0 = 0;
      if (c1 >= it.str.length) x1 = W;
    }
  } else if (!style.vertical) at = { x0, x1 };
  return { x0, x1, extra, at };
}
// the box of characters c0..c1 of a run, padded as a black box is
function paddedQuad(it, style, c0, c1, measureOf, g = runGeom(it)) {
  const { x0, x1, extra } = runRange(it, style, c0, c1, measureOf, g);
  const pad = 0.15 * g.fs + extra;
  return quadOf(g, x0 - pad, x1 + pad, -0.3 * g.fs, 1.05 * g.fs);
}

/** The black boxes of a page: a quadrilateral (4 [x, y] points, PDF user space) per matched span and per box rect. */
export function redactionQuads(items, styles, spans, rects, measureOf) {
  const quads = spans.map((sp) => { const it = items[sp.k]; return paddedQuad(it, styles[it.fontName] || {}, sp.c0, sp.c1, measureOf); });
  for (const [ax0, ay0, ax1, ay1] of rects) quads.push([[ax0, ay0], [ax1, ay0], [ax1, ay1], [ax0, ay1]]);
  return quads;
}

// two convex quadrilaterals overlap or touch (separating axis test)
function quadsMeet(a, b) {
  for (const poly of [a, b]) {
    for (let i = 0; i < 4; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % 4];
      const nx = y2 - y1, ny = x1 - x2;
      if (!nx && !ny) continue;
      let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
      for (const [x, y] of a) { const d = nx * x + ny * y; amin = Math.min(amin, d); amax = Math.max(amax, d); }
      for (const [x, y] of b) { const d = nx * x + ny * y; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d); }
      if (amax < bmin || bmax < amin) return false;
    }
  }
  return true;
}

/**
 * The words of a redacted page that may stay selectable: [{ str, transform: [a, b, c, d, x, y] (the run's matrix moved
 * to the word's start, PDF user space), width (along the baseline, user space units) }], in the page's text order.
 * Left out: every word touched by a matched span; every word whose box, padded as a black box is (the whole run's box
 * when the run's spacing cannot be measured), meets a black box (text spans and annotation boxes); vertical text; a run
 * with a degenerate matrix or no width. spansOf(strs) is the page's own matching (terms and patterns): it is run again
 * on the words kept, joined with nothing in between, and the words of any match it finds are dropped too, until none is
 * left (two kept words around a removed one must not make a term).
 */
export function textLayerWords(items, styles, spans, quads, measureOf, spansOf) {
  const touched = new Map(); // item → [[c0, c1], …]
  for (const sp of spans) { if (!touched.has(sp.k)) touched.set(sp.k, []); touched.get(sp.k).push([sp.c0, sp.c1]); }
  const words = [];
  items.forEach((it, k) => {
    const style = styles[it.fontName] || {};
    if (style.vertical || !it.str || !/\S/.test(it.str) || !Array.isArray(it.transform)) return;
    const [ta, tb, tc, td] = it.transform;
    if (!(Math.abs(ta * td - tb * tc) > 1e-9) || !(it.width > 0)) return;
    const g = runGeom(it);
    const hits = touched.get(k) || [];
    for (const m of it.str.matchAll(/\S+/g)) {
      const c0 = m.index, c1 = m.index + m[0].length;
      if (hits.some(([h0, h1]) => h0 < c1 && c0 < h1)) continue;
      if (quads.some((q) => quadsMeet(paddedQuad(it, style, c0, c1, measureOf, g), q))) continue;
      const { at } = runRange(it, style, c0, c1, measureOf, g);
      if (!at || !(at.x1 - at.x0 > 0)) continue;
      words.push({ str: m[0], transform: [ta, tb, tc, td, g.tx + g.ux[0] * at.x0,g.ty + g.ux[1] * at.x0], width: at.x1 - at.x0 });
    }
  });
  for (let kept = words; ;) {
    const found = spansOf(kept.map((w) => w.str));
    if (!found.length) return kept;
    const drop = new Set(found.map((sp) => sp.k));
    kept = kept.filter((_, n) => !drop.has(n));
  }
}

/**
 * Writes `words` on `page` (pdf-lib) as invisible text (rendering mode 3) in Helvetica, each word stretched (Tz) to
 * its width. toPage([x, y]) maps a point of the source page's user space to the new page. A word Helvetica (WinAnsi)
 * cannot write, even after NFKC (ligatures, full-width forms), is skipped. Returns the number of words written.
 */
export function drawInvisibleWords(page, font, words, toPage, lib) {
  const { pushGraphicsState, popGraphicsState, beginText, endText, setFontAndSize, setTextRenderingMode, TextRenderingMode, setCharacterSqueeze, setTextMatrix, showText } = lib;
  const ops = [];
  let key = null;
  for (const w of words) {
    let str = w.str, hex = null;
    for (const s of [w.str, w.str.normalize('NFKC')]) { try { hex = font.encodeText(s); str = s; break; } catch { /* a character outside WinAnsi */ } }
    if (!hex) continue;
    const hw = font.widthOfTextAtSize(str, 1);
    const [a, b, c, d, x, y] = w.transform;
    const o = toPage([x, y]), ex = toPage([x + a, y + b]), ey = toPage([x + c, y + d]);
    const A = ex[0] - o[0], B = ex[1] - o[1], C = ey[0] - o[0], D = ey[1] - o[1];
    const dl = Math.hypot(A, B);
    if (!(hw > 0) || !(dl > 0)) continue;
    const squeeze = (100 * w.width) / ((Math.hypot(a, b) || 1) * hw);
    if (!Number.isFinite(squeeze) || squeeze <= 0) continue;
    if (!key) key = page.node.newFontDictionary(font.name, font.ref);
    ops.push(setTextMatrix(A, B, C, D, o[0], o[1]), setCharacterSqueeze(squeeze), showText(hex));
  }
  if (ops.length) page.pushOperators(pushGraphicsState(), beginText(), setFontAndSize(key, 1), setTextRenderingMode(TextRenderingMode.Invisible), ...ops, endText(), popGraphicsState());
  return ops.length / 3;
}
