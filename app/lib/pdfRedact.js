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

// P37 (06/10): right-to-left text. PDF.js gives a right-to-left run's text in reading order, the reverse of the order
// its glyphs are drawn in, so a position measured from the run's left edge in that text is mirrored: such a run is
// never measured that way (the black box is the whole run, unless the exact geometry below maps its glyphs).
const RTL_CHAR = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
export const isRtlText = (s) => RTL_CHAR.test(s);
const ARABIC_CHAR = /[؀-ۿݐ-ݿࡰ-ࣿﭐ-﷿ﹰ-﻿]/;
export const hasArabic = (s) => ARABIC_CHAR.test(s);

// Where characters c0..c1 (exclusive) of a run lie along its baseline, when the exact geometry below is not available
// for the run (fallback). box: the range a black box covers ({x0, x1, extra}); at: the measured position (for the text
// layer), null when it is not known. Their position inside the run is measured with the run's font (the font pdf.js
// loaded for it, else its fallback family); the box is widened by 15 % of the font size, plus 4 % of the text before
// the match when only the fallback font could be used. P33 (review 05/10): when the measured run differs from the PDF's
// own width by more than 3 % (character / word spacing Tc, Tw), the box is the WHOLE run (over-redaction is the safe
// side). P37: a right-to-left run is the whole run too.
function runRange(it, style, c0, c1, measureOf, g) {
  let x0 = 0, x1 = it.width || g.fs * it.str.length * 0.6, extra = 0, at = null;
  if (isRtlText(it.str)) return { x0, x1, extra, at };
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
// the box of characters c0..c1 of a run, padded as a black box is (fallback)
function paddedQuad(it, style, c0, c1, measureOf, g = runGeom(it)) {
  const { x0, x1, extra } = runRange(it, style, c0, c1, measureOf, g);
  const pad = 0.15 * g.fs + extra;
  return quadOf(g, x0 - pad, x1 + pad, -0.3 * g.fs, 1.05 * g.fs);
}

// ---- P37 (06/10): the exact place of each character, from the glyphs PDF.js draws ----
// Real iPhone pass of 06/10: redacting "photo-2" in "Image d'origine : photo-2.jpg", the black box covered the ":"
// before and ".j" after, and cut the "p" of "jpg": the positions were measured on the text with a browser font, then
// padded by 15 % of the font size on each side. Adobe Acrobat and MuPDF (PyMuPDF) cover the matched characters' own
// boxes (advance width × font height), no more. Now the glyphs of the page are placed from PDF.js's operator list with
// the arithmetic of PDF.js's own canvas drawing (font widths, Tc, Tw, Tz, TJ offsets, rise, text and page matrices,
// forms), each glyph's ink box is added (italic overhangs, accents), and each character of a text run is tied to its
// glyph(s) — only when the run's glyphs spell exactly the run's text, in drawing order or (right-to-left) reversed, and
// fill exactly the run's width; otherwise that run keeps the padded estimate above. A black box is then the union of
// the matched characters' boxes plus a margin of max(2 % of the font size, one pixel of the picture).

const IDENTITY = [1, 0, 0, 1, 0, 0];
const FONT_IDENTITY_MATRIX = [0.001, 0, 0, 0.001, 0, 0];
// m ∘ n: n applied first (as canvas transform() and PDF's cm)
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const six = (m) => { const r = [0, 1, 2, 3, 4, 5].map((i) => Number(m && m[i])); return r.every(Number.isFinite) ? r : null; };

/**
 * Every glyph drawn by a page's content, from PDF.js's operator list (page.getOperatorList({ annotationMode:
 * AnnotationMode.DISABLE })), placed as PDF.js's canvas places it (pdfjs-dist 5.7 display/canvas.js showText,
 * showType3Text): [{ u: its text, M: the matrix from the glyph's run space to PDF user space, x0, x1: its advance in run
 * units, x2: where the next glyph starts (spacing included), size, font, ch: the character PDF.js draws, accent }].
 * fontOf(name) → the PDF.js font object (page.commonObjs). Glyphs of vertical fonts are not returned.
 */
export function glyphsOfOperatorList(opList, OPS, fontOf) {
  const out = [];
  let st = { ctm: IDENTITY, font: null, size: 0, dir: 1, Tc: 0, Tw: 0, Th: 1, TL: 0, rise: 0, Tm: IDENTITY, x: 0, y: 0, lx: 0, ly: 0, bad: false };
  const stack = [];
  const push = () => stack.push({ ...st });
  const pop = () => { if (stack.length) st = stack.pop(); };
  const matrixArg = (a) => six(typeof a[0] === 'number' ? a : a[0]);
  const { fnArray, argsArray } = opList;
  for (let i = 0; i < fnArray.length; i++) {
    const a = argsArray[i] || [];
    switch (fnArray[i]) {
      case OPS.save: push(); break;
      case OPS.restore: pop(); break;
      case OPS.transform: { const m = matrixArg(a); if (m) st.ctm = mul(st.ctm, m); else st.bad = true; break; }
      case OPS.paintFormXObjectBegin: { push(); if (a[0]) { const m = six(a[0]); if (m) st.ctm = mul(st.ctm, m); else st.bad = true; } break; }
      case OPS.paintFormXObjectEnd: pop(); break;
      case OPS.beginGroup: { push(); const gm = a[0] && a[0].matrix; if (gm) { const m = six(gm); if (m) st.ctm = mul(st.ctm, m); else st.bad = true; } break; }
      case OPS.endGroup: pop(); break;
      case OPS.beginText: st.Tm = IDENTITY; st.x = st.lx = 0; st.y = st.ly = 0; break;
      case OPS.setTextMatrix: { const m = matrixArg(a); if (m) st.Tm = m; else st.bad = true; st.x = st.lx = 0; st.y = st.ly = 0; break; }
      case OPS.moveText: st.lx += a[0]; st.ly += a[1]; st.x = st.lx; st.y = st.ly; break;
      case OPS.setLeadingMoveText: st.TL = a[1]; st.lx += a[0]; st.ly += a[1]; st.x = st.lx; st.y = st.ly; break;
      case OPS.setLeading: st.TL = -a[0]; break;
      case OPS.nextLine: st.ly += st.TL; st.x = st.lx; st.y = st.ly; break;
      case OPS.setCharSpacing: st.Tc = a[0]; break;
      case OPS.setWordSpacing: st.Tw = a[0]; break;
      case OPS.setHScale: st.Th = a[0] / 100; break;
      case OPS.setTextRise: st.rise = a[0]; break;
      case OPS.setFont: { const f = fontOf(a[0]); st.font = f || null; st.dir = a[1] < 0 ? -1 : 1; st.size = Math.abs(a[1]); break; }
      case OPS.setGState: { for (const [k, v] of a[0] || []) if (k === 'Font') { st.font = fontOf(v[0]) || null; st.dir = v[1] < 0 ? -1 : 1; st.size = Math.abs(v[1]); } break; }
      case OPS.showText: showText(a[0]); break;
      default: break;
    }
  }
  return out;

  function showText(glyphs) {
    const f = st.font;
    if (!Array.isArray(glyphs) || !st.size) return;
    if (!f) { st.bad = true; return; }
    const fm = six(f.fontMatrix || FONT_IDENTITY_MATRIX) || FONT_IDENTITY_MATRIX;
    const type3 = !!f.isType3Font;
    const Th = st.Th * st.dir;
    let x = 0;
    if (f.vertical) {
      for (const g of glyphs) {
        if (typeof g === 'number') { x += g * st.size / 1000; continue; }
        const spacing = (g.isSpace ? st.Tw : 0) + st.Tc;
        const w = g.vmetric ? -g.vmetric[0] : g.width;
        x += w * st.size * fm[0] - spacing * st.dir;
      }
      st.y -= x;
      return;
    }
    // a glyph is placed only if everything that moves it is known (else its run keeps the padded estimate)
    const M = st.bad ? null : mul(mul(st.ctm, st.Tm), [Th, 0, 0, 1, st.x, st.y + st.rise]);
    if (f.isInvalidPDFjsFont) {
      let total = 0;
      for (const g of glyphs) if (typeof g !== 'number') total += g.width;
      total *= st.size * fm[0];
      for (const g of glyphs) if (typeof g !== 'number') out.push({ u: g.unicode || '', M, x0: 0, x1: total, x2: total, size: st.size, font: f, ch: null, accent: null, rough: true });
      st.x += total * Th;
      return;
    }
    for (const g of glyphs) {
      if (typeof g === 'number') { x -= g * st.size / 1000; continue; }
      const spacing = (g.isSpace ? st.Tw : 0) + st.Tc;
      const adv = type3 ? (g.width * fm[0] + fm[4]) * st.size : g.width * st.size * fm[0];
      const step = type3 ? adv + spacing : adv + spacing * st.dir;
      out.push({ u: g.unicode || '', M, x0: x, x1: x + adv, x2: x + step, size: st.size, font: f, ch: type3 ? null : g.fontChar, accent: g.accent || null, rough: false });
      x += step;
    }
    st.x += x * Th;
  }
}

// text compared between a run and its glyphs: compatibility-decomposed, without accents (they are often separate
// glyphs, or none), without spaces (PDF.js adds them for gaps), one UTF-16 unit at a time
const MARKS = /[\p{M}¨´ˆ-˝`¯¸]/gu;
const unitsOf = (s) => (s || '').normalize('NFKD').replace(MARKS, '').replace(/\s+/g, '').split('');
const isLtrUnit = (c) => /[\p{N}]/u.test(c) || (/\p{L}/u.test(c) && !RTL_CHAR.test(c));

/**
 * A right-to-left word or run in the other order: the order of its runs reversed, and the characters of each
 * right-to-left run reversed (a run of digits or Latin letters keeps its own order). keyOf(x) → the text of element x.
 * Its own inverse: the drawing order of a word in reading order, and back.
 */
export function bidiReorder(arr, keyOf = (x) => x) {
  const type = arr.map((x) => (isLtrUnit((keyOf(x) || '').normalize('NFKD')[0] || '') ? 'L' : 'R'));
  // a separator between two left-to-right characters (1,250 / 15:30 / info@example.com) belongs to their run
  for (let i = 1; i < arr.length - 1; i++) if (type[i] === 'R' && /^[.,:/%+@_-]$/.test(keyOf(arr[i])) && type[i - 1] === 'L' && type[i + 1] === 'L') type[i] = 'L';
  const runs = [];
  arr.forEach((x, i) => { const last = runs[runs.length - 1]; if (last && last.t === type[i]) last.xs.push(x); else runs.push({ t: type[i], xs: [x] }); });
  return runs.reverse().flatMap((r) => (r.t === 'L' ? r.xs : r.xs.reverse()));
}

// A glyph's rectangles in its run space (x along the run, y up, the font size included): adv, its advance × the font's
// height (ascent, descent); ink, its ink boxes (the glyph, and its accent when PDF.js draws one) or null when the ink is
// not known.
function glyphRects(gl, style, inkOf) {
  const f = gl.font || {}, s = gl.size;
  let asc = Number(f.ascent ?? style.ascent), desc = Number(f.descent ?? style.descent);
  asc = Number.isFinite(asc) && asc > 0 ? Math.min(Math.max(asc, 0.7), 1.6) : 0.9;
  desc = Number.isFinite(desc) && desc < 0 ? Math.max(Math.min(desc, -0.1), -0.8) : -0.25;
  const rect = (x0, x1, y0, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const adv = rect(gl.x0, gl.x1, desc * s, asc * s);
  const okInk = (i) => i && i.length === 4 && i.every(Number.isFinite) && i[2] - i[0] < 4 && i[3] - i[1] < 4;
  const ink = gl.ch ? inkOf(gl.font, gl.ch) : null;
  if (!okInk(ink)) return { adv, ink: null };
  const out = [rect(gl.x0 + ink[0] * s, gl.x0 + ink[2] * s, ink[1] * s, ink[3] * s)];
  if (gl.accent) {
    const ai = gl.accent.fontChar ? inkOf(gl.font, gl.accent.fontChar) : null;
    if (!okInk(ai)) return { adv, ink: null };
    const ox = gl.x0 + (gl.accent.offset?.x || 0) * s, oy = (gl.accent.offset?.y || 0) * s;
    out.push(rect(ox + ai[0] * s, ox + ai[2] * s, oy + ai[1] * s, oy + ai[3] * s));
  }
  return { adv, ink: out };
}

/**
 * P37: the black boxes of the terms found in the GLYPHS drawn, independently of PDF.js's text runs (a safety net: the
 * f4b trap of the P33 review draws "Mu", a combining diaeresis moved back over the "u", then "ller", and PDF.js placed
 * the run "ller" 6 pt left of where it is drawn, so the padded estimate left the tail of the "r" visible). The glyphs'
 * text in drawing order (accents, case, spaces and hyphens ignored, as the search does) is searched for each term,
 * and for a right-to-left term its reverse too; every glyph from the first to the last of a match is covered: its
 * advance × font height and ink box, plus the margin, or padded as before when its ink is not known. glyphs:
 * glyphsOfOperatorList(…); styles: the page's text styles (unused keys are fine). Returns quadrilaterals.
 */
export function glyphTermQuads(glyphs, terms, inkOf = () => null, px = 0.5) {
  let hay = '';
  const at = [];
  glyphs.forEach((gl, n) => { if (!gl.M) return; for (const ch of norm(gl.u)) { hay += ch; at.push(n); } });
  const quads = [];
  for (const term of terms) {
    const needle = norm(term);
    if (!needle) continue;
    const needles = isRtlText(needle) ? [needle, Array.from(needle).reverse().join('')] : [needle];
    for (const nd of new Set(needles)) {
      for (let j = hay.indexOf(nd); j >= 0; j = hay.indexOf(nd, j + 1)) {
        const first = at[j], last = at[j + nd.length - 1];
        for (let n = Math.min(first, last); n <= Math.max(first, last); n++) {
          const gl = glyphs[n];
          if (!gl.M) continue;
          const { adv, ink } = glyphRects(gl, {}, inkOf);
          const sx = Math.hypot(gl.M[0], gl.M[1]) || 1, sy = Math.hypot(gl.M[2], gl.M[3]) || 1;
          const pts = [adv, ...(ink || [])].flat();
          let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
          const fs = gl.size * sy;
          if (ink) { const m = Math.max(0.02 * fs, px); x0 -= m / sx; x1 += m / sx; y0 -= m / sy; y1 += m / sy; }
          else { x0 -= (0.15 * fs) / sx; x1 += (0.15 * fs) / sx; y0 = Math.min(y0, -0.3 * gl.size); y1 = Math.max(y1, 1.05 * gl.size); }
          quads.push([[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => apply(gl.M, x, y)));
        }
      }
    }
  }
  return quads;
}

/**
 * For each text item: null (its characters cannot be placed exactly: the padded estimate is used) or { fs, chars }
 * where chars[c] is null (a space, or a character without a glyph of its own) or the box of character c in the run's
 * frame (runGeom: u along the baseline from the run's start, v up from it, user space units): { a0, a1: its advance,
 * lo, hi, dn, up: advance and ink together, pad: its ink is not known }. inkOf(font, ch) → [left, bottom, right, top]
 * of the glyph's ink in em, or null when not known.
 */
export function itemGeometry(items, styles, glyphs, inkOf = () => null) {
  const placed = glyphs.filter((gl) => gl.M).map((gl) => {
    const p0 = apply(gl.M, gl.x0, 0), p1 = apply(gl.M, gl.x1, 0), p2 = apply(gl.M, gl.x2, 0);
    const d = Math.hypot(gl.M[0], gl.M[1]) || 1;
    return { gl, p0, p1, p2, dir: [gl.M[0] / d, gl.M[1] / d] };
  });
  return items.map((it) => { try { return itemChars(it, styles[it.fontName] || {}, placed, inkOf); } catch { return null; } });
}

function itemChars(it, style, placed, inkOf) {
  if (!it.str || style.vertical || !Array.isArray(it.transform) || !(it.width > 0)) return null;
  const g = runGeom(it);
  const det = g.ux[0] * g.uy[1] - g.ux[1] * g.uy[0];
  if (!(Math.abs(det) > 1e-6)) return null;
  const toUV = ([x, y]) => { const dx = x - g.tx, dy = y - g.ty; return [(dx * g.uy[1] - dy * g.uy[0]) / det, (g.ux[0] * dy - g.ux[1] * dx) / det]; };
  const fs = g.fs, W = it.width;
  const tol = 0.02 * fs + 0.01;
  // the glyphs drawn on this run's baseline, inside its width, in drawing order
  const members = [];
  for (const P of placed) {
    if (P.dir[0] * g.ux[0] + P.dir[1] * g.ux[1] < 0.999) continue;
    const [u0, v0] = toUV(P.p0), [u1, v1] = toUV(P.p1);
    if (Math.abs(v0) > 0.2 * fs || Math.abs(v1) > 0.2 * fs) continue;
    if (Math.min(u0, u1) < -tol || Math.max(u0, u1) > W + tol) continue;
    members.push({ ...P, u0, u1, ue: toUV(P.p2)[0] });
  }
  if (!members.length || members.some((m) => m.gl.rough)) return null;
  // they must fill the run: from its start to its end (PDF.js counts the spacing after the last glyph in some runs,
  // not in others: either end is accepted)
  const start = Math.min(...members.map((m) => Math.min(m.u0, m.u1)));
  const advEnd = Math.max(...members.map((m) => Math.max(m.u0, m.u1))), penEnd = Math.max(...members.map((m) => Math.max(m.u1, m.ue)));
  const near = 0.05 * fs + 0.05;
  if (Math.abs(start) > near || (Math.abs(advEnd - W) > near && Math.abs(penEnd - W) > near)) return null;
  // the run's characters, unit by unit
  const strUnits = [];
  for (let c = 0; c < it.str.length; c++) for (const ch of unitsOf(it.str[c])) strUnits.push([ch, c]);
  // glyphs with text (in some order) against the run's text; a glyph with only an accent is tied to the glyph it is
  // drawn over (or the nearest one)
  const withText = members.filter((m) => unitsOf(m.gl.u).length);
  const accents = members.filter((m) => !unitsOf(m.gl.u).length && /\S/.test(m.gl.u || ''));
  // right to left: the glyphs reversed, or reversed by runs (digits and Latin keep their order); a glyph that carries
  // several characters (lam-alef) in its own order, or reversed with the rest — PDF.js reverses the whole run character
  // by character, so it reads such a glyph's "لا" as "ال" (docs/audit/ETUDE-EDITEUR-PDF-ARABE.md §4)
  const orders = [[withText, false]];
  if (it.dir === 'rtl' || isRtlText(it.str)) {
    const rev = [...withText].reverse(), runs = bidiReorder(withText, (m) => m.gl.u);
    orders.push([rev, false], [rev, true], [runs, false], [runs, true]);
  }
  let owner = null, flipped = false;
  for (const [order, inner] of orders) {
    const seq = order.flatMap((m) => { const u = unitsOf(m.gl.u); return (inner ? u.reverse() : u).map((ch) => [ch, m]); });
    if (seq.length !== strUnits.length || seq.some(([ch], q) => ch !== strUnits[q][0])) continue;
    owner = new Map(); // character → its glyphs
    seq.forEach(([, m], q) => { const c = strUnits[q][1]; if (!owner.has(c)) owner.set(c, new Set()); owner.get(c).add(m); });
    flipped = inner;
    break;
  }
  if (!owner) return null;
  const glyphChars = new Map(); // glyph → its characters
  for (const [c, ms] of owner) for (const m of ms) { if (!glyphChars.has(m)) glyphChars.set(m, []); glyphChars.get(m).push(c); }
  const extra = new Map(); // character → accent glyphs drawn over it
  for (const acc of accents) {
    const mid = (acc.u0 + acc.u1) / 2;
    let best = null, bd = Infinity;
    for (const m of withText) { const d = mid < Math.min(m.u0, m.u1) ? Math.min(m.u0, m.u1) - mid : mid > Math.max(m.u0, m.u1) ? mid - Math.max(m.u0, m.u1) : 0; if (d < bd) { bd = d; best = m; } }
    if (!best) return null;
    for (const c of glyphChars.get(best)) { if (!extra.has(c)) extra.set(c, []); extra.get(c).push(acc); }
  }
  // each glyph's box in the run's frame: its advance × the font's height, and its ink
  const boxCache = new Map();
  const boxOf = (m) => {
    if (boxCache.has(m)) return boxCache.get(m);
    const { adv, ink } = glyphRects(m.gl, style, inkOf);
    const span = (r) => { const pts = r.map(([x, y]) => toUV(apply(m.gl.M, x, y))); return { lo: Math.min(...pts.map((p) => p[0])), hi: Math.max(...pts.map((p) => p[0])), dn: Math.min(...pts.map((p) => p[1])), up: Math.max(...pts.map((p) => p[1])) }; };
    const a = span(adv);
    const box = { a0: a.lo, a1: a.hi, ...a, pad: !ink };
    if (ink) { const parts = [a, ...ink.map(span)]; Object.assign(box, { lo: Math.min(...parts.map((p) => p.lo)), hi: Math.max(...parts.map((p) => p.hi)), dn: Math.min(...parts.map((p) => p.dn)), up: Math.max(...parts.map((p) => p.up)) }); }
    boxCache.set(m, box);
    return box;
  };
  const chars = new Array(it.str.length).fill(null);
  for (const [c, ms] of owner) {
    const boxes = [...ms, ...(extra.get(c) || [])].map(boxOf);
    chars[c] = { a0: Math.min(...boxes.map((b) => b.a0)), a1: Math.max(...boxes.map((b) => b.a1)), lo: Math.min(...boxes.map((b) => b.lo)), hi: Math.max(...boxes.map((b) => b.hi)), dn: Math.min(...boxes.map((b) => b.dn)), up: Math.max(...boxes.map((b) => b.up)), pad: boxes.some((b) => b.pad) };
  }
  // the run's text with each multi-character glyph read in its own order again (for the invisible layer), when PDF.js
  // reversed it
  let text = null;
  if (flipped) {
    const out = it.str.split('');
    for (const [, cs] of glyphChars) {
      if (cs.length < 2) continue;
      const pos = [...new Set(cs)].sort((x, y) => x - y);
      const vals = pos.map((c) => it.str[c]).reverse();
      pos.forEach((c, n) => { out[c] = vals[n]; });
    }
    text = out.join('');
    if (text === it.str) text = null;
  }
  return { fs, chars, text };
}

// The exact box of characters c0..c1 of a run, with the black box's margin, or null when one of them is not placed
// (geo: the run's itemGeometry entry; px: the size of one pixel of the page's picture, user space units).
function exactBox(it, geo, c0, c1, px) {
  if (!geo) return null;
  let lo = Infinity, hi = -Infinity, dn = Infinity, up = -Infinity;
  const fs = geo.fs, m = Math.max(0.02 * fs, px || 0);
  for (let c = c0; c < c1; c++) {
    const b = geo.chars[c];
    if (!b) { if (unitsOf(it.str[c]).length) return null; continue; }
    // a glyph whose ink is not known (a Type 3 font, a font the browser did not load) is padded as before
    const [l, h, d, u] = b.pad ? [b.a0 - 0.15 * fs, b.a1 + 0.15 * fs, Math.min(b.dn, -0.3 * fs), Math.max(b.up, 1.05 * fs)] : [b.lo - m, b.hi + m, b.dn - m, b.up + m];
    lo = Math.min(lo, l); hi = Math.max(hi, h); dn = Math.min(dn, d); up = Math.max(up, u);
  }
  return lo < hi ? { lo, hi, dn, up } : null;
}

/**
 * The black boxes of a page: a quadrilateral (4 [x, y] points, PDF user space) per matched span and per box rect.
 * geometry: itemGeometry(…) of the page (optional; without it, every span is padded as before); px: one pixel of the
 * page's picture in user space units.
 */
export function redactionQuads(items, styles, spans, rects, measureOf, geometry = null, px = 0.5) {
  const quads = spans.map((sp) => {
    const it = items[sp.k];
    const g = runGeom(it);
    const b = exactBox(it, geometry && geometry[sp.k], sp.c0, sp.c1, px);
    return b ? quadOf(g, b.lo, b.hi, b.dn, b.up) : paddedQuad(it, styles[it.fontName] || {}, sp.c0, sp.c1, measureOf, g);
  });
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
 * to the word's left edge, PDF user space), width (along the baseline, user space units) }], in the page's text order.
 * Left out: every word touched by a matched span; every word whose box meets a black box (text spans and annotation
 * boxes) — its exact box when the run is placed exactly (P37), else padded as a black box is (the whole run's box when
 * the run's spacing cannot be measured); vertical text; a run with a degenerate matrix or no width. A right-to-left run
 * that is not placed exactly is kept whole (one piece, at the run's place) when nothing touches it, else left out.
 * spansOf(strs) is the page's own matching (terms and patterns): it is run again on the words kept, joined with nothing
 * in between, and the words of any match it finds are dropped too, until none is left (two kept words around a
 * removed one must not make a term).
 */
export function textLayerWords(items, styles, spans, quads, measureOf, spansOf, geometry = null) {
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
    const geo = geometry && geometry[k];
    const at = (x0, x1) => ({ transform: [ta, tb, tc, td, g.tx + g.ux[0] * x0, g.ty + g.ux[1] * x0], width: x1 - x0 });
    if (!geo && isRtlText(it.str)) {
      if (hits.length || quads.some((q) => quadsMeet(paddedQuad(it, style, 0, it.str.length, measureOf, g), q))) return;
      words.push({ str: it.str.trim(), ...at(0, it.width) });
      return;
    }
    for (const m of it.str.matchAll(/\S+/g)) {
      const c0 = m.index, c1 = m.index + m[0].length;
      if (hits.some(([h0, h1]) => h0 < c1 && c0 < h1)) continue;
      if (geo) {
        // every character of the word with text must have its place, else the word is left out
        const need = [];
        for (let c = c0; c < c1; c++) if (unitsOf(it.str[c]).length) need.push(c);
        if (!need.length || need.some((c) => !geo.chars[c])) continue;
        const bs = need.map((c) => geo.chars[c]);
        const box = { lo: Math.min(...bs.map((b) => b.lo)), hi: Math.max(...bs.map((b) => b.hi)), dn: Math.min(...bs.map((b) => b.dn)), up: Math.max(...bs.map((b) => b.up)) };
        if (bs.some((b) => b.pad)) Object.assign(box, { lo: box.lo - 0.15 * geo.fs, hi: box.hi + 0.15 * geo.fs });
        if (quads.some((q) => quadsMeet(quadOf(g, box.lo, box.hi, box.dn, box.up), q))) continue;
        const a0 = Math.min(...bs.map((b) => b.a0)), a1 = Math.max(...bs.map((b) => b.a1));
        if (a1 - a0 > 0) words.push({ str: geo.text ? geo.text.slice(c0, c1) : m[0], ...at(a0, a1) });
        continue;
      }
      if (quads.some((q) => quadsMeet(paddedQuad(it, style, c0, c1, measureOf, g), q))) continue;
      const { at: pos } = runRange(it, style, c0, c1, measureOf, g);
      if (!pos || !(pos.x1 - pos.x0 > 0)) continue;
      words.push({ str: m[0], ...at(pos.x0, pos.x1) });
    }
  });
  // control characters (a font's codes without text, as PDF.js reads them) are not written
  const clean = words.map((w) => ({ ...w, str: w.str.replace(/[\u0000-\u001f\u007f-\u009f]/g, '') })).filter((w) => /\S/.test(w.str));
  for (let kept = clean; ;) {
    const found = spansOf(kept.map((w) => w.str));
    if (!found.length) return kept;
    const drop = new Set(found.map((sp) => sp.k));
    kept = kept.filter((_, n) => !drop.has(n));
  }
}

/**
 * P37: the font of the invisible words in Arabic script (and any other word given to it): a Type 0 font with one code
 * per character, whose ToUnicode gives that character back, and whose glyph is the character's own glyph in the font
 * given (fontkit; Noto Sans Arabic on the page), subset at the end. The text is written in drawing order (bidiReorder)
 * one character per glyph, never shaped: the layer is invisible, only the text it gives back matters, and a shaped
 * cluster (lam-alef, a letter and its vowel) read back by PDF.js and Poppler in the wrong order (docs/audit/
 * ETUDE-EDITEUR-PDF-ARABE.md §4). Call finalize() once, before the document is saved.
 */
export function invisibleTextFont(doc, fk, lib, baseName = 'NotoSansArabic-Regular') {
  const { PDFName, PDFString, PDFHexString } = lib;
  const ctx = doc.context;
  const ref = ctx.nextRef();
  const name = 'InvisibleArabic';
  const cid = new Map(); // character → code
  const chars = [null];
  const upm = fk.unitsPerEm || 1000;
  const widths = [0];
  const glyphOf = (ch) => { try { return fk.glyphForCodePoint(ch.codePointAt(0)); } catch { return null; } };
  return {
    name, ref,
    /** str (reading order) → { hex, width at size 1 } or null */
    encode(str) {
      const visual = bidiReorder(Array.from(str));
      let hex = '', w = 0;
      for (const ch of visual) {
        if (!cid.has(ch)) {
          if (chars.length >= 0xfffe) return null;
          const gl = glyphOf(ch);
          cid.set(ch, chars.length);
          chars.push(ch);
          widths.push(gl && gl.id ? Math.round((gl.advanceWidth * 1000) / upm) : 500);
        }
        const c = cid.get(ch);
        hex += c.toString(16).padStart(4, '0');
        w += widths[c] / 1000;
      }
      return w > 0 ? { hex: PDFHexString.of(hex), width: w } : null;
    },
    async finalize() {
      const subset = fk.createSubset();
      const gids = chars.map((ch) => { if (!ch) return 0; const gl = glyphOf(ch); return gl && gl.id ? subset.includeGlyph(gl.id) : 0; });
      const bytes = await new Promise((resolve, reject) => {
        const parts = [];
        subset.encodeStream().on('data', (b) => parts.push(b)).on('end', () => { const n = parts.reduce((s, p) => s + p.length, 0), all = new Uint8Array(n); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; } resolve(all); }).on('error', reject);
      });
      const base = PDFName.of(`RDCTAR+${baseName}`); // a subset's tag: six capital letters
      const s = 1000 / upm;
      const bb = fk.bbox || { minX: 0, minY: -300, maxX: 1000, maxY: 1000 };
      const fontFile = ctx.register(ctx.flateStream(bytes, { Length1: bytes.length }));
      const descriptor = ctx.register(ctx.obj({ Type: 'FontDescriptor', FontName: base, Flags: 4, FontBBox: [Math.round(bb.minX * s), Math.round(bb.minY * s), Math.round(bb.maxX * s), Math.round(bb.maxY * s)], ItalicAngle: 0, Ascent: Math.round((fk.ascent || 1000) * s), Descent: Math.round((fk.descent || -300) * s), CapHeight: Math.round((fk.capHeight || 700) * s), StemV: 80, FontFile2: fontFile }));
      const map = new Uint8Array(chars.length * 2);
      gids.forEach((gid, c) => { map[2 * c] = gid >> 8; map[2 * c + 1] = gid & 255; });
      const cidToGid = ctx.register(ctx.flateStream(map));
      const cidFont = ctx.register(ctx.obj({ Type: 'Font', Subtype: 'CIDFontType2', BaseFont: base, CIDSystemInfo: { Registry: PDFString.of('Adobe'), Ordering: PDFString.of('Identity'), Supplement: 0 }, FontDescriptor: descriptor, DW: 1000, W: [1, widths.slice(1)], CIDToGIDMap: cidToGid }));
      const utf16 = (ch) => Array.from({ length: ch.length }, (_, i) => ch.charCodeAt(i).toString(16).padStart(4, '0')).join('');
      const entries = chars.slice(1).map((ch, i) => `<${(i + 1).toString(16).padStart(4, '0')}> <${utf16(ch)}>`);
      let cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n';
      for (let i = 0; i < entries.length; i += 100) cmap += `${Math.min(100, entries.length - i)} beginbfchar\n${entries.slice(i, i + 100).join('\n')}\nendbfchar\n`;
      cmap += 'endcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n';
      const toUnicode = ctx.register(ctx.flateStream(cmap));
      ctx.assign(ref, ctx.obj({ Type: 'Font', Subtype: 'Type0', BaseFont: base, Encoding: 'Identity-H', DescendantFonts: [cidFont], ToUnicode: toUnicode }));
    },
  };
}

/**
 * Writes `words` on `page` (pdf-lib) as invisible text (rendering mode 3), each word stretched (Tz) to its width: in
 * Helvetica (`font`), or, for a word in Arabic script, in `arabicFont` (invisibleTextFont, P37). toPage([x, y]) maps a
 * point of the source page's user space to the new page. A word neither can write (Helvetica's WinAnsi, even after
 * NFKC: ligatures, full-width forms; no Arabic font given) is skipped. Returns the number of words written.
 */
export function drawInvisibleWords(page, font, words, toPage, lib, arabicFont = null) {
  const { pushGraphicsState, popGraphicsState, beginText, endText, setFontAndSize, setTextRenderingMode, TextRenderingMode, setCharacterSqueeze, setTextMatrix, showText } = lib;
  const ops = [];
  const keys = new Map();
  let current = null, n = 0;
  for (const w of words) {
    let enc = null, f = null;
    if (arabicFont && hasArabic(w.str)) { enc = arabicFont.encode(w.str); f = arabicFont; }
    else {
      for (const s of [w.str, w.str.normalize('NFKC')]) { try { enc = { hex: font.encodeText(s), width: font.widthOfTextAtSize(s, 1) }; break; } catch { /* a character outside WinAnsi */ } }
      f = font;
    }
    if (!enc) continue;
    const [a, b, c, d, x, y] = w.transform;
    const o = toPage([x, y]), ex = toPage([x + a, y + b]), ey = toPage([x + c, y + d]);
    const A = ex[0] - o[0], B = ex[1] - o[1], C = ey[0] - o[0], D = ey[1] - o[1];
    const dl = Math.hypot(A, B);
    if (!(enc.width > 0) || !(dl > 0)) continue;
    const squeeze = (100 * w.width) / ((Math.hypot(a, b) || 1) * enc.width);
    if (!Number.isFinite(squeeze) || squeeze <= 0) continue;
    if (!keys.has(f)) keys.set(f, page.node.newFontDictionary(f.name, f.ref));
    if (current !== f) { ops.push(setFontAndSize(keys.get(f), 1)); current = f; }
    ops.push(setTextMatrix(A, B, C, D, o[0], o[1]), setCharacterSqueeze(squeeze), showText(enc.hex));
    n++;
  }
  if (ops.length) page.pushOperators(pushGraphicsState(), beginText(), setTextRenderingMode(TextRenderingMode.Invisible), ...ops, endText(), popGraphicsState());
  return n;
}
