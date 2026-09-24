// Draws a QR matrix (from the `qrcode` package, MIT) as PNG, SVG or vector PDF, and reads it back.
// Quiet zone: 4 modules, what ISO/IEC 18004 requires (the old tool used 2). Every function pattern -- the three
// finders, the alignment and timing patterns, format and version info -- is drawn solid whatever the module
// shape: a reader locates the code with them. Measured 2026-09-23: with only the finders solid, the "Dots"
// shape did not read back at all (jsQR); with all function patterns solid, it does.

export const QUIET = 4;

export async function qrMatrix(payload, ecl) {
  const QRCode = (await import('qrcode')).default;
  const qr = QRCode.create(payload, { errorCorrectionLevel: ecl });
  const n = qr.modules.size;
  return { n, dark: (r, c) => qr.modules.get(r, c) === 1, fixed: (r, c) => !!qr.modules.isReserved(r, c), version: qr.version };
}

const inFinder = (n, r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

// Module rectangles in "module units" (0..n+2*QUIET), finders first.
function shapes(m, shape) {
  const out = [];
  for (let r = 0; r < m.n; r++) for (let c = 0; c < m.n; c++) {
    if (!m.dark(r, c)) continue;
    out.push({ x: c + QUIET, y: r + QUIET, kind: inFinder(m.n, r, c) || m.fixed(r, c) ? 'square' : shape });
  }
  return out;
}

// Logo box, in module units: at most 22 % of the code's width (about 5 % of its area, far inside the 30 %
// that level H can rebuild), centred, on a background-coloured pad.
export function logoBox(n) {
  const side = Math.floor(n * 0.22);
  const s = side % 2 === n % 2 ? side : side - 1; // same parity as n: centred on whole modules
  const o = (n - s) / 2 + QUIET;
  return { x: o, y: o, s };
}

export function drawCanvas(canvas, m, { size, fg, bg, shape, logo }) {
  const total = m.n + 2 * QUIET;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const k = size / total;
  const px = (u) => Math.round(u * k); // snap edges to whole pixels: no hairline seams between modules
  ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = fg;
  for (const s of shapes(m, shape)) {
    const x0 = px(s.x), y0 = px(s.y), w = px(s.x + 1) - x0, h = px(s.y + 1) - y0;
    if (s.kind === 'dots') { ctx.beginPath(); ctx.arc(x0 + w / 2, y0 + h / 2, Math.min(w, h) * 0.46, 0, 2 * Math.PI); ctx.fill(); }
    else if (s.kind === 'rounded') { ctx.beginPath(); ctx.roundRect(x0, y0, w, h, Math.min(w, h) * 0.3); ctx.fill(); }
    else ctx.fillRect(x0, y0, w, h);
  }
  if (logo) {
    const b = logoBox(m.n);
    const x = px(b.x), y = px(b.y), s = px(b.x + b.s) - x;
    ctx.fillStyle = bg; ctx.fillRect(x, y, s, s);
    const pad = s * 0.08, room = s - 2 * pad;
    const r = Math.min(room / logo.width, room / logo.height);
    const w = logo.width * r, h = logo.height * r;
    ctx.drawImage(logo, x + (s - w) / 2, y + (s - h) / 2, w, h);
  }
}

export function toSvg(m, { size, fg, bg, shape, logoDataUrl, logoAspect = 1 }) {
  const total = m.n + 2 * QUIET;
  const parts = [];
  // Squares merged into horizontal runs: a small file, and no anti-aliasing gaps between modules.
  const runs = [];
  const dots = [], rounded = [];
  for (let r = 0; r < m.n; r++) {
    let start = -1;
    for (let c = 0; c <= m.n; c++) {
      const sq = c < m.n && m.dark(r, c) && (shape === 'square' || inFinder(m.n, r, c) || m.fixed(r, c));
      if (c < m.n && m.dark(r, c) && !sq) (shape === 'dots' ? dots : rounded).push([r, c]);
      if (sq && start < 0) start = c;
      if (!sq && start >= 0) { runs.push(`M${start + QUIET} ${r + QUIET}h${c - start}v1h-${c - start}z`); start = -1; }
    }
  }
  parts.push(`<rect width="${total}" height="${total}" fill="${bg}"/>`);
  if (runs.length) parts.push(`<path fill="${fg}" d="${runs.join('')}"/>`);
  for (const [r, c] of dots) parts.push(`<circle cx="${c + QUIET + 0.5}" cy="${r + QUIET + 0.5}" r="0.46" fill="${fg}"/>`);
  for (const [r, c] of rounded) parts.push(`<rect x="${c + QUIET}" y="${r + QUIET}" width="1" height="1" rx="0.3" fill="${fg}"/>`);
  if (logoDataUrl) {
    const b = logoBox(m.n), pad = b.s * 0.08, room = b.s - 2 * pad;
    const w = logoAspect >= 1 ? room : room * logoAspect, h = logoAspect >= 1 ? room / logoAspect : room;
    parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.s}" height="${b.s}" fill="${bg}"/>`);
    parts.push(`<image x="${b.x + (b.s - w) / 2}" y="${b.y + (b.s - h) / 2}" width="${w}" height="${h}" href="${logoDataUrl}"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" shape-rendering="crispEdges">${parts.join('')}</svg>`;
}

const hexRgb = (hex) => { const h = hex.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };

// Vector PDF, one page the size of the code (QRCode Monkey also offers PDF). pngLogo: PNG bytes or null.
export async function toPdf(m, { sizePt = 288, fg, bg, shape, pngLogo, logoAspect = 1 }) {
  const { PDFDocument, rgb } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  const page = doc.addPage([sizePt, sizePt]);
  const total = m.n + 2 * QUIET, k = sizePt / total;
  const F = rgb(...hexRgb(fg)), B = rgb(...hexRgb(bg));
  page.drawRectangle({ x: 0, y: 0, width: sizePt, height: sizePt, color: B });
  for (const s of shapes(m, shape)) {
    const x = s.x * k, y = sizePt - (s.y + 1) * k;
    if (s.kind === 'dots') page.drawCircle({ x: x + k / 2, y: y + k / 2, size: k * 0.46, color: F });
    else page.drawRectangle({ x, y, width: k, height: k, color: F }); // rounded -> square in PDF
  }
  if (pngLogo) {
    const b = logoBox(m.n), img = await doc.embedPng(pngLogo);
    const x = b.x * k, y = sizePt - (b.y + b.s) * k, s = b.s * k, pad = s * 0.08, room = s - 2 * pad;
    const w = logoAspect >= 1 ? room : room * logoAspect, h = logoAspect >= 1 ? room / logoAspect : room;
    page.drawRectangle({ x, y, width: s, height: s, color: B });
    page.drawImage(img, { x: x + (s - w) / 2, y: y + (s - h) / 2, width: w, height: h });
  }
  return doc.save();
}

// True when the drawn code, read back like a phone camera would (dark-on-light only), holds exactly `payload`.
// Compared on the raw bytes too: jsQR does not always turn UTF-8 (accents, emoji) back into the same string.
export async function readsBackAs(canvas, payload) {
  const r = await readBack(canvas);
  if (!r) return false;
  if (r.text === payload) return true;
  const want = new TextEncoder().encode(payload);
  return r.bytes.length === want.length && r.bytes.every((b, i) => b === want[i]);
}

async function readBack(canvas) {
  const jsQR = (await import('jsqr')).default;
  const maxSide = 800; // decoding a 2000 px image is slow and proves nothing more
  let src = canvas;
  if (canvas.width > maxSide) {
    src = document.createElement('canvas'); src.width = maxSide; src.height = maxSide;
    const c = src.getContext('2d'); c.imageSmoothingEnabled = true; c.drawImage(canvas, 0, 0, maxSide, maxSide);
  }
  const d = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, src.width, src.height);
  const r = jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' });
  return r ? { text: r.data, bytes: r.binaryData } : null;
}

// WCAG relative luminance contrast; scanners need a dark code on a light background.
export function contrast(fg, bg) {
  const L = (hex) => { const [r, g, b] = hexRgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const a = L(fg), b = L(bg);
  return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), darkOnLight: a < b };
}
