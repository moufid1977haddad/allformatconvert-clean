import { MAX_MEGAPIXELS, NATIVE_WEBP_MAX_PIXELS } from './config';
import { CANVAS_MAX_PIXELS, decodeToRaster, rasterFromCanvas, rasterFromRGBA, encodeJpegWasm, encodeWebpWasm, encodePngRGBA } from '../../../lib/bigImage';
import { decodeTiff } from '../../../lib/tiffDecode';
import { sniffFormat, NATIVE_BITMAP_FORMATS } from '../../../lib/detectFileFormat';
import { checkedBlob, flattenOntoWhite } from '../../../lib/mediaSupport';

// AVIF: no browser encodes it from a canvas (measured: Chrome 153, Chromium 151,
// Firefox 153 all return a PNG), so it is encoded here by libavif compiled to
// WebAssembly (@jsquash/avif 2.1.1, Apache-2.0; libavif + libaom BSD-2-Clause).
// The single-threaded build is imported directly on purpose: the multi-threaded
// one needs SharedArrayBuffer, which this site does not enable. The 3.5 MB
// wasm (1.1 MB on the wire) is fetched only the first time AVIF is chosen.
let avifModulePromise = null;
function loadAvif() {
  if (!avifModulePromise) {
    avifModulePromise = (async () => {
      const [{ default: factory }, res] = await Promise.all([
        import('@jsquash/avif/codec/enc/avif_enc.js'),
        fetch('/wasm/avif_enc.wasm'),
      ]);
      if (!res.ok) throw new Error('AVIF encoder could not be loaded.');
      return factory({ wasmBinary: await res.arrayBuffer() });
    })().catch((e) => { avifModulePromise = null; throw e; });
  }
  return avifModulePromise;
}

async function encodeAvif(rgba, width, height, quality) {
  const mod = await loadAvif();
  const bytes = mod.encode(new Uint8Array(rgba.buffer, rgba.byteOffset, rgba.byteLength), width, height, {
    quality, qualityAlpha: -1, denoiseLevel: 0, tileRowsLog2: 0, tileColsLog2: 0, speed: 8,
    subsample: 1, chromaDeltaQ: false, sharpness: 0, tune: 0, enableSharpYUV: false, bitDepth: 8, lossless: false,
  });
  // Never trust an encoder's return value: a real AVIF file starts with an ISO-BMFF "ftyp" box naming avif/avis.
  const head = String.fromCharCode(...bytes.slice(4, 12));
  if (!bytes || bytes.length < 100 || !/^ftyp(avif|avis)$/.test(head)) throw new Error('The AVIF encoder produced no valid file.');
  return new Blob([bytes], { type: 'image/avif' });
}

import { EXTRA_FORMATS, encodeExtra } from './extraFormats';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

// Seconds of silence the page must tolerate while a WebAssembly encoder runs (it cannot report progress).
const longWork = (pixels, perMp) => self.postMessage({ type: 'long', ms: Math.max(20000, Math.round((pixels / 1e6) * perMp)) });

