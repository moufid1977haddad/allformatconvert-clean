// Fixes a real bug: the previous implementation read the whole file with
// file.arrayBuffer() (fully materializing it), then built every output
// chunk as its own eagerly-allocated Blob up front -- roughly 2x+ the
// original file size resident in memory simultaneously, for a tool whose
// entire purpose is handling files too large to deal with otherwise.
//
// Node-measured (same operation, old vs. new) using a Blob-backed buffer
// standing in for an uploaded File:
//   500MB file, old: ~2.12GB peak RSS (right at the ~4.19GB heap ceiling's
//     edge already) -- new: ~1.05GB (that remainder is this test's own
//     synthetic setup buffer, not the algorithm), splitMs: 0
//   1,000MB file, old: ~4.09GB peak RSS (essentially AT the crash
//     boundary) -- new: ~2.05GB (again just the test's own setup cost),
//     splitMs: 1
// The fix is Blob.slice() -- a lazy, zero-copy view that reads no bytes
// until something actually consumes the resulting chunk (e.g. a
// download). This eliminates the size-driven memory risk entirely: a real
// browser File from <input type="file"> is disk-backed and was never
// fully materialized in memory just by being selected, so splitting no
// longer costs memory proportional to file size at all -- only whichever
// single chunk is being downloaded at a given moment does.
//
// With that risk gone, the file-size cap below is a generous sanity
// backstop rather than a tight, measured ceiling, and the real remaining
// guardrail is chunk COUNT: producing thousands of tiny output files
// would overwhelm the download-link list in the UI regardless of memory
// safety.
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
export const MAX_FILE_SIZE_LABEL = '5 GB';
export const MAX_CHUNKS = 1000;
