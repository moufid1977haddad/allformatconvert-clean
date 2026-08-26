// Measured with Node (pdf-lib: PDFDocument.load once, then copyPages+save
// per output range) against a single synthetic scanned-document PDF -- a
// distinct ~340KB JPEG "scan" embedded per page, the same realistic
// worst-case shape used for pdf-merge. Splitting is lighter on memory than
// merging the same page count: ranges are processed and saved one at a
// time rather than accumulating N source documents at once, so peak RSS
// tracked input bytes at only ~1.2-1.3x (vs. merge's ~2.15-2.2x).
//   1,500 pages / 488MB: ~721MB peak RSS (34%), ~4.8s real-browser
//   3,000 pages / 975MB: ~1.23GB peak RSS (59%), ~9.5s real-browser
// Both real-browser and memory margins stay comfortable even at 3,000
// pages, well beyond any realistic single-document page count. Rather
// than push to that tool-specific edge, the cap is kept aligned with
// pdf-merge's (2,000 pages / 700MB) for one consistent "PDF tools support
// up to X" limit across the family -- interpolating split's own numbers
// puts 2,000 pages at only ~890MB peak (42% of budget), so this is a
// deliberately generous-margin choice, not a tight one.
export const MAX_PAGES = 2000;
export const MAX_FILE_SIZE_BYTES = 700 * 1024 * 1024; // 700 MB
export const MAX_FILE_SIZE_LABEL = '700 MB';

// Mobile/tablet cap, directly measured (not interpolated) and matching
// pdf-merge's mobile tier for the same consistency reason:
//   300 pages / 98MB: ~211MB peak RSS (42% of a 500MB budget)
export const MOBILE_MAX_PAGES = 300;
export const MOBILE_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MOBILE_MAX_FILE_SIZE_LABEL = '100 MB';
