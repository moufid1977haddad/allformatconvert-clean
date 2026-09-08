import { MAX_MEGAPIXELS } from './config';
import { decodeTiff } from '../../../lib/tiffDecode';

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
  const isTiff = /\.(tif|tiff)$/i.test(name);
  let width, height;
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');

  if (isTiff) {
    let decoded;
    try {
      const buffer = await blob.arrayBuffer();
      decoded = await decodeTiff(buffer);
    } catch (err) {
      // Re-throw the specific, actionable message from decodeTiff's own
      // validation (e.g. planar color storage) as-is; only fall back to a
      // generic message for a genuine parse failure.
      throw err instanceof Error && err.knownLimitation ? err : new Error(`Failed to decode "${name}". It may be corrupted or in an unsupported format.`);
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
      throw new Error(`Failed to decode "${name}". It may be corrupted or in an unsupported format.`);
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
      self.postMessage({ type: 'file-error', index: i, name: item.name, message: err?.message || String(err), isLimit });
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
