// Measured with Node (pdf-lib: PDFDocument.load + copyPages + save) against
// synthetic scanned-document PDFs -- a distinct ~340KB JPEG "scan" embedded
// per page (150dpi, quality 70), the realistic worst case for pdf-merge:
// image-heavy PDFs are what actually balloon pdf-lib's memory, far more
// than the same page count of plain text would. Peak RSS tracked almost
// perfectly with total input BYTES regardless of how those bytes were
// split into pages or files (~2.15-2.2x input size across every tier
// tested), so total size is the more direct constraint here, with total
// page count as a second, independent gate.
//
// Same decision rule as the rest of this reliability pass: peak memory
// under half the live-measured ~4.19GB Chrome tab heap ceiling (~2.10GB),
// real-browser time (Node x1.55) under 15s, memory decisive.
//   1,500 pages / 488MB: ~1.08GB peak RSS (51%), ~4.9s real-browser
//   2,000 pages / 650MB: ~1.41GB peak RSS (67%), ~6.5s real-browser
//   2,500 pages / 812MB: ~1.74GB peak RSS (83%), ~8.4s real-browser
// 2,000 pages / 700MB (rounded up slightly from the measured 650MB point
// for margin) is kept: real headroom on both axes (33% memory, 57% time)
// rather than the 2,500 tier's much thinner 17% memory margin.
export const MAX_TOTAL_PAGES = 2000;
export const MAX_TOTAL_SIZE_BYTES = 700 * 1024 * 1024; // 700 MB
export const MAX_TOTAL_SIZE_LABEL = '700 MB';

// Mobile/tablet caps, same conservative reasoning as the rest of the family
// (weak CPU and low total RAM, and the 1.55x ratio was only confirmed on
// desktop Chrome):
//   200 pages / 65MB: ~201MB peak RSS (40% of a 500MB budget)
//   300 pages / 98MB: ~272MB peak RSS (54%, still real margin) -- kept
export const MOBILE_MAX_TOTAL_PAGES = 300;
export const MOBILE_MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MOBILE_MAX_TOTAL_SIZE_LABEL = '100 MB';
