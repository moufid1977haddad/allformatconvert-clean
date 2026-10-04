// Text to PDF beyond the Latin alphabet (30/09, known gap of 29/09: the built-in PDF font is Latin-1 only -- Polish
// "ł", Greek, Russian, Arabic, Hindi, Chinese… were refused). As word processors and the browser do, each character
// is drawn with a font that has it, from the Noto family (Google, SIL Open Font License 1.1, public/fonts/noto/OFL.txt):
// Noto Sans (Latin, Greek, Cyrillic, Vietnamese), Arabic, Hebrew, Devanagari, Tamil, Thai -- served by the
// site -- and Chinese / Japanese / Korean from the Noto Sans SC/JP/KR slices Google Fonts cuts by Unicode range
// (Fontsource 5.2.8 on jsDelivr, pinned): only the slices holding the text's characters are downloaded (tens of KB). fontkit shapes each run (Arabic joining, Indic conjuncts) and pdf-lib embeds only the
// glyphs used. Right-to-left paragraphs (Arabic, Hebrew) are right-aligned, their runs drawn from right to left.
// Everything happens in the browser: the text is never uploaded.
// pdf-lib is loaded when a PDF is made, not with the page (30/09/2026, Lighthouse).

// CJK: measured 30/09 with Poppler -- the CFF (.otf) Noto Sans CJK came out as empty boxes once pdf-lib subset it, and
// the variable TrueType lost most glyphs; Google Fonts' static 400-weight slices (TrueType in WOFF2) embed cleanly.
const CJK_CSS = { sc: 'noto-sans-sc', jp: 'noto-sans-jp', kr: 'noto-sans-kr' };
const CJK_BASE = 'https://cdn.jsdelivr.net/npm/@fontsource';
const CJK_VERSION = '5.2.8';
export const FONTS = {
  latin: '/fonts/noto/NotoSans-Regular.ttf',
  arabic: '/fonts/noto/NotoSansArabic-Regular.ttf',
  hebrew: '/fonts/noto/NotoSansHebrew-Regular.ttf',
  devanagari: '/fonts/noto/NotoSansDevanagari-Regular.ttf',
  tamil: '/fonts/noto/NotoSansTamil-Regular.ttf',
  thai: '/fonts/noto/NotoSansThai-Regular.ttf',
};
const RTL = new Set(['arabic', 'hebrew']);

// Script of one code point; null = neutral (space, digits and punctuation take their neighbours' font).
export function scriptOf(cp) {
  if ((cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f) || (cp >= 0x08a0 && cp <= 0x08ff) || (cp >= 0xfb50 && cp <= 0xfdff) || (cp >= 0xfe70 && cp <= 0xfeff)) return 'arabic';
  if ((cp >= 0x0590 && cp <= 0x05ff) || (cp >= 0xfb1d && cp <= 0xfb4f)) return 'hebrew';
  if ((cp >= 0x0900 && cp <= 0x097f) || (cp >= 0xa8e0 && cp <= 0xa8ff)) return 'devanagari';
  if (cp >= 0x0980 && cp <= 0x09ff) return 'bengali';
  if (cp >= 0x0b80 && cp <= 0x0bff) return 'tamil';
  if (cp >= 0x0e00 && cp <= 0x0e7f) return 'thai';
  if ((cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f) || (cp >= 0xac00 && cp <= 0xd7af)) return 'kr';
  if ((cp >= 0x3040 && cp <= 0x30ff) || (cp >= 0x31f0 && cp <= 0x31ff) || (cp >= 0xff65 && cp <= 0xff9f)) return 'jp';
  if ((cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x20000 && cp <= 0x2ffff) || (cp >= 0x3000 && cp <= 0x303f) || (cp >= 0xff00 && cp <= 0xff64)) return 'cjk';
  if (cp <= 0x40 || (cp >= 0x5b && cp <= 0x60) || (cp >= 0x7b && cp <= 0xbf) || (cp >= 0x2000 && cp <= 0x206f) || cp === 0xd7 || cp === 0xf7) return null;
  return 'latin';
}


