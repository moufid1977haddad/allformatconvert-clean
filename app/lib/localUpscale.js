// AI Image Upscaler, IN THE BROWSER (28/09): the same model as our server (4xNomos2_hq_mosr, MoSR), run by
// ONNX Runtime Web on the visitor's GPU through WebGPU -- the way the in-browser upscalers do it
// (web-realesrgan, nn-upscaler-onnxweb): free for us, and the image never leaves the device. Same tiling as
// services/background-removal/app/upscale.py (256 px tiles, 16 px of context), so the result is the server's.
// Measured 28/09 on an Intel Iris Plus (integrated, low end): ~10 s per tile, i.e. ~160 s per megapixel;
// WebAssembly without a GPU: ~41 s per tile (unusable) -- hence WebGPU only, and our server otherwise.
import { canvasSizeProblem } from './mediaSupport';
import { createPngWriter, CANVAS_MAX_PIXELS } from './bigImage';

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

// iPhone / iPad Safari caps a canvas at 16.7 Mpx: an upscaled photo is far bigger (6 Mpx x4 = 96 Mpx). Since 30/09
// such a result is never put on one canvas there: it is written row band by row band straight into one PNG
// (lib/bigImage.js createPngWriter), so the iPhone gets the same full-size result as a computer. Browser tests set
// window.__forceSafariCanvasCap to run that path anywhere.
const smallCanvasDevice = () => typeof navigator !== 'undefined' && (/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) || (typeof window !== 'undefined' && window.__forceSafariCanvasCap === true));
export const streamsOutput = (outW, outH) => outW * outH > CANVAS_MAX_PIXELS && smallCanvasDevice() && typeof CompressionStream !== 'undefined';
export function localOutputProblem(width, height, scale) {
  if (streamsOutput(width * SCALE, height * SCALE)) return '';
  return canvasSizeProblem(width * SCALE, height * SCALE) || (scale !== SCALE && canvasSizeProblem(width * scale, height * scale)) || '';
}

// A small preview of a streamed result (the page cannot show a 96 Mpx PNG on an iPhone): 2 Mpx at most.
function previewCanvas(W, H) {
  const k = Math.min(1, Math.sqrt(2_000_000 / (W * H)));
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W * k)); c.height = Math.max(1, Math.round(H * k));
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  return { c, ctx, k };
}
const previewBlob = (pv) => new Promise((r) => pv.c.toBlob(r, 'image/png'));

// x4 rows -> x2 rows: exact 2x2 average (the model always upscales x4; x2 is its result halved).
function halve(src, sw, sh) {
  const dw = sw >> 1, dh = sh >> 1, out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
    const a = ((2 * y) * sw + 2 * x) * 4, b = a + sw * 4, o = (y * dw + x) * 4;
    for (let c = 0; c < 4; c++) out[o + c] = (src[a + c] + src[a + 4 + c] + src[b + c] + src[b + 4 + c] + 2) >> 2;
  }
  return out;
}

/**
 * Upscales RGB in the browser. onProgress({ done, total, etaSeconds }) after each tile.
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function upscaleInBrowser(img, scale, { onProgress, onPhase, signal } = {}) {
  const { ort, session } = await getSession(onPhase);
  const { rgba, width: w, height: h } = img;
  const input = session.inputNames[0];
  const stream = streamsOutput(w * SCALE, h * SCALE);
  let out = null, octx = null, png = null, row = null, rowY = -1, pv = null, rowCanvas = null;
  if (stream) {
    png = createPngWriter(w * scale, h * scale, false);
    pv = previewCanvas(w * scale, h * scale);
    rowCanvas = document.createElement('canvas'); rowCanvas.width = w * scale; rowCanvas.height = TILE * scale;
  }
  else {
    out = document.createElement('canvas');
    out.width = w * SCALE; out.height = h * SCALE;
    octx = out.getContext('2d');
  }
  // Streaming: one row of tiles at a time, written to the PNG as soon as it is complete.
  const flushRow = async () => {
    if (!row) return;
    const rh = Math.min(TILE, h - rowY) * SCALE;
    const px = scale === SCALE ? row : halve(row, w * SCALE, rh), ph = scale === SCALE ? rh : rh >> 1;
    await png.writeRows(px, ph);
    rowCanvas.getContext('2d').putImageData(new ImageData(px, w * scale, ph), 0, 0);
    pv.ctx.drawImage(rowCanvas, 0, 0, w * scale, ph, 0, rowY * scale * pv.k, w * scale * pv.k, ph * pv.k);
    row = null;
  };
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
    if (stream) {
      if (y0 !== rowY) { await flushRow(); rowY = y0; row = new Uint8ClampedArray(w * SCALE * Math.min(TILE, h - y0) * SCALE * 4); }
      const rw = w * SCALE;
      for (let yy = 0; yy < ch; yy++) row.set(td.subarray(yy * cw * 4, (yy + 1) * cw * 4), (yy * rw + x0 * SCALE) * 4);
    } else octx.putImageData(tile, x0 * SCALE, y0 * SCALE);
    times.push(performance.now() - t0);
    const steady = times.length > 1 ? times.slice(1) : times; // the first tile includes shader compilation
    const per = steady.reduce((a, b) => a + b, 0) / steady.length;
    onProgress?.({ done: i + 1, total: tiles.length, etaSeconds: Math.round((per * (tiles.length - i - 1)) / 1000) });
    await new Promise((r) => setTimeout(r, 0)); // let the page paint the progress
  }
  if (stream) {
    await flushRow();
    onPhase?.('Saving the PNG');
    const blob = await png.finish();
    rowCanvas.width = 1;
    return { blob, width: w * scale, height: h * scale, preview: await previewBlob(pv) };
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

// The site's route waits at most 290 s for our server; a 6-Mpx image x4 takes 284 s there (measured 28/09) --
// no margin. Above SERVER_PART_PIXELS the image goes in horizontal bands (≈ 80 s each), each with OVERLAP rows of
// context above and below that are cropped away after, exactly as the service's own tiles: same model, same result.
// Bands are sent as PNG (lossless), stitched here. Only when this browser can hold the result canvas.
export const SERVER_PART_PIXELS = 2_000_000;
export const serverNeedsParts = (w, h, scale) => w * h > SERVER_PART_PIXELS && !localOutputProblem(w, h, scale);

/**
 * runPart(file, index, count) -> Promise<Blob> (the band upscaled by our server).
 * @returns {Promise<{ blob: Blob, width: number, height: number }>}
 */
