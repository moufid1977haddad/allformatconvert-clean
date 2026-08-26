// Measured with Node (pdf-lib: PDFDocument.load + save({useObjectStreams:
// true})) against the same synthetic scanned-document PDFs used for
// pdf-merge/pdf-split (a distinct ~340KB JPEG "scan" embedded per page).
// Compress doesn't copy pages the way merge/split do, but save() with
// object streams still turns out costlier than split's per-range save,
// landing very close to pdf-merge's own numbers:
//   1,500 pages / 488MB: ~1.06GB peak RSS (51%), ~4.8s real-browser
//   2,000 pages / 650MB: ~1.40GB peak RSS (67%), ~6.5s real-browser
//   3,000 pages / 975MB: ~2.06GB peak RSS (98%!) -- right at the cliff
// 2,000 pages is kept (33% memory margin, 57% time margin) -- almost
// identical to pdf-merge's own kept tier, so the cap is set to match:
// one consistent "PDF tools support up to X" limit across the family.
export const MAX_PAGES = 2000;
export const MAX_FILE_SIZE_BYTES = 700 * 1024 * 1024; // 700 MB
export const MAX_FILE_SIZE_LABEL = '700 MB';

// Mobile/tablet cap, directly measured and matching the rest of the family:
//   300 pages / 98MB: ~264MB peak RSS (53% of a 500MB budget)
export const MOBILE_MAX_PAGES = 300;
export const MOBILE_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MOBILE_MAX_FILE_SIZE_LABEL = '100 MB';
