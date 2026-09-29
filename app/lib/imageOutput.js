// Shared output rules for the canvas image tools (second audit, 29/09).
//
// Measured before: every filter tool (invert, grayscale, sepia, noise, vignette, border, flip, text, pixelate…)
// returned a PNG whatever the input, so a 2 MB JPEG photo came back as a PNG several times larger, under a
// .png name. The reference sites (iLoveIMG, Pinetools, Photopea's quick export) keep the photo's format.
// Image Resizer already did so since 23/09. Now: JPEG stays JPEG (quality 0.92), WebP stays WebP when this
// browser can encode WebP (Safari cannot: the result is then an honest PNG, named .png), everything else PNG.
import { checkedDataURL, canEncodeImageType, checkedBlob } from './mediaSupport';
import { imageDims, decodeToRaster, rasterFromCanvas, rasterFromRGBA, canvasBeyondSafariCap, CANVAS_MAX_PIXELS,
  encodeJpegWasm, encodeWebpWasm, encodePngRGBA } from './bigImage';
import { derivedName } from './download';

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

// ---- Full-resolution pipeline without a canvas bigger than iOS allows (30/09, owner's iPhone) ------------------
// The filter tools drew the whole photo on one <canvas>: Safari on iPhone refuses more than 16.7 MP per canvas, so
// every 24 MP (iPhone 15 and later, default) or 48 MP photo failed, and each result was a data: URL, which iOS does
// not save. Now: load -> process by bands -> encode to a Blob, same format as the source, named after it.


const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** The file at full resolution, as displayed (EXIF orientation applied). */
export async function loadRaster(file) {
  const dims = await imageDims(file);
  try {
    return await decodeToRaster(file, dims);
  } catch {
    throw new Error('Could not load this image. The file may be corrupted or in a format your browser cannot open.');
  }
}

/**
 * Runs `fn(ctx, band)` over the image, one horizontal band at a time when the image is bigger than one canvas may
 * be on this device (else once, on the whole image). ctx = a canvas of `band.width` x `band.rows` to draw the result
 * in; band.source = a canvas holding the same rows of the source image; band.y = the image row of their row 0;
 * `margin` extra rows above and below each band are given (for neighbourhood filters: blur), and dropped after.
 * band.full = { width, height } of the whole image. Returns a new Raster.
 */
export async function mapBands(raster, fn, { margin = 0 } = {}) {
  const W = raster.width, H = raster.height;
  if (raster.canvas && (W * H <= CANVAS_MAX_PIXELS || (await canvasBeyondSafariCap()))) {
    const out = canvasOf(W, H);
    await fn(out.getContext('2d'), { y: 0, rows: H, width: W, full: { width: W, height: H }, source: raster.canvas });
    return rasterFromCanvas(out, W, H);
  }
  const src = raster.rgba();
  const res = new Uint8ClampedArray(W * H * 4);
  const step = Math.max(1, Math.floor(CANVAS_MAX_PIXELS / W) - 2 * margin);
  for (let y = 0; y < H; y += step) {
    const h = Math.min(step, H - y), top = Math.min(margin, y), bottom = Math.min(margin, H - y - h), rows = top + h + bottom;
    const s = canvasOf(W, rows);
    s.getContext('2d').putImageData(new ImageData(src.slice((y - top) * W * 4, (y + h + bottom) * W * 4), W, rows), 0, 0);
    const o = canvasOf(W, rows), ctx = o.getContext('2d', { willReadFrequently: true });
    await fn(ctx, { y: y - top, rows, width: W, full: { width: W, height: H }, source: s });
    res.set(ctx.getImageData(0, top, W, h).data, y * W * 4);
    s.width = o.width = 1;
  }
  return rasterFromRGBA(res, W, H);
}

// Same format as the source: JPEG stays JPEG, WebP stays WebP (libwebp in WebAssembly where the browser has no
// WebP encoder: Safari), anything else PNG. Returns a Blob, checked (right type, not empty).
export async function encodeRasterLike(raster, sourceType, quality = 92) {
  const t = sourceType === 'image/jpg' ? 'image/jpeg' : sourceType;
  const type = t === 'image/jpeg' || t === 'image/webp' ? t : 'image/png';
  return encodeRaster(raster, type, quality);
}

export async function encodeRaster(raster, type, quality = 92) {
  const { width: W, height: H } = raster;
  if (raster.canvas) {
    if (type === 'image/png') return checkedBlob(raster.canvas, type);
    if (type === 'image/jpeg') {
      const c = canvasOf(W, H), ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.drawImage(raster.canvas, 0, 0);
      return checkedBlob(c, type, quality / 100);
    }
    try { return await checkedBlob(raster.canvas, type, quality / 100); } catch { /* Safari: no WebP encoder */ }
  }
  if (type === 'image/jpeg') return encodeJpegWasm(raster.rgba(), W, H, quality);
  if (type === 'image/webp') return encodeWebpWasm(raster.rgba(), W, H, quality);
  return encodePngRGBA(raster.rgba(), W, H);
}

const EXT = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' };
/** { blob, url, name } for a result: object URL for the preview and the Download link, name from the original. */
export function resultOf(blob, originalName, suffix) {
  return { blob, url: URL.createObjectURL(blob), name: derivedName(originalName, suffix, EXT[blob.type] || 'png') };
}

