// Measured with Node (parse + object-build + JSON.stringify) against the
// same synthetic product-catalog CSV shape used to re-measure csv-to-excel,
// scaled to a real-browser time via the confirmed ~1.55x Node-to-Chrome
// ratio. Same decision rule as csv-to-excel: peak memory must stay under
// half the live-measured ~4.19GB Chrome tab heap ceiling (~2.10GB), and
// real-browser time under a 15s budget -- memory is decisive.
//   500,000 rows: ~1.64GB peak RSS (78% of budget), ~8.1s real-browser
//   650,000 rows: ~2.11GB peak RSS -- already over the memory budget
// 500,000 rows is kept for real margin (22% of the memory budget still
// free, and well under the time budget too) rather than pushing to the
// 600K-650K edge where the margin gets thin.
export const MAX_ROWS = 500000;

// Mobile/tablet file cap. Same reasoning as csv-to-excel's mobile cap: keep
// clear margin under a conservative ~500MB budget for what a 1-2GB-RAM
// entry-level Android phone can give a single tab.
//   70,000 rows: ~385MB peak RSS (77% of a 500MB budget)
//   80,000 rows: ~409MB peak RSS (82%, thinner margin)
export const MOBILE_MAX_ROWS = 70000;

// Pasted text gets its own, lower cap distinct from the file cap, on both
// desktop and mobile. A paste doesn't go through the worker's streamed
// file.stream() path -- it lands in React state and is re-rendered into a
// controlled <textarea> on the main thread, a DOM cost Node can't measure.
// Reusing the already-conservative mobile file tier as the paste cap on
// every device keeps that unmeasured DOM cost bounded by a tier that's
// already proven safe for the weakest supported hardware.
export const PASTE_MAX_ROWS = MOBILE_MAX_ROWS;
