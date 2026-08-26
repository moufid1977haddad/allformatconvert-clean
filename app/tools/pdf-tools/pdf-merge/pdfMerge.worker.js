import { MAX_TOTAL_PAGES } from './config';

class LimitExceededError extends Error {
  constructor(message, kind) {
    super(message);
    this.name = 'LimitExceededError';
    this.kind = kind;
  }
}

async function run({ files, maxPages }) {
  const limit = maxPages || MAX_TOTAL_PAGES;
  const { PDFDocument } = await import('pdf-lib');

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;
  for (let i = 0; i < files.length; i++) {
    const arrayBuffer = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const indices = pdf.getPageIndices();
    if (totalPages + indices.length > limit) {
      throw new LimitExceededError(
        `These files add up to more than ${limit.toLocaleString()} pages combined.`,
        'pages'
      );
    }
    const pages = await mergedPdf.copyPages(pdf, indices);
    pages.forEach((page) => mergedPdf.addPage(page));
    totalPages += indices.length;
    self.postMessage({ type: 'progress', pct: Math.round(((i + 1) / files.length) * 90), phase: 'merging' });
  }

  self.postMessage({ type: 'progress', pct: 95, phase: 'saving' });
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  self.postMessage({ type: 'done', blob, pageCount: totalPages });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    if (err instanceof LimitExceededError) {
      self.postMessage({ type: 'limit', kind: err.kind, message: err.message });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
