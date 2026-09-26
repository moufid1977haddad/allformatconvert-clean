// Barcode rendering with bwip-js (MIT; BWIPP, Barcode Writer in Pure PostScript) -- the engine the in-browser
// competitors use (barcode-maker.com, barqode.io, read in their bundles on 26/09/2026).
//
// Sizes are physical: a module width X (mm, mil or px) and a resolution (dpi).
//  - Raster (PNG, JPG, GIF): one module is a whole number of pixels, round(X * dpi / 25.4), so bars print without
//    blur; the X actually obtained is shown. bwip-js draws one module as `scale` pixels, bars `height` mm tall at
//    72 dpi times `scale`, text `textsize` points times `scale` (measured), hence the conversions below.
//  - Vector (SVG, EPS, PDF): drawn at 20 units per module then scaled to the exact X: bwip-js rounds bar heights to
//    whole units, which at 1 unit per module turned 10 mm into 9.57 mm (measured); at 20 the error is <= 1/20 module.
import { IS_2D } from './symbologies';

export const VECTOR_UNITS_PER_MODULE = 20;
const MM_PER_MIL = 0.0254;

// Recommended quiet zone, in modules, when the visitor leaves it on "auto" (ISO/GS1 figures, largest side).
export function autoQuietZone(sym) {
  switch (sym.bcid) {
    case 'qrcode': return 4;
    case 'microqrcode': return 2;
    case 'datamatrix': case 'gs1datamatrix': case 'maxicode': return 1;
    case 'pdf417': case 'micropdf417': return 2;
    case 'azteccode': return 1;
    case 'ean13': case 'isbn': case 'ismn': case 'issn': return 11;
    case 'upca': case 'upce': return 9;
    case 'ean8': return 7;
    case 'pharmacode': return 6;
    default: return sym.bcid.startsWith('databar') ? 1 : 10;
  }
}

