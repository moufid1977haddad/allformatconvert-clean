import { MAX_TOTAL_PAGES } from './config';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { outlineItems, writeOutline, carryFormsMany } from '../../../lib/pdfCarryOver';

class LimitExceededError extends Error {
  constructor(message, kind) {
    super(message);
    this.name = 'LimitExceededError';
    this.kind = kind;
  }
}

async function run({ files, maxPages, bookmarkPerFile = true }) {
  const limit = maxPages || MAX_TOTAL_PAGES;
  const lib = await import('pdf-lib');
  const { PDFDocument, PDFHexString, PDFName } = lib;
  // P24 (03/10): bookmarks and form fields are kept (they were lost without a word): each file's own bookmarks, under
  // one bookmark per file named after it (Sejda, PDF24), and the form fields of every file in one working form
  const outline = [];
  const formSources = [];

  const mergedPdf = await PDFDocument.create();
  let totalPages = 0;
  for (let i = 0; i < files.length; i++) {
    const arrayBuffer = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(await openablePdfBytes(arrayBuffer), { ignoreEncryption: true });
    const indices = pdf.getPageIndices();
    if (totalPages + indices.length > limit) {
      throw new LimitExceededError(
        `These files add up to more than ${limit.toLocaleString()} pages combined.`,
        'pages'
      );
    }
    const pages = await mergedPdf.copyPages(pdf, indices);
    pages.forEach((page) => mergedPdf.addPage(page));
    formSources.push({ src: pdf, from: totalPages, to: totalPages + indices.length });
    const own = outlineItems(lib, pdf, mergedPdf, indices.map((x) => x + 1), totalPages);
    if (bookmarkPerFile && files.length > 1 && pages.length) {
      const dict = mergedPdf.context.obj({});
      dict.set(PDFName.of('Title'), PDFHexString.fromText(String(files[i].name || `File ${i + 1}`).replace(/\.[a-z0-9]+$/i, '')));
      dict.set(PDFName.of('Dest'), mergedPdf.context.obj([pages[0].ref, PDFName.of('Fit')]));
      outline.push({ dict, children: own, open: false });
    } else outline.push(...own);
    totalPages += indices.length;
    self.postMessage({ type: 'progress', pct: Math.round(((i + 1) / files.length) * 90), phase: 'merging' });
  }

  if (outline.length) writeOutline(lib, mergedPdf, outline);
  const renamed = carryFormsMany(lib, formSources, mergedPdf);
  self.postMessage({ type: 'progress', pct: 95, phase: 'saving' });
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  self.postMessage({ type: 'done', blob, pageCount: totalPages, renamed });
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
