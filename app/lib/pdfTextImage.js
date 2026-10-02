// A text the standard PDF fonts cannot write (Chinese, Cyrillic, Arabic, emoji…), drawn by the browser — whose fonts
// cover every script — into a transparent PNG at 4× for print. P24 (03/10): PDF Watermark and PDF Number Pages.

/** Can this pdf-lib standard font (WinAnsi: Latin-1 plus €, ’, –, …) write the whole text? */
export function fontCanWrite(font, text) {
  try { font.encodeText(text); return true; } catch { return false; }
}

/** { bytes (PNG), width, height } in points, the text set at sizePt in `color` (CSS colour). */
export async function textAsPng(text, sizePt, color, bold = false) {
  const k = 4, c = document.createElement('canvas'), ctx = c.getContext('2d');
  const font = `${bold ? 'bold ' : ''}${sizePt * k}px system-ui, "Segoe UI", "Noto Sans", sans-serif`;
  ctx.font = font;
  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || sizePt * k * 0.8, desc = m.actualBoundingBoxDescent || sizePt * k * 0.2;
  const w = Math.ceil(m.width) + 2 * k, h = Math.ceil(asc + desc) + 2 * k;
  c.width = w; c.height = h;
  ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, k, k + asc);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  if (!blob) throw new Error('This browser could not draw the text.');
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w / k, height: h / k, baseline: (k + desc) / k };
}