async function convertOne(item, format, quality, maxMegapixels) {
  // Found in a WebKit build without OffscreenCanvas: say so plainly instead of a raw ReferenceError.
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('This browser cannot process images in the background (it needs Safari 16.4 or later, or a current Chrome, Edge or Firefox).');
  }
  const { blob, name, dims } = item;
  // Route by the file's real header bytes, not its filename -- a PNG (or
  // any other browser-native format) saved with a mismatched or generic
  // extension still converts correctly this way, and a genuine TIFF still
  // gets the TIFF decoder even if it wasn't named .tif/.tiff. See
  // docs/audit/RAPPORT-tiff-paint.md.
  const headerBuf = await blob.slice(0, 32).arrayBuffer();
  const detected = sniffFormat(new Uint8Array(headerBuf));
  const tooBig = (w, h) => {
    const mp = (w * h) / 1e6;
    if (mp > maxMegapixels) throw new LimitExceededError(`"${name}" is ${w} × ${h} pixels (${mp.toFixed(1)} megapixels), more than the ${maxMegapixels}-megapixel limit.`);
  };
  let raster;

  if (detected?.format === 'tiff') {
    let decoded;
    try {
      const buffer = await blob.arrayBuffer();
      decoded = await decodeTiff(buffer);
    } catch (err) {
      // Re-throw the specific, actionable message from decodeTiff's own
      // validation (e.g. planar color storage) as-is; only fall back to a
      // generic message for a genuine parse failure.
      throw err instanceof Error && err.knownLimitation ? err : new Error(`Failed to decode "${name}". It may be corrupted, or use a TIFF variant this tool doesn't support.`);
    }
    // Defense in depth: even a file that starts with a valid TIFF magic
    // number can fail to yield usable dimensions (a malformed or
    // truncated IFD). Never let undefined/NaN reach ImageData/canvas.
    if (!decoded || !Number.isFinite(decoded.width) || !Number.isFinite(decoded.height) || decoded.width <= 0 || decoded.height <= 0) {
      throw new Error(`Failed to decode "${name}". It may be corrupted, or use a TIFF variant this tool doesn't support.`);
    }
    tooBig(decoded.width, decoded.height);
    const rgba = new Uint8ClampedArray(decoded.rgba);
    if (decoded.width * decoded.height <= CANVAS_MAX_PIXELS) {
      const c = new OffscreenCanvas(decoded.width, decoded.height);
      c.getContext('2d').putImageData(new ImageData(rgba, decoded.width, decoded.height), 0, 0);
      raster = rasterFromCanvas(c, decoded.width, decoded.height);
    } else raster = rasterFromRGBA(rgba, decoded.width, decoded.height);
  } else {
    if (dims) tooBig(dims.width, dims.height);
    try {
      raster = await decodeToRaster(blob, dims, { forceBands: !!item.forceBands });
    } catch {
      const err = new Error(
        detected
          ? `Failed to decode "${name}". Its content is ${detected.label}, which this tool couldn't read.`
          : `Failed to decode "${name}". It may be corrupted or in a format this tool doesn't support.`
      );
      err.notRecognized = !detected || !NATIVE_BITMAP_FORMATS.has(detected.format);
      err.detectedFormat = detected ? detected.format : null;
      throw err;
    }
    tooBig(raster.width, raster.height);
  }
  const { width, height } = raster;
  self.postMessage({ type: 'decoded', index: item.index, path: raster.canvas ? 'canvas' : 'bands' });

  // Verified, never trusted: a browser that cannot encode the requested format
  // (Safari + WebP) silently returns a PNG -- which used to be shipped as
  // a ".webp" file 86% heavier, with no warning. checkedBlob throws instead.
  // 'alive' keeps the page's silence watchdog from firing during a long (but progressing) encode.
  let last = 0;
  const alive = () => { const now = Date.now(); if (now - last > 1000) { last = now; self.postMessage({ type: 'alive' }); } };
  if (EXTRA_FORMATS.includes(format)) { longWork(raster.pixels, 3000); return encodeExtra(format, raster, quality, alive); }
  if (format === 'avif') { longWork(raster.pixels, 20000); return { blob: await encodeAvif(raster.rgba(), width, height, quality), note: '' }; }
  if (format === 'webp') {
    // The browser's own WebP encoder when it has one (Chrome, Edge, Firefox) and the image is under the size where
    // Chrome's gets non-linearly slow (config.ts); libwebp in WebAssembly otherwise -- Safari has none.
    if (raster.canvas && raster.pixels <= NATIVE_WEBP_MAX_PIXELS) {
      try { return { blob: await checkedBlob(raster.canvas, 'image/webp', quality / 100), note: '' }; } catch { /* Safari: no native WebP */ }
    }
    longWork(raster.pixels, 6000);
    return { blob: await encodeWebpWasm(raster.rgba(), width, height, quality), note: '' };
  }
  if (format === 'jpg') {
    if (raster.canvas) { flattenOntoWhite(raster.canvas.getContext('2d'), width, height); return { blob: await checkedBlob(raster.canvas, 'image/jpeg', quality / 100), note: '' }; }
    longWork(raster.pixels, 3000);
    return { blob: await encodeJpegWasm(raster.rgba(), width, height, quality), note: '' };
  }
  if (raster.canvas) return { blob: await checkedBlob(raster.canvas, 'image/png'), note: '' };
  return { blob: await encodePngRGBA(raster.rgba(), width, height, alive), note: '' };
}

async function run({ items, format, quality, maxMegapixels }) {
  const limit = maxMegapixels || MAX_MEGAPIXELS;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const { blob, note } = await convertOne({ ...item, index: i }, format, quality, limit);
      self.postMessage({ type: 'file-done', index: i, name: item.name, originalSize: item.originalSize, blob, convertedSize: blob.size, note });
    } catch (err) {
      const isLimit = err instanceof LimitExceededError;
      self.postMessage({ type: 'file-error', index: i, name: item.name, message: err?.message || String(err), isLimit, detectedFormat: err?.detectedFormat || null });
    }
    self.postMessage({ type: 'progress', pct: Math.round(((i + 1) / items.length) * 100) });
  }
  self.postMessage({ type: 'done' });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  });
};
