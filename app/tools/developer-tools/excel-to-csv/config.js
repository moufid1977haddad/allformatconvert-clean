// Excel files can't be parsed incrementally the way CSV text can -- XLSX.read
// has to ingest the whole zip/XML container before any row exists, so there's
// no way to bail out mid-parse once a row-count limit is crossed the way the
// CSV-family tools do. The real gate here is FILE SIZE, checked before the
// worker is even started; the post-parse row count is a secondary check that
// protects the output stage and gives an honest error, not a way to save the
// (already paid) parse cost.
//
// Measured in Node (XLSX.read + sheet_to_csv) against synthetic .xlsx files
// built from the same product-catalog row shape used elsewhere in this
// family (bytes/row is fairly linear for this shape: ~0.49MB per 1,000
// rows). Time is the decisive constraint here, not memory -- XLSX.read's
// zip/XML parsing is CPU-bound and dwarfs the conversion step itself.
//   100,000 rows (48.9MB): ~4.8s Node / ~7.5s real-browser, 549MB peak RSS
//   150,000 rows (74.1MB): ~7.4s Node / ~11.5s real-browser, 832MB peak RSS
//   200,000 rows (99.4MB): ~10.1s Node / ~15.6s real-browser -- over budget
// 150,000 rows is kept for real margin under the 15s real-browser budget
// (~24% headroom) with memory nowhere close to binding (832MB vs. the
// ~2.1GB half-heap budget).
export const MAX_ROWS = 150000;
export const MAX_FILE_SIZE_BYTES = 90 * 1024 * 1024; // 90 MB, ~150K rows' worth plus margin
export const MAX_FILE_SIZE_LABEL = '90 MB';

// Mobile/tablet cap. Extra conservative here versus the rest of the family:
// the 1.55x Node-to-Chrome time ratio used throughout was only confirmed on
// a desktop machine, and this tool's cost is CPU-bound parsing, which a
// low-end phone's weaker CPU (not just its lower memory) will feel far more
// than the memory-bound CSV/JSON/SQL tools do.
//   50,000 rows (24.4MB): ~2.4s Node / ~3.7s real-browser (desktop-scaled),
//     305MB peak RSS -- kept with room for mobile CPUs to run several times
//     slower than this desktop estimate and still land under 15s.
//   70,000 rows (34.2MB): ~3.4s Node / ~5.3s real-browser (desktop-scaled)
//     -- thinner margin against that same unverified mobile-CPU multiplier.
export const MOBILE_MAX_ROWS = 50000;
export const MOBILE_MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
export const MOBILE_MAX_FILE_SIZE_LABEL = '30 MB';
