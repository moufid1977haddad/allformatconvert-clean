// BMP, GIF, ICO, TIFF and PDF output for Image Converter -- the outputs CloudConvert and Convertio offer beyond
// PNG/JPG/WebP/AVIF (docs/audit/RAPPORT-licence-et-ameliorations.md §5). Runs in the worker, on the decoded
// OffscreenCanvas. Every result is checked by its own signature bytes before it is handed over.
//   BMP  -- 24-bit, bottom-up, transparency flattened on white (32-bit BMP alpha is not read by most viewers)
//   GIF  -- 256-colour palette (Wu quantiser) with Floyd-Steinberg dithering, the way ImageMagick (CloudConvert's
//           engine) dithers by default; 1-bit transparency (image-q MIT, gifenc MIT)
//   ICO  -- favicon set: 16, 32, 48, 64, 128, 256 px (sizes up to the image's own), PNG-compressed entries
//   TIFF -- uncompressed RGBA, alpha kept (utif2, MIT)
//   PDF  -- one page the size of the image at 72 dpi; JPEG inside when opaque, PNG when transparent (pdf-lib, MIT)

const u8 = async (blob) => new Uint8Array(await blob.arrayBuffer());
const hasAlpha = (rgba) => { for (let i = 3; i < rgba.length; i += 4) if (rgba[i] < 255) return true; return false; };
const startsWith = (b, sig) => sig.every((v, i) => b[i] === v);
function verified(bytes, sig, what, type) {
  if (!bytes || bytes.length < 16 || !startsWith(bytes, sig)) throw new Error(`The ${what} encoder produced no valid file.`);
  return new Blob([bytes], { type });
}

function encodeBmp(rgba, w, h) {
  const row = Math.ceil((w * 3) / 4) * 4, size = 54 + row * h;
  const b = new Uint8Array(size), v = new DataView(b.buffer);
  b[0] = 0x42; b[1] = 0x4d; v.setUint32(2, size, true); v.setUint32(10, 54, true);
  v.setUint32(14, 40, true); v.setInt32(18, w, true); v.setInt32(22, h, true); v.setUint16(26, 1, true); v.setUint16(28, 24, true);
  v.setUint32(34, row * h, true); v.setInt32(38, 2835, true); v.setInt32(42, 2835, true); // 72 dpi
  for (let y = 0; y < h; y++) {
    const o = 54 + (h - 1 - y) * row;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = rgba[i + 3] / 255;
      b[o + x * 3] = Math.round(rgba[i + 2] * a + 255 * (1 - a));
      b[o + x * 3 + 1] = Math.round(rgba[i + 1] * a + 255 * (1 - a));
      b[o + x * 3 + 2] = Math.round(rgba[i] * a + 255 * (1 - a));
    }
  }
  return verified(b, [0x42, 0x4d], 'BMP', 'image/bmp');
}

// Palette: Wu quantiser (image-q) on a ~0.25 MP sample -- measured in image-compressor, same quality as the
// whole image, 3x faster. Dithering: Floyd-Steinberg written here over typed arrays. image-q's own
// "floyd-steinberg" was measured (2026-09-24, same photo, same palette) to give output identical pixel for pixel
// to no dithering at all -- 37.54 dB raw for both, banding in gradients -- and it builds one JS object per pixel.
// This one really dithers: 33.3 dB raw but 42.68 dB seen through a sigma-1 blur (how the eye averages dither)
// against 42.40 dB, and a 30-megapixel photo in 3.5 s. Nearest colour
// cached on a 6-bit-per-channel grid (5 bits cost 4.5 dB of PSNR on a photo, measured). Progress is reported so the page's 20 s silence watchdog (meant for a
// stuck TIFF decode) never mistakes a long GIF for a hang.
function samplePoints(iq, px, w, h) {
  const step = Math.max(1, Math.sqrt((w * h) / 262144));
  const sw = Math.max(1, Math.floor(w / step)), sh = Math.max(1, Math.floor(h / step));
  const out = new Uint8Array(sw * sh * 4);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const s = (Math.floor(y * step) * w + Math.floor(x * step)) * 4; out.set(px.subarray(s, s + 4), (y * sw + x) * 4); }
  return iq.utils.PointContainer.fromUint8Array(out, sw, sh);
}

