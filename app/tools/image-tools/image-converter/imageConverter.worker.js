import { MAX_MEGAPIXELS } from './config';

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

async function decodeTiff(blob) {
  const UTIF = (await import('utif2')).default;
  const buffer = await blob.arrayBuffer();
  const ifds = UTIF.decode(buffer);
  if (!ifds.length) throw new Error('No image data found in this TIFF file');
  // UTIF.js only decodes chunky (interleaved) TIFFs correctly -- for a
  // planar one (PlanarConfiguration=2, color planes stored separately) it
  // still "succeeds" but silently produces corrupted, striped pixel data,
  // so this must be caught before decodeImage rather than left to ship a
  // garbled result.
  if (ifds[0].t284 && ifds[0].t284[0] === 2) {
    const err = new Error('This TIFF uses planar color storage (separate color-plane layout), which this decoder cannot read correctly. Re-save it with chunky/interleaved color storage first.');
    err.knownLimitation = true;
    throw err;
  }
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  return { width: ifds[0].width, height: ifds[0].height, rgba };
}

async function convertOne(item, format, quality, maxMegapixels) {
  const { blob, name } = item;
  const isTiff = /\.(tif|tiff)$/i.test(name);
  let width, height;
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');

  if (isTiff) {
    let decoded;
    try {
      decoded = await decodeTiff(blob);
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