// ---- Emoji and the other writing systems (P18, 01/10) ---------------------------------------------------------
// The in-browser engine above draws Latin, Greek, Cyrillic, Arabic, Hebrew, Devanagari, Tamil, Thai and CJK; it
// refused emoji and Bengali (fontkit does not form Bengali conjuncts). The reference converters print text with a
// browser engine and font fallback (fpdf2's documentation: fallback fonts + HarfBuzz shaping; Chromium does both).
// A text holding anything else is therefore printed by the site's own Chromium (Gotenberg, the renderer of HTML to
// PDF), whose Noto fonts (SIL OFL) cover every common script and Noto Color Emoji: measured 01/10 on production —
// emoji with skin tones, flags, family sequences in colour; Bengali, Gurmukhi, Gujarati, Telugu, Kannada, Malayalam,
// Odia, Sinhala, Myanmar, Khmer, Lao, Ethiopic, Georgian, Armenian shaped; every character read back by Poppler.
// Only the glyphs used go into the PDF; nothing is added to the page.

// Code points the in-browser engine draws (its fonts' ranges, conservatively).
function localCodePoint(cp) {
  const s = scriptOf(cp);
  if (s === 'bengali') return false;
  if (s !== 'latin') return true; // Arabic, Hebrew, Devanagari, Tamil, Thai, CJK, neutral ASCII / general punctuation
  return cp <= 0x052f || (cp >= 0x1e00 && cp <= 0x1fff) || (cp >= 0x2070 && cp <= 0x20cf) || (cp >= 0x2100 && cp <= 0x215f);
}

/** True when the text needs the browser-engine renderer (emoji, or a script the in-browser fonts don't draw). */
export function needsRenderer(text) {
  for (const ch of String(text)) {
    const cp = ch.codePointAt(0);
    if (cp === 0x200d || cp === 0xfe0f || cp === 0x20e3) return true; // emoji sequences
    if (/\p{Emoji_Presentation}/u.test(ch)) return true; // 👋 🎉 ✅, skin tones, flags (©, ™ stay text: local)
    if (!localCodePoint(cp)) return true;
  }
  return false;
}

// P24 (03/10): page size, orientation, text size and margins chosen by the visitor (Smallpdf's TXT to PDF has none;
// CloudConvert's page options apply to HTML). Sizes in points.
export const PAGE_SIZES = { A4: [595, 842], Letter: [612, 792], Legal: [612, 1008], A5: [420, 595] };
export function pageGeometry({ page = 'A4', landscape = false, margin = 50 } = {}) {
  const [w, h] = PAGE_SIZES[page] || PAGE_SIZES.A4;
  return landscape ? { W: h, H: w, margin } : { W: w, H: h, margin };
}

