// AI Image Upscaler, IN THE BROWSER (28/09): the same model as our server (4xNomos2_hq_mosr, MoSR), run by
// ONNX Runtime Web on the visitor's GPU through WebGPU -- the way the in-browser upscalers do it
// (web-realesrgan, nn-upscaler-onnxweb): free for us, and the image never leaves the device. Same tiling as
// services/background-removal/app/upscale.py (256 px tiles, 16 px of context), so the result is the server's.
// Measured 28/09 on an Intel Iris Plus (integrated, low end): ~10 s per tile, i.e. ~160 s per megapixel;
// WebAssembly without a GPU: ~41 s per tile (unusable) -- hence WebGPU only, and our server otherwise.
import { canvasSizeProblem } from './mediaSupport';

const TILE = 256;
const OVERLAP = 16;
const SCALE = 4;
const ORT_VERSION = '1.30.0';
export const MODEL_URL = '/models/4xNomos2_hq_mosr-web.onnx';

// A usable WebGPU adapter (not a software fallback).
export async function webgpuAvailable() {
  try {
    if (typeof navigator === 'undefined' || !navigator.gpu) return false;
    const a = await navigator.gpu.requestAdapter();
    return !!a && !a.isFallbackAdapter;
  } catch { return false; }
}

export class LocalUpscaleError extends Error {
  constructor(message, code) { super(message); this.name = 'LocalUpscaleError'; this.code = code; }
}

let sessionPromise = null;
async function getSession(onPhase) {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      onPhase?.('Loading the AI model (first time only, about 25 MB)');
      const ort = await import('onnxruntime-web/webgpu');
      ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
      ort.env.logLevel = 'error';
      const session = await ort.InferenceSession.create(MODEL_URL, { executionProviders: ['webgpu'], graphOptimizationLevel: 'all' });
      return { ort, session };
    })();
    sessionPromise.catch(() => { sessionPromise = null; });
  }
  return sessionPromise;
}

// { rgba, width, height, hasAlpha } of the image as viewers show it (EXIF orientation applied).
export async function readImage(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { bmp = await createImageBitmap(file); }
  const c = document.createElement('canvas');
  c.width = bmp.width; c.height = bmp.height;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0);
  bmp.close?.();
  const { data } = ctx.getImageData(0, 0, c.width, c.height);
  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) { hasAlpha = true; break; }
  return { rgba: data, width: c.width, height: c.height, hasAlpha };
}

// Can this browser hold and encode the result canvas? (iPhone Safari caps a canvas at ~16.7 Mpx.)
const IOS_CANVAS_MAX_AREA = 16_777_216;
export function localOutputProblem(width, height, scale) {
  const ios = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (ios && width * SCALE * height * SCALE > IOS_CANVAS_MAX_AREA) return 'too large for this device';
  return canvasSizeProblem(width * SCALE, height * SCALE) || (scale !== SCALE && canvasSizeProblem(width * scale, height * scale)) || '';
}

/**
 * Upscales RGB in the browser. onProgress({ done, total, etaSeconds }) after each tile.
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function upscaleInBrowser(img, scale, { onProgress, onPhase, signal } = {}) {
  const { ort, session } = await getSession(onPhase);
  const { rgba, width: w, height: h } = img;
  const input = session.inputNames[0];
  const out = document.createElement('canvas');
  out.width = w * SCALE; out.height = h * SCALE;
  const octx = out.getContext('2d');
  const tiles = [];
  for (let y0 = 0; y0 < h; y0 += TILE) for (let x0 = 0; x0 < w; x0 += TILE) tiles.push([x0, y0]);
  onPhase?.('Upscaling on this device');
  const times = [];
  for (let i = 0; i < tiles.length; i++) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const [x0, y0] = tiles[i];
    const t0 = performance.now();
    const x1 = Math.min(w, x0 + TILE), y1 = Math.min(h, y0 + TILE);
    const px0 = Math.max(0, x0 - OVERLAP), py0 = Math.max(0, y0 - OVERLAP), px1 = Math.min(w, x1 + OVERLAP), py1 = Math.min(h, y1 + OVERLAP);
    const tw = px1 - px0, th = py1 - py0, plane = tw * th;
    const t = new Float32Array(3 * plane);
    for (let yy = 0; yy < th; yy++) {
      let s = ((py0 + yy) * w + px0) * 4, d = yy * tw;
      for (let xx = 0; xx < tw; xx++, s += 4, d++) { t[d] = rgba[s] / 255; t[plane + d] = rgba[s + 1] / 255; t[2 * plane + d] = rgba[s + 2] / 255; }
    }
    let res;
    try {
      res = await session.run({ [input]: new ort.Tensor('float32', t, [1, 3, th, tw]) });
    } catch (e) {
      throw new LocalUpscaleError(String(e?.message || e), 'run');
    }
    const o = res[session.outputNames[0]];
    const od = o.data, OW = tw * SCALE, OH = th * SCALE, oplane = OW * OH;
    const cw = (x1 - x0) * SCALE, ch = (y1 - y0) * SCALE, ox = (x0 - px0) * SCALE, oy = (y0 - py0) * SCALE;
    const tile = new ImageData(cw, ch);
    const td = tile.data;
    for (let yy = 0; yy < ch; yy++) {
      let s = (oy + yy) * OW + ox, d = yy * cw * 4;
      for (let xx = 0; xx < cw; xx++, s++, d += 4) {
        td[d] = od[s] * 255 + 0.5; td[d + 1] = od[oplane + s] * 255 + 0.5; td[d + 2] = od[2 * oplane + s] * 255 + 0.5; td[d + 3] = 255;
      }
    }
    o.dispose?.();
    octx.putImageData(tile, x0 * SCALE, y0 * SCALE);
    times.push(performance.now() - t0);
    const steady = times.length > 1 ? times.slice(1) : times; // the first tile includes shader compilation
    const per = steady.reduce((a, b) => a + b, 0) / steady.length;
    onProgress?.({ done: i + 1, total: tiles.length, etaSeconds: Math.round((per * (tiles.length - i - 1)) / 1000) });
    await new Promise((r) => setTimeout(r, 0)); // let the page paint the progress
  }
  let final = out;
  if (scale !== SCALE) {
    final = document.createElement('canvas');
    final.width = w * scale; final.height = h * scale;
    const f = final.getContext('2d');
    f.imageSmoothingEnabled = true; f.imageSmoothingQuality = 'high';
    f.drawImage(out, 0, 0, final.width, final.height);
  }
  onPhase?.('Saving the PNG');
  const blob = await new Promise((r) => final.toBlob(r, 'image/png'));
  if (!blob || blob.size < 100) throw new LocalUpscaleError('The browser could not save the result.', 'encode');
  return { blob, width: final.width, height: final.height };
}

// Server time for comparison: measured 34.5 s per megapixel on Railway (8 vCPU), plus transfers.
export const serverSecondsFor = (w, h) => Math.round((w * h / 1e6) * 35 + 10);
