// Same underlying cost as excel-to-csv (XLSX.read is the dominant,
// CPU-bound, non-incremental step regardless of output format) -- see that
// tool's config.js for the full measurement writeup. Re-confirmed directly
// for the JSON output path in Node (XLSX.read + sheet_to_json across every
// sheet):
//   100,000 rows (48.9MB): ~5.1s Node / ~7.9s real-browser, 567MB peak RSS
//   150,000 rows (74.1MB): ~7.4s Node / ~11.5s real-browser, 841MB peak RSS
//   200,000 rows (99.4MB): ~10.3s Node / ~16.0s real-browser -- over budget
// Same decision and same caps as excel-to-csv.
export const MAX_ROWS = 150000;
export const MAX_FILE_SIZE_BYTES = 90 * 1024 * 1024; // 90 MB
export const MAX_FILE_SIZE_LABEL = '90 MB';

export const MOBILE_MAX_ROWS = 50000;
export const MOBILE_MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30 MB
export const MOBILE_MAX_FILE_SIZE_LABEL = '30 MB';