/** The HTML page printed by the renderer: the same page as the in-browser engine (same size, margins and text size). */
export function textToHtmlDocument(text, title = 'Document', { page = 'A4', landscape = false, margin = 50, fontSize = 12 } = {}) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clean = String(text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  // Han characters in the Japanese or Korean design when the text is Japanese or Korean, else Chinese (Simplified).
  const cjk = /[぀-ヿㇰ-ㇿ]/.test(clean) ? 'JP' : /[가-힯ᄀ-ᇿ㄰-㆏]/.test(clean) && !/[一-鿿]/.test(clean) ? 'KR' : 'SC';
  const paragraphs = clean.split('\n').map((p) => `<p dir="auto">${p ? esc(p) : '&#8203;'}</p>`).join('\n');
  // P32 (04/10): Arabic and Hebrew named, so the service draws them with the same Noto faces as the in-browser engine
  // (unnamed, Chromium's fallback picked DejaVu Sans for Arabic — measured on Gotenberg). The line height stays a
  // number (1.6 × the text size, the in-browser engine's pitch): Noto Sans Arabic's line metrics are 2.112 em
  // (Noto Sans: 1.362 em), so with "line-height: normal" every Arabic line came out 5.25 pt taller at 12 pt.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>
@page { size: ${page in PAGE_SIZES ? page : 'A4'}${landscape ? ' landscape' : ''}; margin: ${Number(margin) || 50}pt; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: 'Noto Sans', 'Noto Sans Arabic', 'Noto Sans Hebrew', 'Noto Sans CJK ${cjk}', 'Noto Color Emoji', sans-serif; font-size: ${Number(fontSize) || 12}pt; line-height: 1.6; color: #000; }
p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
</style></head><body>
${paragraphs}
</body></html>`;
}

// The slices of one CJK font: [{ url, ranges: [[from, to], …] }] from its @font-face rules.
async function cjkSlices(lang) {
  const base = `${CJK_BASE}/${CJK_CSS[lang]}@${CJK_VERSION}`;
  const r = await fetch(`${base}/400.css`);
  if (!r.ok) throw new Error('The Chinese / Japanese / Korean font could not be downloaded. Check your connection and try again.');
  const css = await r.text();
  const slices = [];
  // The WOFF (1) file, not the WOFF2: WOFF2 stores a transformed "glyf" table that fontkit decodes for drawing but
  // pdf-lib's subsetter copies as is -- the glyphs came out as garbage (Poppler, 30/09).
  for (const m of css.matchAll(/url\(\.\/files\/[^)]+\.woff2\) format\('woff2'\), url\(\.\/(files\/[^)]+\.woff)\)[^;]*;\s*unicode-range:\s*([^;]+);/g)) {
    const ranges = m[2].split(',').map((t) => t.trim().replace(/^U\+/i, '')).map((t) => { const [x, y] = t.split('-'); return [parseInt(x, 16), parseInt(y || x, 16)]; });
    slices.push({ url: `${base}/${m[1]}`, ranges });
  }
  return slices;
}

async function loadFont(pdfDoc, key, cache, onPhase) {
  if (!cache[key]) {
    cache[key] = (async () => {
      const r = await fetch(FONTS[key] || key); // a CJK slice's key is its URL
      if (!r.ok) throw new Error('A font needed for this text could not be downloaded. Check your connection and try again.');
      return pdfDoc.embedFont(new Uint8Array(await r.arrayBuffer()), { subset: true });
    })();
  }
  return cache[key];
}

// Runs of one font inside a line of text: [{ key, text }]. Neutral characters join the run before them when its font
// has them (Devanagari, Thai… fonts have no ":"), else Noto Sans.
function runsOf(text, cjk, has = () => true) {
  const runs = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    let key = scriptOf(cp);
    if (key === 'cjk' || key === 'jp' || key === 'kr') key = typeof cjk === 'function' ? cjk(cp) : 'latin';
    if (key === null) {
      const last = runs[runs.length - 1];
      if (last && (last.key === null || has(last.key, ch.codePointAt(0)))) { last.text += ch; continue; }
      if (last) { runs.push({ key: 'latin', text: ch }); continue; }
      runs.push({ key: null, text: ch }); continue;
    }
    const last = runs[runs.length - 1];
    if (last && (last.key === key || last.key === null)) { last.key = key; last.text += ch; } else runs.push({ key, text: ch });
  }
  for (const r of runs) if (r.key === null) r.key = 'latin';
  // Digits and Latin letters inside a right-to-left run are a left-to-right run of their own (bidi, simplified).
  const out = [];
  for (const r of runs) {
    if (!RTL.has(r.key)) { out.push(r); continue; }
    for (const part of r.text.split(/([0-9A-Za-z][0-9A-Za-z.,:%/-]*)/)) {
      if (!part) continue;
      out.push(/^[0-9A-Za-z]/.test(part) ? { key: 'latin', text: part } : { key: r.key, text: part });
    }
  }
  return out;
}

/**
 * @param {string} text  plain text (any script)
 * @returns {Promise<Uint8Array>} the PDF
 */
export async function textToPdf(text, { fontSize = 12, page: pageSize = 'A4', landscape = false, margin = 50, onPhase } = {}) {
  // @pdf-lib/fontkit's build calls a global regeneratorRuntime (Babel generators) in its OpenType layout code.
  if (typeof globalThis.regeneratorRuntime === 'undefined') globalThis.regeneratorRuntime = (await import('regenerator-runtime')).default;
  const fontkit = (await import('@pdf-lib/fontkit')).default;
  const { PDFDocument, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const clean = String(text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ');
  // Bengali: fontkit does not form its conjuncts (the word for 'world' came out broken, Poppler, 30/09) -- refused, not
  // written wrong.
  if (/[\u0980-\u09ff]/.test(clean)) throw new Error('Bengali text is not supported yet: its joined letters would not come out correctly in the PDF. Remove it, and the rest of your text converts.');
  // CJK characters: the slice holding each one (its URL is its font key). Hangul from Noto Sans KR, kana from JP,
  // ideographs and CJK punctuation in the Japanese design when the text has kana, else Chinese (Simplified), else KR.
  let cjk = null;
  if (/[\u1100-\u11ff\u3000-\u30ff\u3130-\u318f\u31f0-\u31ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]|[\ud840-\ud87f]/.test(clean)) {
    onPhase?.('Downloading the Chinese / Japanese / Korean font…');
    const hasKana = /[\u3040-\u30ff\u31f0-\u31ff]/.test(clean), hasHangul = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/.test(clean);
    const hasHan = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]|[\ud840-\ud87f]/.test(clean);
    const hanLang = hasKana ? 'jp' : hasHan || !hasHangul ? 'sc' : 'kr';
    const langs = [...new Set([hanLang, hasKana && 'jp', hasHangul && 'kr'].filter(Boolean))];
    const slices = Object.fromEntries(await Promise.all(langs.map(async (l) => [l, await cjkSlices(l)])));
    const find = (l, cp) => slices[l]?.find((sl) => sl.ranges.some(([x, y]) => cp >= x && cp <= y))?.url;
    const memo = new Map();
    cjk = (cp) => {
      if (!memo.has(cp)) {
        const k = scriptOf(cp);
        const first = k === 'kr' ? 'kr' : k === 'jp' ? 'jp' : hanLang;
        memo.set(cp, find(first, cp) || langs.map((l) => find(l, cp)).find(Boolean) || 'latin');
      }
      return memo.get(cp);
    };
  }
  const needed = new Set(runsOf(clean.replace(/\n/g, ' '), cjk).map((r) => r.key));
  needed.add('latin');
  const cache = {};
  const fonts = {};
  for (const k of needed) fonts[k] = await loadFont(pdfDoc, k, cache, onPhase);
  onPhase?.('Laying out the pages…');
  const sets = {};
  const has = (k, cp) => (sets[k] ||= new Set(fonts[k].getCharacterSet())).has(cp);
  const runs = (t) => runsOf(t, cjk, has);
  // Characters no font has (emoji, rare scripts) are named, never silently dropped.
  const missing = new Set();
  for (const r of runs(clean.replace(/\n/g, ' '))) for (const ch of r.text) if (ch.trim() && !has(r.key, ch.codePointAt(0))) missing.add(ch);
  if (missing.size) {
    const list = [...missing].slice(0, 20).join(' ');
    throw new Error(`These characters have no glyph in the fonts used (emoji and some rare scripts are not supported): ${list}${missing.size > 20 ? ' …' : ''}. Remove or replace them and convert again.`);
  }
  const { W, H } = pageGeometry({ page: pageSize, landscape, margin });
  const maxWidth = W - margin * 2, lineHeight = fontSize * 1.6;
  const widthOf = (s) => runs(s).reduce((n, r) => n + fonts[r.key].widthOfTextAtSize(r.text, fontSize), 0);
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  const lines = [];
  for (const paragraph of clean.split('\n')) {
    const firstStrong = runs(paragraph).find((r) => r.text.trim());
    const rtl = !!firstStrong && RTL.has(firstStrong.key);
    // Break opportunities: word boundaries (Intl.Segmenter knows Thai, Chinese and Japanese words), and inside a word
    // that is itself wider than the line.
    const pieces = seg ? [...seg.segment(paragraph)].map((s) => s.segment) : paragraph.split(/(\s+)/);
    let line = '';
    for (const piece of pieces) {
      const t = line + piece;
      if (widthOf(t) <= maxWidth || !line.trim()) {
        if (widthOf(t) > maxWidth) { // a single piece longer than the line: cut it by characters
          let cur = line;
          for (const ch of piece) { if (widthOf(cur + ch) > maxWidth && cur) { lines.push({ text: cur, rtl }); cur = ch; } else cur += ch; }
          line = cur;
        } else line = t;
      } else { lines.push({ text: line.replace(/\s+$/, ''), rtl }); line = piece.replace(/^\s+/, ''); }
    }
    lines.push({ text: line.replace(/\s+$/, ''), rtl });
  }
  let page = pdfDoc.addPage([W, H]);
  let y = H - margin - fontSize;
  for (const ln of lines) {
    if (y < margin) { page = pdfDoc.addPage([W, H]); y = H - margin - fontSize; }
    const lineRuns = runs(ln.text).filter((r) => r.text.length);
    if (!ln.rtl) {
      let x = margin;
      for (const r of lineRuns) { page.drawText(r.text, { x, y, size: fontSize, font: fonts[r.key], color: rgb(0, 0, 0) }); x += fonts[r.key].widthOfTextAtSize(r.text, fontSize); }
    } else {
      let x = W - margin; // right-aligned; the first run in reading order is the rightmost
      for (const r of lineRuns) {
        // spaces and punctuation between right-to-left words read right to left too
        const t = r.key === 'latin' && !/[\p{L}\p{N}]/u.test(r.text) ? [...r.text].reverse().join('') : r.text;
        const w = fonts[r.key].widthOfTextAtSize(t, fontSize); x -= w; page.drawText(t, { x, y, size: fontSize, font: fonts[r.key], color: rgb(0, 0, 0) });
      }
    }
    y -= lineHeight;
  }
  return pdfDoc.save();
}
