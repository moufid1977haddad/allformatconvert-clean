// Measured with Node (pdf-lib: PDFDocument.load, then copyPages + rotate +
// draw overlays (text/image, ~1 in 20 pages) + save per page, one page at a
// time -- the actual shape of this tool's "Save Changes" worker path)
// against a single synthetic scanned-document PDF -- a distinct ~340KB
// JPEG "scan" embedded per page (150dpi, quality 70), the same realistic
// worst-case shape used for pdf-merge/pdf-split. Adding representative
// overlays (text + a small image on 1 in 20 pages) changed peak RSS by
// under 1% versus the plain copy path, so overlay usage isn't a separate
// gating factor here -- full-page scanned images dominate memory either
// way. Peak RSS matched pdf-merge's numbers almost exactly at the same
// tiers (same underlying copyPages+save operation):
//
// Same decision rule as the rest of this reliability pass: peak memory
// under half the live-measured ~4.19GB Chrome tab heap ceiling (~2.10GB),
// real-browser time (Node x1.55) under 15s, memory decisive.
//   1,500 pages / 489MB: ~1.05GB peak RSS (50%), ~5.0s real-browser
//   2,000 pages / 652MB: ~1.39GB peak RSS (67%), ~6.6s real-browser
//   3,000 pages / 977MB: ~2.05GB peak RSS (97%), ~9.9s real-browser
// 3,000 pages leaves almost no memory margin (97%) despite time being
// fine, so the cap is kept aligned with pdf-merge/pdf-split's family
// limit (2,000 pages / 700MB) for one consistent "PDF tools support up to
// X" figure across the family, with real headroom (33% memory, 56% time).
export const MAX_PAGES = 2000;
export const MAX_FILE_SIZE_BYTES = 700 * 1024 * 1024; // 700 MB
export const MAX_FILE_SIZE_LABEL = '700 MB';

// Mobile/tablet cap, directly measured (not interpolated) and matching
// pdf-merge/pdf-split's mobile tier for the same consistency reason:
//   300 pages / 98MB: ~263MB peak RSS (53% of a 500MB budget)
export const MOBILE_MAX_PAGES = 300;
export const MOBILE_MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MOBILE_MAX_FILE_SIZE_LABEL = '100 MB';
