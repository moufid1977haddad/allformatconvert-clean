import { IncrementalCsvParser } from '../../../lib/csvParser';
import { MAX_ROWS } from './config';

class RowLimitExceededError extends Error {
  constructor(limit) {
    super(`This CSV has more than ${limit.toLocaleString()} rows.`);
    this.name = 'RowLimitExceededError';
    this.limit = limit;
  }
}

async function run({ file, text }) {
  const rows = [];
  const parser = new IncrementalCsvParser((row) => {
    rows.push(row);
    // Bail out as soon as the limit is crossed, mid-read, rather than
    // finishing the parse and risking the memory blowup that a huge row
    // count causes in the sheet-build/xlsx-write phase (measured: 2,000,000
    // rows crashes with an out-of-memory error; the MAX_ROWS cap keeps this
    // tool well inside the range that reliably completes).
    if (rows.length > MAX_ROWS) throw new RowLimitExceededError(MAX_ROWS);
  });

  if (file) {
    const total = file.size || 0;
    let read = 0;
    let lastReportedPct = -1;
    const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      parser.push(value);
      read += value.length;
      if (total > 0) {
        const pct = Math.min(85, Math.floor((read / total) * 85));
        if (pct !== lastReportedPct) {
          lastReportedPct = pct;
          self.postMessage({ type: 'progress', pct, phase: 'reading' });
        }
      }
    }
  } else {
    parser.push(text || '');
    self.postMessage({ type: 'progress', pct: 85, phase: 'reading' });
  }
  parser.finish();

  self.postMessage({ type: 'progress', pct: 90, phase: 'building' });
  const xlsxModule = await import('xlsx');
  const XLSX = xlsxModule.default || xlsxModule;
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });
  // type: 'array' crashes SheetJS's internal zip-building step ("Invalid
  // array length" inside write_zip_denouement/a2s) once the output reaches
  // roughly this size -- it hits a JS engine argument-count limit in an
  // array-to-string conversion. type: 'buffer' takes a different code path
  // that avoids it, but its result isn't a plain Transferable, so the Blob
  // is built here (in the worker) and cloned as a Blob instead -- browsers
  // clone Blobs efficiently without needing an explicit transfer list.
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  self.postMessage({ type: 'done', blob, rowCount: rows.length });
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    if (err instanceof RowLimitExceededError) {
      self.postMessage({ type: 'row_limit', limit: err.limit });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