// ui: { unit: 'mm'|'mil'|'px', module, dpi, height (mm, or px when unit is px), textPt, showText, barColor,
//       bgColor, transparent, textColor, rotate: 'N'|'R'|'I'|'L', quiet ('' = auto, else modules),
//       checkDigit, msiCheck, qrEc, dmShape, pdfColumns, pdfEc, aztecEc }
export function physical(ui) {
  const dpi = ui.unit === 'px' ? 96 : clamp(Number(ui.dpi) || 300, 72, 2400);
  const xMm = ui.unit === 'mm' ? Number(ui.module) : ui.unit === 'mil' ? Number(ui.module) * MM_PER_MIL : (Number(ui.module) * 25.4) / 96;
  const heightMm = ui.unit === 'px' ? (Number(ui.height) * 25.4) / 96 : Number(ui.height);
  const px = Math.max(1, Math.round((xMm * dpi) / 25.4));
  return { dpi, xMm, heightMm, pxPerModule: px, rasterXmm: (px * 25.4) / dpi };
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hex = (c) => String(c || '#000000').replace('#', '').toUpperCase();

// bwip-js options for `scale` units per module, `unitsPerMm` units per millimetre of the final output.
export function bwipOptions(sym, text, ui, scale, unitsPerMm) {
  const p = physical(ui);
  const twoD = IS_2D(sym);
  const o = { bcid: sym.bcid, text, scale, rotate: ui.rotate || 'N', barcolor: hex(ui.barColor), ...(sym.extra || {}) };
  if (!twoD) {
    // bar height in bwip-js units: mm at 72 dpi, times scale
    o.height = Math.max(1, (p.heightMm * unitsPerMm * 25.4) / (72 * scale));
    if (ui.showText) {
      o.includetext = true; o.textxalign = 'center'; o.textcolor = hex(ui.textColor);
      o.textsize = Math.max(4, (Number(ui.textPt) * 25.4 * unitsPerMm) / (72 * scale));
    }
  }
  if (!ui.transparent) o.backgroundcolor = hex(ui.bgColor);
  const q = ui.quiet === '' || ui.quiet == null ? autoQuietZone(sym) : clamp(Number(ui.quiet), 0, 50);
  o.paddingwidth = q; o.paddingheight = twoD ? q : Math.min(q, 2);
  if (sym.gs1) o.parse = false;
  if (sym.checkOption && ui.checkDigit) o[sym.checkOption] = true;
  if (sym.msi) { if (ui.msiCheck && ui.msiCheck !== 'none') { o.includecheck = true; o.checktype = ui.msiCheck; } }
  if (sym.twoD === 'qr' && ui.qrEc) o.eclevel = ui.qrEc;
  if (sym.twoD === 'dm' && ui.dmShape === 'rectangle') o.format = 'rectangle';
  if (sym.twoD === 'pdf417') { if (Number(ui.pdfColumns) > 0) o.columns = clamp(Number(ui.pdfColumns), 1, 30); if (ui.pdfEc !== '' && ui.pdfEc != null) o.eclevel = clamp(Number(ui.pdfEc), 0, 8); }
  if (sym.twoD === 'aztec' && ui.aztecEc) o.eclevel = clamp(Number(ui.aztecEc), 5, 95);
  return o;
}

// bwip-js's error text without its internal prefix: "bwipp.ean13badLength#10131: EAN-13 must be..." -> "EAN-13 must be..."
export const cleanError = (e) => String(e?.message || e).replace(/^(bwipp|bwip-js)\.[\w#]+:\s*/, '');

let bwip = null;
async function engine() { bwip ??= (await import('bwip-js/browser')).default; return bwip; }

export async function renderCanvas(sym, text, ui, canvas) {
  const b = await engine();
  const p = physical(ui);
  b.toCanvas(canvas, bwipOptions(sym, text, ui, p.pxPerModule, p.dpi / 25.4));
  return canvas;
}

// Vector SVG at the exact physical size (width/height in mm).
export async function renderSvg(sym, text, ui) {
  const b = await engine();
  const p = physical(ui);
  const k = VECTOR_UNITS_PER_MODULE;
  const svg = b.toSVG(bwipOptions(sym, text, ui, k, k / p.xMm));
  const [, , w, h] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  const mmPerUnit = p.xMm / k;
  const sized = svg.replace('<svg ', `<svg width="${fmt(w * mmPerUnit)}mm" height="${fmt(h * mmPerUnit)}mm" `);
  return { svg: sized, raw: svg, w, h, mmPerUnit };
}
const fmt = (n) => String(Math.round(n * 10000) / 10000);

/* ---------- SVG (bwip-js's own output) -> drawing operations ----------
   bwip-js writes only <path> elements: bars as vertical strokes (M x y1 L x y2, stroke-width w) and everything
   else (modules, glyphs) as filled paths with M L Q C Z and a fill-rule (checked on all 35 types). */
function parseSvg(svg) {
  const ops = [];
  for (const m of svg.matchAll(/<path ([^>]*)\/?>/g)) {
    const a = m[1]; const attr = (n) => (a.match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1];
    const d = attr('d') || '';
    const stroke = attr('stroke'); const sw = Number(attr('stroke-width') || 0);
    if (stroke && sw) {
      for (const seg of d.matchAll(/M\s*([\d.-]+)\s+([\d.-]+)\s*L\s*([\d.-]+)\s+([\d.-]+)/g)) {
        const [x1, y1, x2, y2] = seg.slice(1).map(Number);
        if (x1 === x2) ops.push({ rect: [x1 - sw / 2, Math.min(y1, y2), sw, Math.abs(y2 - y1)], color: stroke });
        else if (y1 === y2) ops.push({ rect: [Math.min(x1, x2), y1 - sw / 2, Math.abs(x2 - x1), sw], color: stroke });
        else throw new Error('Unexpected slanted stroke in the barcode drawing.');
      }
    } else {
      ops.push({ path: tokens(d), color: attr('fill') || '#000000', evenodd: attr('fill-rule') === 'evenodd' });
    }
  }
  return ops;
}
function tokens(d) {
  const out = []; const re = /([MLQCZ])([^MLQCZ]*)/gi;
  for (const m of d.matchAll(re)) out.push([m[1].toUpperCase(), (m[2].match(/-?[\d.]+(?:e-?\d+)?/gi) || []).map(Number)]);
  return out;
}
const rgb = (c) => { const h = c.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const n3 = (v) => String(Math.round(v * 1000) / 1000);

// Path operators shared by PostScript and PDF (same m/l/c semantics); y is flipped (SVG down, PS/PDF up).
function pathOps(path, s, H, kw) {
  let cx = 0, cy = 0; const o = [];
  const X = (x) => n3(x * s), Y = (y) => n3((H - y) * s);
  for (const [c, v] of path) {
    if (c === 'M') { for (let i = 0; i < v.length; i += 2) { o.push(`${X(v[i])} ${Y(v[i + 1])} ${i ? kw.l : kw.m}`); cx = v[i]; cy = v[i + 1]; } }
    else if (c === 'L') { for (let i = 0; i < v.length; i += 2) { o.push(`${X(v[i])} ${Y(v[i + 1])} ${kw.l}`); cx = v[i]; cy = v[i + 1]; } }
    else if (c === 'Q') {
      for (let i = 0; i < v.length; i += 4) { // quadratic -> cubic, exactly
        const [qx, qy, x, y] = v.slice(i, i + 4);
        const c1x = cx + (2 / 3) * (qx - cx), c1y = cy + (2 / 3) * (qy - cy), c2x = x + (2 / 3) * (qx - x), c2y = y + (2 / 3) * (qy - y);
        o.push(`${X(c1x)} ${Y(c1y)} ${X(c2x)} ${Y(c2y)} ${X(x)} ${Y(y)} ${kw.c}`); cx = x; cy = y;
      }
    } else if (c === 'C') { for (let i = 0; i < v.length; i += 6) { const [a, b2, c2, d2, x, y] = v.slice(i, i + 6); o.push(`${X(a)} ${Y(b2)} ${X(c2)} ${Y(d2)} ${X(x)} ${Y(y)} ${kw.c}`); cx = x; cy = y; } }
    else if (c === 'Z') o.push(kw.h);
  }
  return o.join('\n');
}

// Encapsulated PostScript (EPS 3.0), vector, exact size in points.
export function svgToEps({ raw, w, h, mmPerUnit }, title = 'barcode') {
  const s = (mmPerUnit * 72) / 25.4; const W = w * s, H = h;
  const kw = { m: 'moveto', l: 'lineto', c: 'curveto', h: 'closepath' };
  const body = parseSvg(raw).map((op) => {
    const [r, g, b] = rgb(op.color).map(n3);
    if (op.rect) { const [x, y, rw, rh] = op.rect; return `${r} ${g} ${b} setrgbcolor ${n3(x * s)} ${n3((H - y - rh) * s)} ${n3(rw * s)} ${n3(rh * s)} rectfill`; }
    return `${r} ${g} ${b} setrgbcolor newpath\n${pathOps(op.path, s, H, kw)}\n${op.evenodd ? 'eofill' : 'fill'}`;
  }).join('\n');
  return `%!PS-Adobe-3.0 EPSF-3.0\n%%BoundingBox: 0 0 ${Math.ceil(W)} ${Math.ceil(h * s)}\n%%HiResBoundingBox: 0 0 ${n3(W)} ${n3(h * s)}\n%%Title: ${title.replace(/[^\x20-\x7e]/g, '?')}\n%%Creator: onlineconvertools.com Barcode Generator (bwip-js)\n%%Pages: 1\n%%EndComments\n%%Page: 1 1\ngsave\n${body}\ngrestore\nshowpage\n%%EOF\n`;
}

// PDF 1.4, one page the size of the barcode, vector.
export function svgToPdf({ raw, w, h, mmPerUnit }) {
  const s = (mmPerUnit * 72) / 25.4; const H = h;
  const kw = { m: 'm', l: 'l', c: 'c', h: 'h' };
  const content = parseSvg(raw).map((op) => {
    const [r, g, b] = rgb(op.color).map(n3);
    if (op.rect) { const [x, y, rw, rh] = op.rect; return `${r} ${g} ${b} rg ${n3(x * s)} ${n3((H - y - rh) * s)} ${n3(rw * s)} ${n3(rh * s)} re f`; }
    return `${r} ${g} ${b} rg\n${pathOps(op.path, s, H, kw)}\n${op.evenodd ? 'f*' : 'f'}`;
  }).join('\n');
  const enc = new TextEncoder();
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n3(w * s)} ${n3(h * s)}] /Contents 4 0 R /Resources << >> >>`,
    `<< /Length ${enc.encode(content).length} >>\nstream\n${content}\nendstream`,
    '<< /Producer (onlineconvertools.com Barcode Generator, bwip-js) >>',
  ];
  let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n'; const offsets = [];
  const bytes = () => enc.encode(out).length;
  objs.forEach((o, i) => { offsets.push(bytes()); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = bytes();
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return enc.encode(out);
}

/* ---------- raster files with their resolution written in ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8) => { let c = 0xffffffff; for (const b of u8) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

// PNG: a pHYs chunk (pixels per metre) right after IHDR, replacing any the encoder wrote.
export function pngWithDpi(u8, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const chunks = []; let i = 8;
  while (i < u8.length) { const len = new DataView(u8.buffer, u8.byteOffset + i).getUint32(0); const type = String.fromCharCode(...u8.subarray(i + 4, i + 8)); chunks.push({ type, bytes: u8.subarray(i, i + 12 + len) }); i += 12 + len; }
  const data = new Uint8Array(13); const dv = new DataView(data.buffer);
  data.set([0x70, 0x48, 0x59, 0x73]); dv.setUint32(4, ppm); dv.setUint32(8, ppm); data[12] = 1;
  const phys = new Uint8Array(21); const pv = new DataView(phys.buffer); pv.setUint32(0, 9); phys.set(data, 4); pv.setUint32(17, crc32(data));
  const parts = [u8.subarray(0, 8)];
  for (const c of chunks) { if (c.type === 'pHYs') continue; parts.push(c.bytes); if (c.type === 'IHDR') parts.push(phys); }
  return concat(parts);
}
// JPEG: the JFIF header's density set to dpi (browsers write 1:1 "no unit"); if there is no JFIF header, one is added.
export function jpgWithDpi(u8, dpi) {
  const d = Math.min(65535, Math.round(dpi));
  if (u8[2] === 0xff && u8[3] === 0xe0 && String.fromCharCode(...u8.subarray(6, 11)) === 'JFIF\0') {
    const out = u8.slice(); out[13] = 1; out[14] = d >> 8; out[15] = d & 255; out[16] = d >> 8; out[17] = d & 255; return out;
  }
  const app0 = new Uint8Array([0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 1, d >> 8, d & 255, d >> 8, d & 255, 0, 0]);
  return concat([u8.subarray(0, 2), app0, u8.subarray(2)]);
}
const concat = (parts) => { const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0)); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };

export const canvasBytes = (canvas, type, q) => new Promise((ok, ko) => canvas.toBlob((b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a))) : ko(new Error('This browser could not encode the image.'))), type, q));

// JPEG has no transparency: drawn over white (or the chosen background).
export async function jpegBytes(canvas, dpi, bg = '#FFFFFF') {
  const c = document.createElement('canvas'); c.width = canvas.width; c.height = canvas.height;
  const ctx = c.getContext('2d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(canvas, 0, 0);
  return jpgWithDpi(await canvasBytes(c, 'image/jpeg', 0.95), dpi);
}
// GIF: a barcode has a handful of colours, so the palette is exact (no dithering); transparency kept.
export async function gifBytes(canvas) {
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
  const { width, height } = canvas; const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
  const palette = quantize(rgba, 256, { format: 'rgba4444', oneBitAlpha: true });
  const index = applyPalette(rgba, palette, 'rgba4444');
  const t = palette.findIndex((c) => c[3] === 0);
  const gif = GIFEncoder(); gif.writeFrame(index, width, height, { palette, transparent: t >= 0, transparentIndex: Math.max(0, t) }); gif.finish();
  return gif.bytes();
}

/* ---------- contrast ---------- */
// Refused like on the QR Code Generator: a code lighter than its background, or under 3:1, does not scan reliably.
// A transparent background is judged against white paper.
const lum = (c) => rgb(c).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
export function contrastError(bar, bg, transparent) {
  const a = lum(bar), b = lum(transparent ? '#FFFFFF' : bg); const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  if (a > b) return transparent
    ? 'On a transparent background the bars must be dark: most scanners cannot read light bars (it would be printed on white paper). Pick a darker bar colour.'
    : 'The bars must be darker than the background: most scanners cannot read light bars on a dark background. Swap the two colours.';
  if (ratio < 3) return `These colours are too close (contrast ${ratio.toFixed(1)}:1, at least 3:1 is needed to scan reliably). Pick darker bars or a lighter background.`;
  return '';
}

/* ---------- what a reader should decode, for the read-back check ---------- */
const digits = (s) => s.replace(/\D/g, '');
const gtinCheck = (d) => { let sum = 0; for (let i = d.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += Number(d[i]) * w; return String((10 - (sum % 10)) % 10); };
function upceToUpca(e) { // 8 digits: number system, 6 data, check
  const [ns, d1, d2, d3, d4, d5, d6, ck] = e.split('');
  let m;
  if ('012'.includes(d6)) m = d1 + d2 + d6 + '0000' + d3 + d4 + d5;
  else if (d6 === '3') m = d1 + d2 + d3 + '00000' + d4 + d5;
  else if (d6 === '4') m = d1 + d2 + d3 + d4 + '00000' + d5;
  else m = d1 + d2 + d3 + d4 + d5 + '0000' + d6;
  return ns + m + ck;
}
// Returns the text zxing-cpp is expected to read, or null when this page cannot predict it (then it only checks
// that something of the right type was read).
export function expectedRead(sym, text, ui) {
  const t = text.trim();
  switch (sym.bcid) {
    case 'ean13': { const d = digits(t); return d.length === 12 ? d + gtinCheck(d) : d; }
    case 'ean8': { const d = digits(t); return d.length === 7 ? d + gtinCheck(d) : d; }
    case 'upca': { const d = digits(t); return d.length === 11 ? d + gtinCheck(d) : d; }
    case 'upce': { let d = digits(t); if (d.length === 7) { const a = upceToUpca(d + '0').slice(0, 11); d = d + gtinCheck(a); } return upceToUpca(d); }
    case 'itf14': { const d = digits(t); return d.length === 13 ? d + gtinCheck(d) : d; }
    case 'isbn': case 'ismn': { let d = digits(t); if (sym.bcid === 'isbn' && t.replace(/[-\s]/g, '').length === 10) { d = '978' + t.replace(/[-\s]/g, '').slice(0, 9); d += gtinCheck(d); } return d.length === 12 ? d + gtinCheck(d) : d.slice(0, 13); }
    case 'issn': { const d = '977' + t.replace(/[-\s]/g, '').slice(0, 7) + '00'; return d + gtinCheck(d); }
    case 'code32': { const d = digits(t).slice(0, 8); let sum = 0; for (let i = 0; i < 8; i++) { const v = Number(d[i]) * (i % 2 ? 2 : 1); sum += Math.floor(v / 10) + (v % 10); } return 'A' + d + (sum % 10); }
    case 'pzn': { const d = digits(t).slice(0, 7); let sum = 0; for (let i = 0; i < 7; i++) sum += Number(d[i]) * (i + 1); return '-' + d + (sum % 11); }
    case 'code39': case 'interleaved2of5': return ui.checkDigit ? null : t; // readers differ on whether they return an optional check character
    default: return t;
  }
}
// zxing reports UPC-A as its 13-digit EAN form (leading 0) and UPC-E expanded the same way (measured).
export const normalizeRead = (sym, s) => ((sym.bcid === 'upca' || sym.bcid === 'upce') && s.length === 13 && s[0] === '0' ? s.slice(1) : s);
