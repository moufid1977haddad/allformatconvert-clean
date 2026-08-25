// Re-measured 2026-08-25: the previous 500,000-row cap was rejected. Node
// peak RSS at that size was 4.25GB against a live-measured Chrome tab heap
// ceiling of ~4.19GB (via performance.memory.jsHeapSizeLimit) -- that's the
// edge of the cliff, not a safety margin, and a laptop with 8GB total RAM
// and other tabs open would crash where this dev machine didn't.
//
// The memory ceiling is the decisive constraint (it's what kills the tab),
// with a secondary real-browser time budget of 15s. Node peak RSS measured
// against synthetic product-catalog CSVs (same shape used for the original
// benchmark, reproduced to within ~10% of its 500k-row numbers):
//   200,000 rows: ~1.5GB peak RSS, ~8.1s Node / ~12.5s real-browser (x1.55)
//   250,000 rows: ~2.0GB peak RSS, ~11.8s Node / ~18.3s real-browser
//   300,000 rows: ~2.3GB peak RSS, ~16.2s Node / ~25.1s real-browser
// 250,000 already blows the 15s real-browser time budget even though its
// memory is still (barely) under half the heap ceiling; 300,000 fails both.
// 200,000 rows is the largest tier that clears both bars with real margin:
// ~1.5GB is ~36% of the 4.19GB ceiling (well under the 50% target), and
// ~12.5s leaves ~2.5s of headroom under the 15s budget. This is a client-side
// row limit, not Excel's own 1,048,576-rows-per-sheet ceiling -- files this
// size never approach that.
export const MAX_ROWS = 200000;

// Lower cap for phones/tablets. Re-measured 2026-08-25 for the same reason
// as the desktop cap above: the previous 50,000-row tier peaked at 620MB
// Node RSS, too close to what a 1-2GB-RAM entry-level Android phone can
// actually give a single tab (commonly well under 500MB once the OS and
// browser chrome take their share) -- iOS Safari's ~2GB kill threshold isn't
// the binding constraint here, low-RAM Android is.
//   20,000 rows: ~357MB peak RSS, ~0.7s Node / ~1.1s real-browser
//   30,000 rows: ~437MB peak RSS, ~1.2s Node / ~1.9s real-browser
// 30,000 rows (437MB) leaves little real margin against a conservative
// ~500MB entry-level budget. 20,000 rows (357MB) leaves clear margin --
// about 29% of a 500MB budget still free -- so it's the tier kept.
export const MOBILE_MAX_ROWS = 20000;
