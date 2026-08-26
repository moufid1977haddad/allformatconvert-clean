import { MAX_PAGES } from './config';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

async function run({ file, maxPages }) {
  const limit = maxPages || MAX_PAGES;
  const arrayBuffer = await file.arrayBuffer();
  self.postMessage({ type: 'progress', pct: 20, phase: 'loading' });

  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  if (pageCount > limit) {
    throw new LimitExceededError(`This PDF has ${pageCount.toLocaleString()} pages, more than the ${limit.toLocaleString()}-page limit.`);
  }

  self.postMessage({ type: 'progress', pct: 50, phase: 'compressing' });
  const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
  self.postMessage({ type: 'progress', pct: 95, phase: 'compressing' });

  const originalSize = file.size;
  const newSize = compressed.byteLength;
  const ratio = (((originalSize - newSize) / originalSize) * 100).toFixed(1);
  const blob = new Blob([compressed], { type: 'application/pdf' });
  self.postMessage({ type: 'done', blob, originalSize, newSize, ratio, name: file.name });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    if (err instanceof LimitExceededError) {
      self.postMessage({ type: 'limit', message: err.message });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
