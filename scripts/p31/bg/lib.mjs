// P31 (03/10) — the page's cut-out pipeline in Node, for any photo + mask (same code as the page: app/lib/mattingRefine.js),
// and a checkerboard writer for the before/after figures.
import sharp from 'sharp';
import { refineAtWorkingSize, composeBand, WORK_PIXELS, DEFAULTS } from '../../../app/lib/mattingRefine.js';

export async function raw(img, w, h, channels) {
  let s = sharp(img);
  if (w) s = s.resize(w, h, { fit: 'fill', kernel: 'lanczos3' });
  if (channels === 4) s = s.ensureAlpha(); else if (channels === 3) s = s.removeAlpha(); else s = s.toColourspace('b-w');
  const { data } = await s.raw().toBuffer({ resolveWithObject: true });
  return new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
}
export function toRGBA(buf, ch) {
  if (ch === 4) return buf;
  const n = buf.length / ch, o = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) o[i * 4 + c] = buf[i * ch + (ch === 1 ? 0 : c)]; o[i * 4 + 3] = 255; }
  return o;
}
const rawPng = (buf, w, h) => sharp(Buffer.from(buf.buffer, buf.byteOffset, buf.length), { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

/** variant: 'production' (stretched mask only) or an options object for refineAtWorkingSize (+ project flag). */
export async function cutout(photoPath, maskPath, W, H, variant = {}) {
  const photo = toRGBA(await raw(photoPath, 0, 0, 3), 3);
  const out = new Uint8ClampedArray(photo);
  if (variant === 'production' || variant.raw) {
    const m = await raw(maskPath, W, H, 1);
    for (let i = 0; i < W * H; i++) out[i * 4 + 3] = m[i];
    return out;
  }
  const k = Math.min(1, Math.sqrt(WORK_PIXELS / (W * H)));
  const w = Math.max(1, Math.round(W * k)), h = Math.max(1, Math.round(H * k));
  const work = toRGBA(await raw(photoPath, w, h, 3), 3);
  const mask = await raw(maskPath, w, h, 1);
  const t0 = performance.now();
  const r = refineAtWorkingSize(work, mask, w, h, variant);
  const am = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { am[i * 4] = r.alpha[i]; am[i * 4 + 1] = r.mix[i]; am[i * 4 + 2] = r.band[i]; am[i * 4 + 3] = 255; }
  const A = await raw(await rawPng(am, w, h), W, H, 4);
  const extra = {};
  for (const key of Object.keys(r)) if (!['alpha', 'mix', 'band'].includes(key) && r[key] && r[key].length === w * h * 4) extra[key] = await raw(await rawPng(r[key], w, h), W, H, 4);
  composeBand(out, A, extra.fg || null, extra.bg || null, variant.project !== false, { ...DEFAULTS, ...variant });
  out.workMs = performance.now() - t0;
  return out;
}

/** RGBA laid on a light/grey checkerboard, at most `maxW` wide, as PNG. `crop`: {left, top, width, height}. */
export async function checker(rgba, W, H, file, { maxW = 1200, crop = null, cell = 12 } = {}) {
  let src = sharp(Buffer.from(rgba.buffer, rgba.byteOffset, rgba.length), { raw: { width: W, height: H, channels: 4 } });
  let w = W, h = H;
  if (crop) { src = src.extract(crop); w = crop.width; h = crop.height; }
  const k = Math.min(1, maxW / w);
  const ow = Math.round(w * k), oh = Math.round(h * k);
  const fg = await src.resize(ow, oh, { kernel: 'lanczos3' }).png().toBuffer();
  const bg = Buffer.alloc(ow * oh * 3);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) { const v = ((x / cell | 0) + (y / cell | 0)) % 2 ? 204 : 255; bg.fill(v, (y * ow + x) * 3, (y * ow + x) * 3 + 3); }
  await sharp(bg, { raw: { width: ow, height: oh, channels: 3 } }).composite([{ input: fg }]).png({ compressionLevel: 9 }).toFile(file);
}
