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
