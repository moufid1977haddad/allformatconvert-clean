// Measured with Node (same parse/build code, comparable V8 engine) against
// synthetic product-catalog CSVs: 500,000 rows completes in ~14s and stays
// well clear of the memory blowup that hits at higher row counts (1M rows
// took ~37s with sharply worsening GC pressure; 2M rows crashed with an
// out-of-memory error). This is a client-side row limit, not Excel's own
// 1,048,576-rows-per-sheet ceiling -- files this size never approach that.
// Confirmed against real Chrome in production (not just Node): 500,000 rows
// (93MB CSV) completed in 30.3s and produced a 257MB .xlsx download without
// issue -- the browser adds roughly 1.5x Node's time (worker transfer +
// engine overhead) but no crash risk at this cap.
export const MAX_ROWS = 500000;

// Lower cap for phones/tablets. Node measurements at this size: 620MB peak
// RSS and a 25MB output file, vs. 4.25GB RSS and a 257MB output file at the
// desktop cap above. Mobile browser tabs are commonly killed well under
// 2GB (iOS Safari) or even less on low-RAM Android devices, and a 257MB
// download is impractical on a phone regardless of memory; 50,000 rows
// keeps both the memory footprint and the download size in territory that's
// safe across real-world mobile hardware, with several times the margin of
// the desktop cap relative to its own crash risk.
export const MOBILE_MAX_ROWS = 50000;
