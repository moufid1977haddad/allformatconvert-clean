// PDF Redact matching (audit 2, 29/09).
// Before: a phrase was searched inside ONE pdf.js text item at a time. A phrase split over several items -- a word in
// bold, a line break, a kerning gap -- was not found and stayed in the file, silently; the redaction then covered the
// whole item (often the whole line) instead of the phrase; form field values and comments were never searched.
// Now the page's text is searched as one string, ignoring spaces and line breaks, case-insensitive (NFKC, so
// ligatures and full-width forms match), and each match is mapped back to the character range it covers in every item.

const norm = (s) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '');

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

// Text a pdf.js annotation carries (form field value, comment, alternate text).
export function annotationText(a) {
  const parts = [a.fieldValue, a.contentsObj && a.contentsObj.str, a.contents, a.alternativeText, a.textContent && [].concat(a.textContent).join(' ')];
  return parts.flat().filter((v) => typeof v === 'string').join(' ');
}

export const matchesText = (text, keyword) => !!norm(keyword) && norm(text).includes(norm(keyword));

// ---- P24 (03/10): several terms and automatic patterns, as iLovePDF's redaction offers (text search plus automatic
// e-mail, phone and card numbers; read 02/10). Patterns run on the page's text with the items joined as they follow
// each other (an address split between two items — a link in another font — is found), a line end (pdf.js hasEOL)
// becoming a line break no pattern crosses; every match is mapped back to the characters it covers in each item.
const LUHN = (digits) => { let s = 0; for (let i = 0; i < digits.length; i++) { let d = +digits[digits.length - 1 - i]; if (i % 2) { d *= 2; if (d > 9) d -= 9; } s += d; } return s % 10 === 0; };
export const PATTERNS = {
  email: { label: 'E-mail addresses', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, ok: () => true },
  // 9 to 15 digits with the usual separators (+1 514 555 0199, (514) 555-0199, 06 12 34 56 78); not an ISO date
  phone: { label: 'Phone numbers', re: /(?<!\d[ \t.-]?)(?:\+\d{1,3}[ \t.-]?)?(?:\(\d{1,4}\)[ \t.-]?)?\d[\d \t.-]{5,18}\d(?![ \t.-]?\d)/g, ok: (m) => { const n = m.replace(/\D/g, '').length; return n >= 9 && n <= 15 && !/^\d{4}-\d{2}-\d{2}$/.test(m.trim()); } },
  // 13 to 19 digits, grouped by spaces or dashes, passing the Luhn check (every real card number does)
  // never a piece of a longer number: no digit right before or after
  card: { label: 'Card numbers', re: /(?<!\d[ -]?)\d(?:[ -]?\d){12,18}(?![ -]?\d)/g, ok: (m) => LUHN(m.replace(/\D/g, '')) },
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
      if (!ok(m[0])) { re.lastIndex = m.index + 1; continue; }
      const byItem = new Map();
      for (let q = m.index; q < m.index + m[0].length; q++) {
        if (!at[q]) continue;
        const [k, c] = at[q];
        const s = byItem.get(k);
        if (s) { s.c0 = Math.min(s.c0, c); s.c1 = Math.max(s.c1, c + 1); } else byItem.set(k, { k, c0: c, c1: c + 1 });
      }
      for (const v of byItem.values()) spans.push({ ...v, m: `${kind}:${m.index}` });
    }
  }
  return spans;
}

/** "a\nb, c" typed by the visitor → the terms (one per line; a line is one term, commas included). */
export const termsOf = (text) => String(text || '').split(/\r?\n/).map((t) => t.trim()).filter((t) => norm(t));

/** Does an annotation's text hold one of the terms or patterns? */
export function annotationMatches(text, terms, kinds) {
  if (terms.some((t) => matchesText(text, t))) return true;
  return kinds.some((kind) => { const { re, ok } = PATTERNS[kind]; re.lastIndex = 0; for (let m; (m = re.exec(text));) if (ok(m[0])) return true; return false; });
}
