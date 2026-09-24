import { MAX_PAGES } from './config';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

// Kept alive between messages so a file is parsed exactly once: 'load'
// parses it and reports the page count, then 'split' reuses the same
// PDFDocument instance instead of re-reading and re-parsing the file a
// second time.
let loadedDoc = null;

async function handleLoad({ file, maxPages }) {
  const limit = maxPages || MAX_PAGES;
  const arrayBuffer = await file.arrayBuffer();
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  if (pageCount > limit) {
    loadedDoc = null;
    throw new LimitExceededError(`This PDF has ${pageCount.toLocaleString()} pages, more than the ${limit.toLocaleString()}-page limit.`);
  }
  loadedDoc = pdfDoc;
  self.postMessage({ type: 'loaded', pageCount });
}

// files: [{ label, pages: [0-based indices] }], already validated by splitPlan.js in the page.
async function handleSplit({ files, originalName }) {
  if (!loadedDoc) throw new Error('No PDF loaded.');
  const { PDFDocument } = await import('pdf-lib');
  const { partName } = await import('./splitPlan');
  const pdfDoc = loadedDoc;
  const totalPages = pdfDoc.getPageCount();
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const { label, pages } = files[i];
    if (!pages.length || pages.some((p) => p < 0 || p >= totalPages)) throw new Error(`Pages ${label} are not in this PDF.`);
    const newPdf = await PDFDocument.create();
    const copied = await newPdf.copyPages(pdfDoc, pages);
    copied.forEach((p) => newPdf.addPage(p));
    const bytes = await newPdf.save();
    // Never hand over a part that does not hold the pages it is named after.
    if (newPdf.getPageCount() !== pages.length) throw new Error(`Part ${label} came out with ${newPdf.getPageCount()} pages instead of ${pages.length}.`);
    results.push({ blob: new Blob([bytes], { type: 'application/pdf' }), name: partName(originalName, label), pages: pages.length });
    self.postMessage({ type: 'progress', pct: Math.round(((i + 1) / files.length) * 100), phase: 'splitting' });
  }
  self.postMessage({ type: 'done', results });
}

self.onmessage = (e) => {
  const msg = e.data;
  const handler = msg.type === 'load' ? handleLoad(msg) : handleSplit(msg);
  handler.catch((err) => {
    if (err instanceof LimitExceededError) {
      self.postMessage({ type: 'limit', message: err.message });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