export function ditherToIndices(rgba, w, h, pal, transparentIndex, onProgress) {
  const P = pal.length, pr = new Int16Array(P), pg = new Int16Array(P), pb = new Int16Array(P);
  pal.forEach((c, i) => { pr[i] = c[0]; pg[i] = c[1]; pb[i] = c[2]; });
  const cache = new Int16Array(262144).fill(-1);
  const nearest = (r, g, b) => {
    const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
    let best = cache[key];
    if (best >= 0) return best;
    let bd = Infinity;
    const rr = (r & ~3) + 2, gg = (g & ~3) + 2, bb = (b & ~3) + 2;
    for (let i = 0; i < P; i++) { const d = 0.2126 * (rr - pr[i]) ** 2 + 0.7152 * (gg - pg[i]) ** 2 + 0.0722 * (bb - pb[i]) ** 2; if (d < bd) { bd = d; best = i; } }
    cache[key] = best;
    return best;
  };
  const idx = new Uint8Array(w * h);
  let cur = new Float32Array(w * 3), nxt = new Float32Array(w * 3);
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
  for (let y = 0; y < h; y++) {
    nxt.fill(0);
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (transparentIndex >= 0 && rgba[i * 4 + 3] < 128) { idx[i] = transparentIndex; continue; }
      const r = clamp(rgba[i * 4] + cur[x * 3]), g = clamp(rgba[i * 4 + 1] + cur[x * 3 + 1]), b = clamp(rgba[i * 4 + 2] + cur[x * 3 + 2]);
      const k = nearest(r, g, b); idx[i] = k;
      const er = r - pr[k], eg = g - pg[k], eb = b - pb[k];
      if (x + 1 < w) { cur[x * 3 + 3] += er * 7 / 16; cur[x * 3 + 4] += eg * 7 / 16; cur[x * 3 + 5] += eb * 7 / 16; }
      if (x > 0) { nxt[x * 3 - 3] += er * 3 / 16; nxt[x * 3 - 2] += eg * 3 / 16; nxt[x * 3 - 1] += eb * 3 / 16; }
      nxt[x * 3] += er * 5 / 16; nxt[x * 3 + 1] += eg * 5 / 16; nxt[x * 3 + 2] += eb * 5 / 16;
      if (x + 1 < w) { nxt[x * 3 + 3] += er / 16; nxt[x * 3 + 4] += eg / 16; nxt[x * 3 + 5] += eb / 16; }
    }
    [cur, nxt] = [nxt, cur];
    if ((y & 63) === 0) onProgress(y / h);
  }
  return idx;
}

async function encodeGif(rgba, w, h, onProgress) {
  const iq = await import('image-q');
  const { GIFEncoder } = await import('gifenc');
  const alpha = hasAlpha(rgba);
  // Transparent pixels are left out of the palette search, then get their own index.
  const px = new Uint8ClampedArray(rgba);
  if (alpha) for (let i = 0; i < px.length; i += 4) if (px[i + 3] < 128) { px[i] = px[i + 1] = px[i + 2] = 0; } else px[i + 3] = 255;
  const palette = iq.buildPaletteSync([samplePoints(iq, px, w, h)], { colors: alpha ? 255 : 256, paletteQuantization: 'wuquant', colorDistanceFormula: 'euclidean-bt709' });
  const pal = palette.getPointContainer().getPointArray().map((p) => [p.r, p.g, p.b]);
  const transparentIndex = alpha ? pal.length : -1;
  const idx = ditherToIndices(rgba, w, h, pal, transparentIndex, onProgress);
  if (alpha) pal.push([0, 0, 0]);
  while (pal.length < 2) pal.push([0, 0, 0]);
  const gif = GIFEncoder();
  gif.writeFrame(idx, w, h, { palette: pal, transparent: alpha, transparentIndex: Math.max(0, transparentIndex) });
  gif.finish();
  return verified(gif.bytes(), [0x47, 0x49, 0x46, 0x38], 'GIF', 'image/gif');
}

