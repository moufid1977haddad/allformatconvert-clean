// "Reduce to N megapixels" (P31, 03/10): an image over a tool's phone bound (Image Compressor: 50 MP) made smaller,
// in one gesture, before the tool's own work — instead of only a refusal. The photo is read band by band by the
// browser's own decoder (app/lib/bigImage.js forEachBand: a few megapixels at a time, never a canvas over the iPhone
// limit) and each output pixel is the average of the source pixels it covers (area average, as Photoshop's
// "bicubic sharper" is not needed for a reduction of this order). The result keeps the format (JPEG at 95 %, PNG
// lossless, WebP at 95 %) so the tool then compresses it as it would any image.
import { forEachBand, encodeJpegWasm, encodePngRGBA, encodeWebpWasm } from './bigImage';

/** { width, height } of a w × h image reduced to at most maxMp megapixels, aspect ratio kept. */
export function reducedSize(w, h, maxMp) {
  const s = Math.min(1, Math.sqrt((maxMp * 1e6) / (w * h)));
  let width = Math.max(1, Math.floor(w * s)), height = Math.max(1, Math.floor(h * s));
  while (width * height > maxMp * 1e6) { width--; height = Math.max(1, Math.floor(width * h / w)); }
  return { width, height };
}

/**
 * `file` (displayed size dims = { width, height }) reduced to at most maxMp megapixels.
 * Resolves to a File of the same name and kind (JPEG / PNG / WebP).
 */
export async function reduceImageFile(file, dims, maxMp, { onProgress = () => {} } = {}) {
  const { width: W, height: H } = dims;
  const { width: ow, height: oh } = reducedSize(W, H, maxMp);
  const out = new Uint8ClampedArray(ow * oh * 4);
  const sx = ow / W, sy = oh / H;
  // Accumulators of the output row being built (premultiplied by alpha, so transparent pixels do not bleed colour).
  let accRow = -1;
  const acc = new Float64Array(ow * 4), wsum = new Float64Array(ow);
  const colOf = new Int32Array(W);
  for (let x = 0; x < W; x++) colOf[x] = Math.min(ow - 1, Math.floor(x * sx));
  const flush = () => {
    if (accRow < 0) return;
    for (let x = 0; x < ow; x++) {
      const o = (accRow * ow + x) * 4, a = acc[x * 4 + 3], n = wsum[x] || 1;
      if (a > 0) { out[o] = acc[x * 4] / a; out[o + 1] = acc[x * 4 + 1] / a; out[o + 2] = acc[x * 4 + 2] / a; }
      out[o + 3] = a / n;
    }
    acc.fill(0); wsum.fill(0);
  };
  await forEachBand(file, dims, 4_000_000, async (rgba, y0, rows) => {
    for (let r = 0; r < rows; r++) {
      const oy = Math.min(oh - 1, Math.floor((y0 + r) * sy));
      if (oy !== accRow) { flush(); accRow = oy; }
      const base = r * W * 4;
      for (let x = 0; x < W; x++) {
        const i = base + x * 4, a = rgba[i + 3], c = colOf[x] * 4;
        acc[c] += rgba[i] * a; acc[c + 1] += rgba[i + 1] * a; acc[c + 2] += rgba[i + 2] * a; acc[c + 3] += a; wsum[colOf[x]]++;
      }
    }
    onProgress(Math.min(99, Math.round(((y0 + rows) / H) * 100)));
    await new Promise((r) => setTimeout(r, 0)); // let the page paint between bands
  });
  flush();
  const type = file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
  const blob = type === 'image/png' ? await encodePngRGBA(out, ow, oh)
    : type === 'image/webp' ? await encodeWebpWasm(out, ow, oh, 95)
      : await encodeJpegWasm(out, ow, oh, 95);
  onProgress(100);
  const name = type === 'image/jpeg' && !/\.jpe?g$/i.test(file.name) ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : file.name;
  return new File([blob], name, { type });
}
