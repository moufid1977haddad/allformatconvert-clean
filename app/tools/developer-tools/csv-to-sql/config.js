// Measured with Node (parse + CREATE TABLE/INSERT string-build) against the
// same synthetic product-catalog CSV shape used for csv-to-excel/csv-to-json,
// scaled to real-browser time via the confirmed ~1.55x Node-to-Chrome ratio.
// Same decision rule: peak memory under half the live-measured ~4.19GB
// Chrome tab heap ceiling (~2.10GB), real-browser time under a 15s budget,
// memory decisive.
//   400,000 rows: ~1.55GB peak RSS (74% of budget), ~7.4s real-browser
//   500,000 rows: ~1.90GB peak RSS (90% of budget) -- real but thin margin
// 400,000 rows is kept for real margin (26% of the memory budget still
// free) rather than the 500K tier's thin ~10%.
export const MAX_ROWS = 400000;

// Mobile/tablet file cap. Same reasoning as the rest of the family: keep
// clear margin under a conservative ~500MB budget for a 1-2GB-RAM
// entry-level Android phone.
//   65,000 rows: ~404MB peak RSS (81% of a 500MB budget)
//   75,000 rows: ~424MB peak RSS (85%, thinner margin)
export const MOBILE_MAX_ROWS = 65000;

// Pasted text gets its own, lower cap distinct from the file cap, on both
// desktop and mobile -- same reasoning as csv-to-json: a paste lives in
// React state and is re-rendered into a controlled <textarea> on the main
// thread, a DOM cost Node can't measure. Reusing the already-conservative
// mobile file tier keeps that unmeasured cost bounded on every device.
export const PASTE_MAX_ROWS = MOBILE_MAX_ROWS;
