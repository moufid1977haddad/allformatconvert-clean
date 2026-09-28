// Page text from pdf.js text items, with line breaks and word spaces placed
// from the items' positions (29/09).
//
// Measured before: PDF Extract Text joined every item of a page with one
// space -- all line breaks were lost (a page came out as a single line), and
// any word pdf.js returns in several items (font change inside a word) would
// get a space inside it. Extractors of reference (Poppler's pdftotext, pdf.js's
// own text layer) place breaks from the baseline and spaces from the gap.

export function itemsToText(items) {
  let out = '';
  let lastY = null;
  let lastEnd = null;
  let lastH = 0;
  for (const it of items) {
    if (typeof it.str !== 'string') continue; // marked-content markers
    const x = it.transform[4];
    const y = it.transform[5];
    const h = Math.abs(it.height || it.transform[3] || 0) || lastH || 10;
    if (lastY !== null && Math.abs(y - lastY) > h * 0.5) {
      out += '\n';
    } else if (lastEnd !== null && it.str && !/\s$/.test(out) && !/^\s/.test(it.str) && x - lastEnd > h * 0.15) {
      out += ' ';
    }
    out += it.str;
    if (it.hasEOL) {
      out += '\n';
      lastY = null;
      lastEnd = null;
    } else if (it.str || it.width) {
      lastY = y;
      lastEnd = x + (it.width || 0);
      lastH = h;
    }
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
