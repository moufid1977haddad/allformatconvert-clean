// Files are extracted ON DEMAND (one file when its Download is clicked; batches for "all as ZIP" / "save all"),
// so the archive itself has no size cap: it is read from disk in pieces. What must fit in the tab's memory is one
// extracted file at a time, a .tar unpacked from a .tar.gz, and -- only where the browser cannot stream a ZIP to
// disk (Firefox, Safari) -- the whole "all as ZIP" download.
// Measured 2026-09-24 (docs/audit/RAPPORT-licence-et-ameliorations.md §5, scripts/browser-tests/zip-extractor-cap.mjs):
//   1.86 GiB extracted at once (two 950 MiB files): Chromium and Firefox OK, both downloads intact;
//   the same as one ZIP Blob: Firefox OK (1 992 294 626 bytes, 23 s), Chromium "Failed to fetch" (its Blob store
//   is bounded) -- hence the ZIP streamed to disk with showSaveFilePicker there;
//   2.8 GiB held at once: Firefox froze with no error. Batches keep far below that.
// Per-file cap measured 2026-09-25 on ONE file per archive, its own Download, SHA-256 checked (zip-extractor-cap.mjs,
// cap lifted in a local build only). 1.9 GB: OK everywhere (Chromium RAR 23.7 s, ZIP 13.2 s; Firefox 24.1 s, 22.8 s).
// 2.1 GB: Chromium + 7-Zip (RAR, 7z...) cut at 1.83 GiB -- its in-memory file grows by 1/8 steps and the next step
// passes the 2 GiB a single array can hold here, so the ceiling is ~1.96 GB, the lowest of all; the other three OK.
// 2.2 GB: also refused by Firefox + 7-Zip ("Blob ... larger than 2 GB") and Chromium + zip.js. 3 GB: only Firefox +
// zip.js. Every failure is a message, never a crashed tab. Hence 1.9 GB, under the lowest ceiling.
// Rechecked after the extracted file became preallocated (extract.worker.js): 1.9 GB still identical everywhere
// (Chromium RAR 13.9 s, ZIP 15.6 s; Firefox 16.1 s, 23.4 s).
export const BATCH_BYTES = 256 * 1024 * 1024; // extracted per step of "all as ZIP" / "save all"
export const MOBILE_BATCH_BYTES = 64 * 1024 * 1024;
export const MAX_FILE_BYTES = 1900 * 1000 * 1000; // one file, and a .tar unpacked from a .tar.gz
export const MAX_FILE_LABEL = '1.9 GB';
export const MOBILE_MAX_FILE_BYTES = 300 * 1000 * 1000;
export const MOBILE_MAX_FILE_LABEL = '300 MB';
export const ZIP_IN_MEMORY_MAX = 1900 * 1000 * 1000; // "all as ZIP" built as one Blob (no streaming to disk)
export const ZIP_IN_MEMORY_LABEL = '1.9 GB';
