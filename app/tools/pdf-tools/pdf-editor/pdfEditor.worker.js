import { MAX_PAGES, MAX_FILE_SIZE_BYTES } from './config';

class LimitExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LimitExceededError';
  }
}

// Reads the file in chunks (rather than one blocking file.arrayBuffer() call)
// so real read progress can be reported for large uploads.
async function readFileWithProgress(file, pctStart, pctEnd) {
  const total = file.size || 0;
  let read = 0;
  let lastReportedPct = -1;
  const chunks = [];
  const reader = file.stream().getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    read += value.length;
    if (total > 0) {
      const pct = pctStart + Math.floor((read / total) * (pctEnd - pctStart));
      if (pct !== lastReportedPct) {
        lastReportedPct = pct;
        self.postMessage({ type: 'progress', pct, phase: 'reading' });
      }
    }
  }
  const merged = new Uint8Array(read);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function toRgb(rgbFn, [r, g, b]) {
  return rgbFn(r / 255, g / 255, b / 255);
}

function drawOverlaysOnPage(page, overlays, font, rgb, embeddedImages) {
  for (const item of overlays) {
    if (item.type === 'text') {
      page.drawText(item.text, {
        x: item.x,
        y: item.y,
        size: item.fontSize,
        font,
        color: toRgb(rgb, item.color),
      });
    } else if (item.type === 'image') {
      const embedded = embeddedImages.get(item.id);
      if (embedded) page.drawImage(embedded, { x: item.x, y: item.y, width: item.width, height: item.height });
    } else if (item.type === 'rect') {
      page.drawRectangle({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        color: toRgb(rgb, item.color),
        opacity: item.opacity ?? 0.35,
      });
    } else if (item.type === 'stroke') {
      const pts = item.points;
      for (let i = 1; i < pts.length; i++) {
        page.drawLine({
          start: { x: pts[i - 1].x, y: pts[i - 1].y },
          end: { x: pts[i].x, y: pts[i].y },
          thickness: item.widthPt,
          color: toRgb(rgb, item.color),
          opacity: 1,
        });
      }
    }
  }
}

async function run({ file, pageOrder, overlays, mode, selectedIndices, maxPages }) {
  const limit = maxPages || MAX_PAGES;
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new LimitExceededError(
      `This file is ${(file.size / (1024 * 1024)).toFixed(0)} MB, over the ${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB limit.`
    );
  }

  const bytes = await readFileWithProgress(file, 0, 25);
  self.postMessage({ type: 'progress', pct: 28, phase: 'loading' });

  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib');
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

  if (mode === 'extract') {
    if (!selectedIndices || selectedIndices.length === 0) throw new Error('No pages selected.');
    if (selectedIndices.length > limit) {
      throw new LimitExceededError(`Cannot extract more than ${limit.toLocaleString()} pages at once.`);
    }
    const outDoc = await PDFDocument.create();
    const copied = await outDoc.copyPages(srcDoc, selectedIndices);
    copied.forEach((p) => outDoc.addPage(p));
    self.postMessage({ type: 'progress', pct: 90, phase: 'saving' });
    const pdfBytes = await outDoc.save();
    self.postMessage({ type: 'done', blob: new Blob([pdfBytes], { type: 'application/pdf' }), pageCount: copied.length });
    return;
  }

  if (pageOrder.length > limit) {
    throw new LimitExceededError(`This document has more than ${limit.toLocaleString()} pages, over what this editor reliably handles in a browser tab.`);
  }

  // Embed each unique added image once, even if placed on multiple pages.
  const embeddedImages = new Map();
  const imageItems = overlays.filter((o) => o.type === 'image');
  for (const item of imageItems) {
    if (embeddedImages.has(item.id)) continue;
    const embedded = item.format === 'png' ? await srcDoc.embedPng(item.bytes) : await srcDoc.embedJpg(item.bytes);
    embeddedImages.set(item.id, embedded);
  }

  const font = await srcDoc.embedFont(StandardFonts.Helvetica);
  const outDoc = await PDFDocument.create();

  const overlaysByOriginalIndex = new Map();
  for (const item of overlays) {
    if (!overlaysByOriginalIndex.has(item.pageIndex)) overlaysByOriginalIndex.set(item.pageIndex, []);
    overlaysByOriginalIndex.get(item.pageIndex).push(item);
  }

  const total = pageOrder.length;
  for (let i = 0; i < total; i++) {
    const entry = pageOrder[i];
    const [newPage] = await outDoc.copyPages(srcDoc, [entry.originalIndex]);
    if (entry.rotationDelta) {
      const current = newPage.getRotation().angle;
      newPage.setRotation(degrees((current + entry.rotationDelta) % 360));
    }
    const pageOverlays = overlaysByOriginalIndex.get(entry.originalIndex);
    if (pageOverlays && pageOverlays.length > 0) {
      drawOverlaysOnPage(newPage, pageOverlays, font, rgb, embeddedImages);
    }
    outDoc.addPage(newPage);
    self.postMessage({ type: 'progress', pct: 30 + Math.round(((i + 1) / total) * 60), phase: 'building' });
  }

  self.postMessage({ type: 'progress', pct: 95, phase: 'saving' });
  const pdfBytes = await outDoc.save();
  self.postMessage({ type: 'done', blob: new Blob([pdfBytes], { type: 'application/pdf' }), pageCount: total });
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
