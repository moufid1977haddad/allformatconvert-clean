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

async function handleSplit({ ranges }) {
  if (!loadedDoc) throw new Error('No PDF loaded.');
  const { PDFDocument } = await import('pdf-lib');
  const pdfDoc = loadedDoc;
  const totalPages = pdfDoc.getPageCount();
  const parts = ranges.split(',').map((r) => r.trim()).filter(Boolean);
  const results = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const newPdf = await PDFDocument.create();
    let indices = [];
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10) - 1);
      for (let p = start; p <= end && p < totalPages; p++) if (p >= 0) indices.push(p);
    } else {
      const p = parseInt(part, 10) - 1;
      if (p >= 0 && p < totalPages) indices.push(p);
    }
    if (indices.length > 0) {
      const copied = await newPdf.copyPages(pdfDoc, indices);
      copied.forEach((p) => newPdf.addPage(p));
    }
    const bytes = await newPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    results.push({ blob, name: 'part-' + part.replace('-', '_') + '.pdf' });
    self.postMessage({ type: 'progress', pct: Math.round(((i + 1) / parts.length) * 100), phase: 'splitting' });
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
