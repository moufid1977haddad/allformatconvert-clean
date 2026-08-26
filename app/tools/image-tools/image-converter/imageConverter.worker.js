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

async function convertOne(file, format, quality, maxMegapixels) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Failed to decode "${file.name}". It may be corrupted or in an unsupported format.`);
  }
  const megapixels = (bitmap.width * bitmap.height) / 1e6;
  if (megapixels > maxMegapixels) {
    bitmap.close();
    throw new LimitExceededError(`"${file.name}" is ${megapixels.toFixed(0)} megapixels, more than the ${maxMegapixels}-megapixel limit.`);
  }
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await canvas.convertToBlob({ type: MIME_BY_FORMAT[format], quality: quality / 100 });
  return blob;
}

async function run({ files, format, quality, maxMegapixels }) {
  const limit = maxMegapixels || MAX_MEGAPIXELS;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const blob = await convertOne(file, format, quality, limit);
      self.postMessage({ type: 'file-done', index: i, name: file.name, originalSize: file.size, blob, convertedSize: blob.size });
    } catch (err) {
      const isLimit = err instanceof LimitExceededError;
      self.postMessage({ type: 'file-error', index: i, name: file.name, message: err?.message || String(err), isLimit });
    }
    self.postMessage({ type: 'progress', pct: Math.round(((i + 1) / files.length) * 100) });
  }
  self.postMessage({ type: 'done' });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  });
};
