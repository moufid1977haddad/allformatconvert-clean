// Measured with Node (same parse/build code, comparable V8 engine) against
// synthetic product-catalog CSVs: 500,000 rows completes in ~14s and stays
// well clear of the memory blowup that hits at higher row counts (1M rows
// took ~37s with sharply worsening GC pressure; 2M rows crashed with an
// out-of-memory error). This is a client-side row limit, not Excel's own
// 1,048,576-rows-per-sheet ceiling -- files this size never approach that.
export const MAX_ROWS = 500000;
