// Files are extracted ON DEMAND (one file when its Download is clicked; batches for "all as ZIP" / "save all"),
// so the archive itself has no size cap: it is read from disk in pieces. What must fit in the tab's memory is one
// extracted file at a time, a .tar unpacked from a .tar.gz, and -- only where the browser cannot stream a ZIP to
// disk (Firefox, Safari) -- the whole "all as ZIP" download.
// Measured 2026-09-24 (docs/audit/RAPPORT-licence-et-ameliorations.md §5, scripts/browser-tests/zip-extractor-cap.mjs):
//   1.86 GiB extracted at once (two 950 MiB files): Chromium and Firefox OK, both downloads intact;
//   the same as one ZIP Blob: Firefox OK (1 992 294 626 bytes, 23 s), Chromium "Failed to fetch" (its Blob store
//   is bounded) -- hence the ZIP streamed to disk with showSaveFilePicker there;
//   2.8 GiB held at once: Firefox froze with no error. Batches keep far below that.
export const BATCH_BYTES = 256 * 1024 * 1024; // extracted per step of "all as ZIP" / "save all"
export const MOBILE_BATCH_BYTES = 64 * 1024 * 1024;
export const MAX_FILE_BYTES = 1900 * 1000 * 1000; // one file, and a .tar unpacked from a .tar.gz
export const MAX_FILE_LABEL = '1.9 GB';
export const MOBILE_MAX_FILE_BYTES = 300 * 1000 * 1000;
export const MOBILE_MAX_FILE_LABEL = '300 MB';
export const ZIP_IN_MEMORY_MAX = 1900 * 1000 * 1000; // "all as ZIP" built as one Blob (no streaming to disk)
export const ZIP_IN_MEMORY_LABEL = '1.9 GB';
