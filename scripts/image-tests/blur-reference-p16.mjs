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

function boxSizes(sigma, n = 3) {
  const wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--;
  const wu = wl + 2;
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  return Array.from({ length: n }, (_, i) => (i < m ? wl : wu));
}

function boxPass(src, dst, w, h, r, horizontal) {
  const len = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const step = horizontal ? 4 : w * 4;
  const inv = 1 / (2 * r + 1);
  for (let line = 0; line < lines; line++) {
    const base = horizontal ? line * w * 4 : line * 4;
    for (let ch = 0; ch < 4; ch++) {
      const at = (k) => src[base + Math.min(len - 1, Math.max(0, k)) * step + ch]; // clamp edges
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += at(k);
      for (let k = 0; k < len; k++) {
        dst[base + k * step + ch] = acc * inv;
        acc += at(k + r + 1) - at(k - r);
      }
    }
  }
}

export function applyGaussianBlur(imageData, sigma) {
  if (!(sigma > 0)) return imageData;
  const { width: w, height: h, data } = imageData;
  let a = new Float32Array(data.length);
  let b = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 4) { // premultiply
    const al = data[i + 3] / 255;
    a[i] = data[i] * al; a[i + 1] = data[i + 1] * al; a[i + 2] = data[i + 2] * al; a[i + 3] = data[i + 3];
  }
  for (const size of boxSizes(sigma)) {
    const r = (size - 1) / 2;
    boxPass(a, b, w, h, r, true);
    boxPass(b, a, w, h, r, false);
  }
  for (let i = 0; i < data.length; i += 4) {
    const al = a[i + 3];
    const k = al > 0 ? 255 / al : 0;
    data[i] = a[i] * k; data[i + 1] = a[i + 1] * k; data[i + 2] = a[i + 2] * k; data[i + 3] = al;
  }
  return imageData;
}