const ICO_SIZES = [16, 32, 48, 64, 128, 256];
async function encodeIco(canvas, w, h) {
  const side = Math.max(w, h);
  const sizes = ICO_SIZES.filter((s) => s <= side);
  if (!sizes.length) sizes.push(16);
  const entries = [];
  for (const s of sizes) {
    // Square icon: the image fitted and centred, transparent around it (never stretched).
    const c = new OffscreenCanvas(s, s), ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    const k = s / side, dw = Math.max(1, Math.round(w * k)), dh = Math.max(1, Math.round(h * k));
    const bmp = await createImageBitmap(canvas, { resizeWidth: dw, resizeHeight: dh, resizeQuality: 'high' });
    ctx.drawImage(bmp, Math.floor((s - dw) / 2), Math.floor((s - dh) / 2)); bmp.close();
    const png = await u8(await c.convertToBlob({ type: 'image/png' }));
    if (!startsWith(png, [0x89, 0x50, 0x4e, 0x47])) throw new Error('The icon encoder produced no valid image.');
    entries.push({ s, png });
  }
  const head = 6 + 16 * entries.length;
  const total = head + entries.reduce((n, e) => n + e.png.length, 0);
  const b = new Uint8Array(total), v = new DataView(b.buffer);
  v.setUint16(2, 1, true); v.setUint16(4, entries.length, true);
  let off = head;
  entries.forEach((e, i) => {
    const d = 6 + i * 16;
    b[d] = e.s === 256 ? 0 : e.s; b[d + 1] = e.s === 256 ? 0 : e.s; // 0 means 256
    v.setUint16(d + 4, 1, true); v.setUint16(d + 6, 32, true); v.setUint32(d + 8, e.png.length, true); v.setUint32(d + 12, off, true);
    b.set(e.png, off); off += e.png.length;
  });
  return { blob: verified(b, [0, 0, 1, 0], 'ICO', 'image/x-icon'), sizes };
}

async function encodeTiff(rgba, w, h) {
  const UTIF = (await import('utif2')).default;
  // t338 = 2: UNassociated alpha. utif2 declares 1 (premultiplied) for straight RGBA, so viewers darkened every
  // semi-transparent edge (measured: 43.6 dB against the source vs 77 dB for our PNG from the same canvas).
  const bytes = new Uint8Array(UTIF.encodeImage(new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength), w, h, { t338: [2], t305: ['onlineconvertools.com'] }));
  // utif2 writes big-endian ("MM\0*"); both byte orders are valid TIFF.
  return verified(bytes, bytes[0] === 0x4d ? [0x4d, 0x4d, 0x00, 0x2a] : [0x49, 0x49, 0x2a, 0x00], 'TIFF', 'image/tiff');
}

async function encodePdf(canvas, rgba, w, h, quality) {
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.create();
  let img;
  if (hasAlpha(rgba)) img = await doc.embedPng(await u8(await canvas.convertToBlob({ type: 'image/png' })));
  else img = await doc.embedJpg(await u8(await canvas.convertToBlob({ type: 'image/jpeg', quality: Math.max(0.5, quality / 100) })));
  const page = doc.addPage([w, h]); // 1 px = 1 pt: the page is the image, at 72 dpi
  page.drawImage(img, { x: 0, y: 0, width: w, height: h });
  return verified(await doc.save(), [0x25, 0x50, 0x44, 0x46], 'PDF', 'application/pdf');
}

export const EXTRA_FORMATS = ['bmp', 'gif', 'ico', 'tiff', 'pdf'];

// Returns { blob, note } -- note says what the format changed (flattened, palette, icon sizes).
export async function encodeExtra(format, canvas, width, height, quality, onProgress = () => {}) {
  const rgba = canvas.getContext('2d').getImageData(0, 0, width, height).data;
  switch (format) {
    case 'bmp': return { blob: encodeBmp(rgba, width, height), note: hasAlpha(rgba) ? 'transparency flattened onto white (BMP)' : '' };
    case 'gif': return { blob: await encodeGif(rgba, width, height, onProgress), note: 'reduced to 256 colours with dithering (GIF limit)' };
    case 'ico': { const r = await encodeIco(canvas, width, height); return { blob: r.blob, note: `icon sizes ${r.sizes.join(', ')} px` }; }
    case 'tiff': return { blob: await encodeTiff(rgba, width, height), note: '' };
    case 'pdf': return { blob: await encodePdf(canvas, rgba, width, height, quality), note: '' };
    default: throw new Error('Unknown output format.');
  }
}
