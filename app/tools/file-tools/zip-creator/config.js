// Measured with Node (JSZip: add files, then generateAsync) against
// synthetic already-compressed-like content (pseudo-random bytes) -- the
// realistic worst case for a general-purpose zip tool, since most real
// bundles are photos/PDFs/videos that are already compressed and gain
// nothing (but cost CPU) from DEFLATE, unlike easily-compressible text.
// Same decision rule as the rest of this reliability pass: peak memory
// under half the ~4.19GB Chrome tab heap ceiling (~2.10GB), real-browser
// time (Node x1.55) under 15s, memory decisive.
//   500MB total: ~1.07GB peak RSS (51%), ~2.9s real-browser
//   650MB total: ~1.37GB peak RSS (66%), ~3.6s real-browser
//   810MB total: ~1.69GB peak RSS (81%) -- thinner margin
// 700MB is kept (interpolates to ~70% memory / 30% margin) -- matching
// the same 700MB total-size cap already used for pdf-merge/zip-creator's
// PDF-family siblings, for one consistent "large-batch tools support up
// to X" limit across the site.
export const MAX_TOTAL_SIZE_BYTES = 700 * 1024 * 1024; // 700 MB
export const MAX_TOTAL_SIZE_LABEL = '700 MB';

// Mobile/tablet cap, matching the same family-wide 100MB figure:
//   100MB total: ~259MB peak RSS (52% of a 500MB budget)
//   150MB total: ~361MB peak RSS (72%, thinner margin)
export const MOBILE_MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MOBILE_MAX_TOTAL_SIZE_LABEL = '100 MB';
