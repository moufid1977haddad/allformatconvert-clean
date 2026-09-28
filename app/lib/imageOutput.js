// Shared output rules for the canvas image tools (second audit, 29/09).
//
// Measured before: every filter tool (invert, grayscale, sepia, noise, vignette, border, flip, text, pixelate…)
// returned a PNG whatever the input, so a 2 MB JPEG photo came back as a PNG several times larger, under a
// .png name. The reference sites (iLoveIMG, Pinetools, Photopea's quick export) keep the photo's format.
// Image Resizer already did so since 23/09. Now: JPEG stays JPEG (quality 0.92), WebP stays WebP when this
// browser can encode WebP (Safari cannot: the result is then an honest PNG, named .png), everything else PNG.
import { checkedDataURL, canEncodeImageType } from './mediaSupport';

export function outputTypeFor(sourceType) {
  if (sourceType === 'image/jpeg' || sourceType === 'image/jpg') return 'image/jpeg';
  if (sourceType === 'image/webp' && canEncodeImageType('image/webp')) return 'image/webp';
  return 'image/png';
}

// Encodes the canvas in the source's format; returns a data URL (checked: right type, not empty).
export function encodeLike(canvas, sourceType) {
  const type = outputTypeFor(sourceType);
  return type === 'image/png' ? checkedDataURL(canvas, type) : checkedDataURL(canvas, type, 0.92);
}

// File extension matching a data URL's real type ("jpg", "webp", "png").
export function extOf(dataUrl) {
  const t = /^data:([^;,]+)/.exec(dataUrl || '');
  return t && t[1] === 'image/jpeg' ? 'jpg' : t && t[1] === 'image/webp' ? 'webp' : 'png';
}

// Mosaic by block AVERAGE (alpha-weighted), as Photoshop's Mosaic and the reference pixelators do; the previous
// code copied each block's top-left pixel, which is not what the page said and turns fine detail into noise.
export function pixelateImageData(imageData, size) {
  const { width: w, height: h, data: d } = imageData;
  for (let by = 0; by < h; by += size) {
    for (let bx = 0; bx < w; bx += size) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      const ey = Math.min(by + size, h), ex = Math.min(bx + size, w);
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) {
        const i = (y * w + x) * 4; const al = d[i + 3];
        r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al; n++;
      }
      const R = a ? r / a : 0, G = a ? g / a : 0, B = a ? b / a : 0, A = a / n;
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) {
        const i = (y * w + x) * 4; d[i] = R; d[i + 1] = G; d[i + 2] = B; d[i + 3] = A;
      }
    }
  }
  return imageData;
}

// Rounded-rectangle path with true circular arcs (as CSS border-radius), for clipping.
export function roundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
