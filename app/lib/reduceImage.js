// "Reduce to N megapixels" (P31, 03/10): an image over a tool's phone bound (Image Compressor: 50 MP; 48 MP in every tool since P33) made smaller,
// in one gesture, before the tool's own work — instead of only a refusal. The photo is read band by band by the
// browser's own decoder (app/lib/bigImage.js forEachBand: a few megapixels at a time, never a canvas over the iPhone
// limit) and each output pixel is the average of the source pixels it covers (area average, as Photoshop's
// "bicubic sharper" is not needed for a reduction of this order).
//
// P32 (04/10): the reduced pixels are no longer encoded into an intermediate JPEG on the page (MozJPEG at 95 %) and
// decoded again by the compressor: on the owner's iPhone that page-side encoder grew to ~1 GB of WebAssembly memory
// that the page never gives back, and the compressor's worker then needed its own ~0.95 GB -- the tab was killed at
// "Compressing…". The reduction now runs inside the compressor's worker and hands its pixels straight to the
// encoder: one encode, no intermediate file (measured: scripts/p32/compressor-peak-memory.mjs).
import { forEachBand } from './bigImage.js';

// P33 (05/10): one number for the phone, in every tool that decodes a whole picture (Image Compressor, JPG to PDF,
// Image to PDF): "48 megapixels", the only size proven on a real iPhone (the owner's 48 MP photo, P19 kit: 8064 × 6048,
// compressed fine; P32 measured that a 63 MP WebP/HEIC panorama turned into a PDF page needs 1,467 MB, above the
// 961 MB of that reference). The bound is that photo's exact pixel count, so a "48 MP" phone photo (48.77 MP) passes
// with no word, and anything over it reads as 49 megapixels or more in the messages (Math.round).
export const PHONE_MAX_MP = 48;
export const PHONE_MAX_PIXELS = 8064 * 6048; // 48,771,072
export const overPhoneBound = (w, h) => w * h > PHONE_MAX_PIXELS;
// What "Reduce to 48 MP" makes: at most 48,000,000 pixels (the owner's 14000 × 4500 panorama -> 12220 × 3927), under the
// bound above, never heavier than the proven photo.
export const PHONE_REDUCE_MP = PHONE_MAX_MP;

/** { width, height } of a w × h image reduced to at most maxMp megapixels, aspect ratio kept. */
export function reducedSize(w, h, maxMp) {
  const s = Math.min(1, Math.sqrt((maxMp * 1e6) / (w * h)));
  let width = Math.max(1, Math.floor(w * s)), height = Math.max(1, Math.floor(h * s));
  while (width * height > maxMp * 1e6) { width--; height = Math.max(1, Math.floor(width * h / w)); }
  return { width, height };
}

/**
 * `blob` (displayed size dims = { width, height }) reduced to ow × oh by area average, read band by band.
 * Resolves to the RGBA pixels (Uint8ClampedArray, ow * oh * 4): the only full-size buffer this allocates.
 */
export async function reduceToRGBA(blob, dims, ow, oh, { onProgress = () => {} } = {}) {
  const { width: W, height: H } = dims;
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
  await forEachBand(blob, dims, 4_000_000, async (rgba, y0, rows) => {
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
  });
  flush();
  onProgress(100);
  return out;
}
