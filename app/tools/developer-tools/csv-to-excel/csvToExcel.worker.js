import { IncrementalCsvParser } from '../../../lib/csvParser';
import { detectDecimalSeparator, numericColumns, parseLocaleNumber } from '../../../lib/csvEncoding';
import { MAX_ROWS } from './config';

class RowLimitExceededError extends Error {
  constructor(limit) {
    super(`This CSV has more than ${limit.toLocaleString()} rows, counting the header row.`);
    this.name = 'RowLimitExceededError';
    this.limit = limit;
  }
}

const MIME_TYPES = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
};

async function run({ file, text, maxRows, bookType, delimiter, encoding, typeNumbers = true }) {
  const limit = maxRows || MAX_ROWS;
  const rows = [];
  const parser = new IncrementalCsvParser((row) => {
    rows.push(row);
    // Bail out as soon as the limit is crossed, mid-read, rather than
    // finishing the parse and risking the memory blowup that a huge row
    // count causes in the sheet-build/xlsx-write phase (measured: 2,000,000
    // rows crashes with an out-of-memory error; the row cap keeps this
    // tool well inside the range that reliably completes).
    if (rows.length > limit) throw new RowLimitExceededError(limit);
  }, delimiter || ',');

  if (file) {
    const total = file.size || 0;
    let read = 0;
    let lastReportedPct = -1;
    const reader = file.stream().pipeThrough(new TextDecoderStream(encoding || 'utf-8')).getReader();
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
  // Number cells, as Excel itself makes them when it opens the CSV: read with the
  // file's decimal separator ("12,5" in a ';' export = 12.5), whole columns only,
  // identifiers with a leading zero kept as text.
  const decimalSep = detectDecimalSeparator(rows.slice(1), delimiter || ',');
  const numeric = typeNumbers ? numericColumns(rows, decimalSep) : [];
  if (numeric.some(Boolean)) {
    for (let r = 1; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
      if (!numeric[c]) continue;
      const t = String(rows[r][c]).trim();
      if (t !== '') rows[r][c] = parseLocaleNumber(t, decimalSep);
    }
  }
  // P24 review (03/10): the limits of the formats, said before writing — a .xls of 65 537 rows was written and read back
  // with 2 rows, and a cell over 32 767 characters failed with SheetJS's raw message
  if (bookType === 'xls') {
    const cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    if (rows.length > 65536) throw new Error(`The old .xls format holds at most 65,536 rows; this CSV has ${rows.length.toLocaleString('en-US')}. Choose .xlsx (up to 1,048,576 rows).`);
    if (cols > 256) throw new Error(`The old .xls format holds at most 256 columns; this CSV has ${cols}. Choose .xlsx (up to 16,384 columns).`);
  }
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
    if (typeof rows[r][c] === 'string' && rows[r][c].length > 32767) throw new Error(`Row ${r + 1}, column ${c + 1} holds ${rows[r][c].length.toLocaleString('en-US')} characters; an Excel cell holds at most 32,767.`);
  }
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
  const type = bookType === 'xls' ? 'xls' : 'xlsx';
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: type });
  const blob = new Blob([buffer], { type: MIME_TYPES[type] });

  self.postMessage({ type: 'done', blob, rowCount: rows.length, bookType: type, decimalSep, numericCount: numeric.filter(Boolean).length });
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
