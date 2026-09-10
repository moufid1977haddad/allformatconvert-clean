import { MAX_MEGAPIXELS } from './config';
import { decodeTiff } from '../../../lib/tiffDecode';
import { sniffFormat, NATIVE_BITMAP_FORMATS } from '../../../lib/detectFileFormat';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

const MIME_BY_FORMAT = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
  avif: 'image/avif',
};

async function convertOne(item, format, quality, maxMegapixels) {
  const { blob, name } = item;
  // Route by the file's real header bytes, not its filename -- a PNG (or
  // any other browser-native format) saved with a mismatched or generic
  // extension still converts correctly this way, and a genuine TIFF still
  // gets the TIFF decoder even if it wasn't named .tif/.tiff. See
  // docs/audit/RAPPORT-tiff-paint.md.
  const headerBuf = await blob.slice(0, 32).arrayBuffer();
  const detected = sniffFormat(new Uint8Array(headerBuf));
  let width, height;
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');

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
    ({ width, height } = decoded);
    const megapixels = (width * height) / 1e6;
    if (megapixels > maxMegapixels) {
      throw new LimitExceededError(`"${name}" is ${megapixels.toFixed(0)} megapixels, more than the ${maxMegapixels}-megapixel limit.`);
    }
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(decoded.rgba), width, height), 0, 0);
  } else {
    let bitmap;
    try {
      bitmap = await createImageBitmap(blob);
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
    width = bitmap.width;
    height = bitmap.height;
    const megapixels = (width * height) / 1e6;
    if (megapixels > maxMegapixels) {
      bitmap.close();
      throw new LimitExceededError(`"${name}" is ${megapixels.toFixed(0)} megapixels, more than the ${maxMegapixels}-megapixel limit.`);
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
  }

  return canvas.convertToBlob({ type: MIME_BY_FORMAT[format], quality: quality / 100 });
}

async function run({ items, format, quality, maxMegapixels }) {
  const limit = maxMegapixels || MAX_MEGAPIXELS;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const blob = await convertOne(item, format, quality, limit);
      self.postMessage({ type: 'file-done', index: i, name: item.name, originalSize: item.originalSize, blob, convertedSize: blob.size });
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