export async function upscaleOnServerInParts(file, scale, runPart, { signal } = {}) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { bmp = await createImageBitmap(file); }
  const w = bmp.width, h = bmp.height;
  const rows = Math.max(1, Math.floor(SERVER_PART_PIXELS / w));
  const count = Math.ceil(h / rows);
  const stream = streamsOutput(w * scale, h * scale);
  let out = null, octx = null, png = null, sub = null, sctx = null, pv = null;
  if (stream) {
    // Transparency anywhere in the source? (decides RGB or RGBA for the PNG written as the bands come back)
    let alpha = false;
    const probe = document.createElement('canvas'); probe.width = w; probe.height = Math.min(h, rows);
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    for (let y = 0; y < h && !alpha; y += rows) {
      const hh = Math.min(rows, h - y);
      pctx.clearRect(0, 0, w, probe.height); pctx.drawImage(bmp, 0, y, w, hh, 0, 0, w, hh);
      const d = pctx.getImageData(0, 0, w, hh).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] !== 255) { alpha = true; break; }
    }
    probe.width = 1;
    png = createPngWriter(w * scale, h * scale, alpha);
    pv = previewCanvas(w * scale, h * scale);
    sub = document.createElement('canvas'); sub.width = w * scale; sub.height = Math.max(1, Math.floor(4_000_000 / (w * scale)));
    sctx = sub.getContext('2d', { willReadFrequently: true });
  } else {
    out = document.createElement('canvas');
    out.width = w * scale; out.height = h * scale;
    octx = out.getContext('2d');
  }
  try {
    for (let i = 0; i < count; i++) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      const y0 = i * rows, y1 = Math.min(h, y0 + rows);
      const py0 = Math.max(0, y0 - OVERLAP), py1 = Math.min(h, y1 + OVERLAP);
      const band = document.createElement('canvas');
      band.width = w; band.height = py1 - py0;
      band.getContext('2d').drawImage(bmp, 0, py0, w, py1 - py0, 0, 0, w, py1 - py0);
      const bandPng = await new Promise((r) => band.toBlob(r, 'image/png'));
      if (!bandPng) throw new LocalUpscaleError('The browser could not prepare the image.', 'encode');
      const res = await runPart(new File([bandPng], `part-${i + 1}.png`, { type: 'image/png' }), i, count);
      const oy = (y0 - py0) * scale, oh = (y1 - y0) * scale;
      if (stream) {
        // The band's kept rows, a few Mpx at a time (never the whole band on one canvas), into the PNG.
        for (let k = 0; k < oh; k += sub.height) {
          const kh = Math.min(sub.height, oh - k);
          const rb = await createImageBitmap(res, 0, oy + k, w * scale, kh);
          sctx.clearRect(0, 0, sub.width, sub.height); sctx.drawImage(rb, 0, 0); rb.close?.();
          await png.writeRows(sctx.getImageData(0, 0, w * scale, kh).data, kh);
          const top = y0 * scale + k;
          pv.ctx.drawImage(sub, 0, 0, w * scale, kh, 0, top * pv.k, w * scale * pv.k, kh * pv.k);
        }
      } else {
        const rb = await createImageBitmap(res);
        octx.drawImage(rb, 0, oy, w * scale, oh, 0, y0 * scale, w * scale, oh);
        rb.close?.();
      }
    }
  } finally {
    bmp.close?.();
  }
  if (stream) { sub.width = 1; return { blob: await png.finish(), width: w * scale, height: h * scale, preview: await previewBlob(pv) }; }
  const blob = await new Promise((r) => out.toBlob(r, 'image/png'));
  if (!blob || blob.size < 100) throw new LocalUpscaleError('The browser could not save the result.', 'encode');
  return { blob, width: out.width, height: out.height };
}
