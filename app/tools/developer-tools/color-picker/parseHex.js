// P37 (06/10): a HEX code as people type it -- with or without "#", 3, 4, 6 or 8 digits (CSS Color 4: #rgb, #rgba,
// #rrggbb, #rrggbbaa), upper or lower case, spaces around ignored. Google's color picker and the browsers' own HEX
// fields take "ff0000" without its "#"; the page used to keep the old color for it.
// Returns null when the text is not such a code.
export function parseHex(text) {
  const m = /^\s*#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\s*$/i.exec(String(text ?? ''));
  if (!m) return null;
  let h = m[1].toLowerCase();
  if (h.length <= 4) h = [...h].map((c) => c + c).join('');
  const n = (i) => parseInt(h.slice(i, i + 2), 16);
  const alpha = h.length === 8 ? Math.round((n(6) / 255) * 1000) / 1000 : 1;
  return { hex: '#' + h, rgbHex: '#' + h.slice(0, 6), r: n(0), g: n(2), b: n(4), a: alpha };
}

// What the RGB card shows and copies: rgb(r,g,b), or rgba(r,g,b,a) when the code carries an alpha channel.
export function rgbText(c) {
  return c.a < 1 || c.hex.length === 9 ? `rgba(${c.r},${c.g},${c.b},${c.a})` : `rgb(${c.r},${c.g},${c.b})`;
}