/**
 * Draws a new image of outW x outH with `draw(ctx, drawSource, band)`, written as if on one canvas holding the
 * whole result: drawSource(ctx, dx, dy) draws the whole source image at (dx, dy) under ctx's current transform.
 * Where one canvas may not hold the source or the result (iPhone, over 16.7 MP), the result is drawn band by band
 * (ctx is translated so the code above does not change) and the source is drawn from pieces of at most 16.7 MP:
 * exact for flips, 90-degree turns, borders, clipping, text and gradients; NOT for scaling or free rotation (the
 * pieces would be resampled apart -- those tools use their own path). band = { y, rows, width } in result rows,
 * for pixel work with getImageData(0, 0, band.width, band.rows), which ignores the transform.
 */
export async function renderFull(raster, outW, outH, draw) {
  const W = raster.width, H = raster.height;
  const bigOk = await canvasBeyondSafariCap();
  const fits = (px) => px <= CANVAS_MAX_PIXELS || bigOk;
  if (fits(outW * outH) && fits(W * H)) {
    let src = raster.canvas;
    if (!src) { src = canvasOf(W, H); src.getContext('2d').putImageData(new ImageData(raster.rgba(), W, H), 0, 0); }
    const out = canvasOf(outW, outH);
    await draw(out.getContext('2d'), (c, dx = 0, dy = 0) => c.drawImage(src, dx, dy), { y: 0, rows: outH, width: outW });
    return rasterFromCanvas(out, outW, outH);
  }
  // Source in pieces of at most one canvas.
  const pieces = [];
  if (raster.canvas && fits(W * H)) pieces.push({ canvas: raster.canvas, y: 0 });
  else {
    const rgba = raster.rgba(), step = Math.max(1, Math.floor(CANVAS_MAX_PIXELS / W));
    for (let y = 0; y < H; y += step) {
      const h = Math.min(step, H - y), c = canvasOf(W, h);
      c.getContext('2d').putImageData(new ImageData(rgba.slice(y * W * 4, (y + h) * W * 4), W, h), 0, 0);
      pieces.push({ canvas: c, y });
    }
  }
  const drawSource = (c, dx = 0, dy = 0) => { for (const p of pieces) c.drawImage(p.canvas, dx, dy + p.y); };
  const res = new Uint8ClampedArray(outW * outH * 4);
  const step = Math.max(1, Math.floor(CANVAS_MAX_PIXELS / outW));
  for (let y = 0; y < outH; y += step) {
    const h = Math.min(step, outH - y), o = canvasOf(outW, h), ctx = o.getContext('2d', { willReadFrequently: true });
    ctx.save(); ctx.translate(0, -y);
    await draw(ctx, drawSource, { y, rows: h, width: outW });
    ctx.restore();
    res.set(ctx.getImageData(0, 0, outW, h).data, y * outW * 4);
    o.width = 1;
  }
  for (const p of pieces) if (p.canvas !== raster.canvas) p.canvas.width = 1;
  return rasterFromRGBA(res, outW, outH);
}

/** Rotation clockwise by `angle` degrees at full resolution. Quarter turns are exact (pixels moved, not
 * resampled); other angles are resampled bilinearly on an enlarged transparent canvas, as before. */
export async function rotateRaster(raster, angle) {
  const a = ((Number(angle) % 360) + 360) % 360;
  const W = raster.width, H = raster.height;
  if (a % 90 === 0) {
    const outW = a % 180 ? H : W, outH = a % 180 ? W : H;
    return renderFull(raster, outW, outH, (ctx, drawSource) => {
      if (a === 90) ctx.transform(0, 1, -1, 0, H, 0);
      else if (a === 180) ctx.transform(-1, 0, 0, -1, W, H);
      else if (a === 270) ctx.transform(0, -1, 1, 0, 0, W);
      drawSource(ctx);
    });
  }
  const rad = (a * Math.PI) / 180, c = Math.cos(rad), s = Math.sin(rad);
  const outW = Math.round(H * Math.abs(s) + W * Math.abs(c)), outH = Math.round(H * Math.abs(c) + W * Math.abs(s));
  const bigOk = await canvasBeyondSafariCap();
  if (bigOk || (W * H <= CANVAS_MAX_PIXELS && outW * outH <= CANVAS_MAX_PIXELS)) {
    return renderFull(raster, outW, outH, (ctx, drawSource) => {
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate(rad);
      drawSource(ctx, -W / 2, -H / 2);
    });
  }
  // iPhone, over 16.7 MP: the same bilinear resampling, computed on the pixels (premultiplied, transparent outside).
  const src = raster.rgba(), out = new Uint8ClampedArray(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    const dy = y + 0.5 - outH / 2;
    for (let x = 0; x < outW; x++) {
      const dx = x + 0.5 - outW / 2;
      const sx = c * dx + s * dy + W / 2 - 0.5, sy = -s * dx + c * dy + H / 2 - 0.5;
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
      let r = 0, g = 0, b = 0, al = 0;
      for (let k = 0; k < 4; k++) {
        const xx = x0 + (k & 1), yy = y0 + (k >> 1);
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const wgt = ((k & 1) ? fx : 1 - fx) * ((k >> 1) ? fy : 1 - fy), i = (yy * W + xx) * 4, pa = src[i + 3] * wgt;
        r += src[i] * pa; g += src[i + 1] * pa; b += src[i + 2] * pa; al += pa;
      }
      const o = (y * outW + x) * 4;
      if (al > 0) { out[o] = r / al; out[o + 1] = g / al; out[o + 2] = b / al; out[o + 3] = al; }
    }
  }
  return rasterFromRGBA(out, outW, outH);
}

// The file's image type, from its name when the browser gives none (seen: WebKit on Windows gives '' for .webp).
export function sourceTypeOf(file) {
  if (file && file.type) return file.type;
  const ext = String(file?.name || '').toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return { jpg: 'image/jpeg', jpeg: 'image/jpeg', jfif: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp', avif: 'image/avif' }[ext] || '';
}
