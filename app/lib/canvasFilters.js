// Canvas filters for browsers without CanvasRenderingContext2D.filter (29/09).
//
// Measured: Playwright's WebKit (the engine of Safari) has no ctx.filter --
// setting it is silently ignored, so Brightness & Contrast and Image Blur
// returned the UNCHANGED image under Safari, as if it had been processed.
// Chromium and Firefox apply it. Where ctx.filter exists it is still used
// (unchanged behaviour); elsewhere the same operations are computed on the
// pixels, with the formulas of the CSS Filter Effects spec:
//   brightness(b): C' = C * b          contrast(c): C' = (C - 0.5) * c + 0.5
//   blur(r): Gaussian with standard deviation r (three box blurs, the usual
//   approximation), on premultiplied alpha so transparent edges don't darken.

export function supportsCanvasFilter() {
  if (typeof document === 'undefined') return false;
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  const x = c.getContext('2d');
  if (!('filter' in x)) return false;
  x.filter = 'brightness(0%)';
  x.fillStyle = '#ffffff';
  x.fillRect(0, 0, 1, 1);
  return x.getImageData(0, 0, 1, 1).data[0] === 0;
}

// brightness, contrast in percent (100 = unchanged), as the CSS functions.
export function applyBrightnessContrast(imageData, brightness, contrast) {
  const b = brightness / 100;
  const c = contrast / 100;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.round(((v / 255) * b - 0.5) * c * 255 + 127.5);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = lut[d[i]]; d[i + 1] = lut[d[i + 1]]; d[i + 2] = lut[d[i + 2]]; }
  return imageData;
}

export function boxSizes(sigma, n = 3) {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  return Array.from({ length: n }, (_, i) => (i < m ? wl : wu));
}

// P17: the same passes, rewritten for speed (Safari: 44 s at 12 MP with the first version, which read every sample
// through a clamping closure, channel by channel, walked columns across memory, and kept 32 bytes of floats per
// pixel). Now whole integers: premultiplied values scaled to 0-65025 in 16-bit arrays (half the memory), each box
// average rounded to the nearest integer of that scale -- 1/255 of a colour level, so the result stays within one
// level of the floating-point version (checked: scripts/image-tests/blur-fast.mjs).
// Box blurs commute: the three horizontal boxes are applied first, one row at a time in a small buffer that stays
// in the processor's cache (premultiplying on the way in), then the three vertical ones over the whole image, the
// last writing the final colours straight back -- about half the memory traffic of alternating H and V passes,
// which is what bounds the speed here (measured: more cores barely helped).
// One row, the four channels together, edges clamped by index. src[sOff..], dst[dOff..] hold w pixels.
function boxRowH(src, sOff, dst, dOff, w, r) {
  const inv = 1 / (2 * r + 1), last = w - 1;
  let a0 = 0, a1 = 0, a2 = 0, a3 = 0;
  for (let k = -r; k <= r; k++) {
    const i = sOff + (k < 0 ? 0 : k > last ? last : k) * 4;
    a0 += src[i]; a1 += src[i + 1]; a2 += src[i + 2]; a3 += src[i + 3];
  }
  for (let x = 0; x < w; x++) {
    const o = dOff + x * 4;
    dst[o] = (a0 * inv + 0.5) | 0; dst[o + 1] = (a1 * inv + 0.5) | 0; dst[o + 2] = (a2 * inv + 0.5) | 0; dst[o + 3] = (a3 * inv + 0.5) | 0;
    const ai = x + r + 1, ri = x - r;
    const add = sOff + (ai > last ? last : ai) * 4, sub = sOff + (ri < 0 ? 0 : ri) * 4;
    a0 += src[add] - src[sub]; a1 += src[add + 1] - src[sub + 1]; a2 += src[add + 2] - src[sub + 2]; a3 += src[add + 3] - src[sub + 3];
  }
}
// Vertical: whole rows at a time (memory in order), one running sum per column and channel.
function boxPassV(src, dst, w, h, r, acc) {
  const inv = 1 / (2 * r + 1), last = h - 1, rowLen = w * 4;
  acc.fill(0);
  for (let k = -r; k <= r; k++) {
    const base = (k < 0 ? 0 : k > last ? last : k) * rowLen;
    for (let i = 0; i < rowLen; i++) acc[i] += src[base + i];
  }
  for (let y = 0; y < h; y++) {
    const o = y * rowLen;
    for (let i = 0; i < rowLen; i++) dst[o + i] = (acc[i] * inv + 0.5) | 0;
    const ai = y + r + 1, ri = y - r;
    const add = (ai > last ? last : ai) * rowLen, sub = (ri < 0 ? 0 : ri) * rowLen;
    for (let i = 0; i < rowLen; i++) acc[i] += src[add + i] - src[sub + i];
  }
}
// The last vertical box, writing un-premultiplied bytes straight into the image (a separate function: one array
// type per function keeps Safari's compiler on its fast path -- measured 3x slower when shared).
function boxPassVOut(src, out, w, h, r, acc) {
  const inv = 1 / (2 * r + 1), last = h - 1, rowLen = w * 4;
  acc.fill(0);
  for (let k = -r; k <= r; k++) {
    const base = (k < 0 ? 0 : k > last ? last : k) * rowLen;
    for (let i = 0; i < rowLen; i++) acc[i] += src[base + i];
  }
  for (let y = 0; y < h; y++) {
    const o = y * rowLen;
    for (let i = 0; i < rowLen; i += 4) {
      const A = (acc[i + 3] * inv + 0.5) | 0;
      const k = A > 0 ? 255 * inv / A : 0;
      out[o + i] = acc[i] * k; out[o + i + 1] = acc[i + 1] * k; out[o + i + 2] = acc[i + 2] * k; out[o + i + 3] = A / 255;
    }
    const ai = y + r + 1, ri = y - r;
    const add = (ai > last ? last : ai) * rowLen, sub = (ri < 0 ? 0 : ri) * rowLen;
    for (let i = 0; i < rowLen; i++) acc[i] += src[add + i] - src[sub + i];
  }
}

// Rows of support on each side: the three boxes' radii added up. A band blurred with this many extra rows of real
// image above and below gives exactly the rows the whole image would (the clamped edge only reaches that far).
export function gaussianBlurSupport(sigma) {
  return sigma > 0 ? boxSizes(sigma).reduce((t, size) => t + (size - 1) / 2, 0) : 0;
}

export function applyGaussianBlur(imageData, sigma) {
  if (!(sigma > 0)) return imageData;
  const { width: w, height: h, data } = imageData;
  // Premultiplied colour c*alpha and alpha*255, both 0-65025: exact integers, transparent edges don't darken.
  const [r1, r2, r3] = boxSizes(sigma).map((size) => (size - 1) / 2);
  const rowLen = w * 4;
  const a = new Uint16Array(data.length);
  const rowA = new Uint16Array(rowLen), rowB = new Uint16Array(rowLen);
  for (let y = 0; y < h; y++) {
    const o = y * rowLen;
    for (let i = 0; i < rowLen; i += 4) {
      const al = data[o + i + 3];
      rowA[i] = data[o + i] * al; rowA[i + 1] = data[o + i + 1] * al; rowA[i + 2] = data[o + i + 2] * al; rowA[i + 3] = al * 255;
    }
    boxRowH(rowA, 0, rowB, 0, w, r1);
    boxRowH(rowB, 0, rowA, 0, w, r2);
    boxRowH(rowA, 0, a, o, w, r3);
  }
  const b = new Uint16Array(data.length);
  const acc = new Int32Array(rowLen);
  boxPassV(a, b, w, h, r1, acc);
  boxPassV(b, a, w, h, r2, acc);
  boxPassVOut(a, data, w, h, r3, acc);
  return imageData;
}
