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

async function run({ file, text, maxRows, mode, delimiter, encoding, typeNumbers = true }) {
  const limit = maxRows || MAX_ROWS;
  const rows = [];
  const parser = new IncrementalCsvParser((row) => {
    rows.push(row);
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
  if (rows.length === 0) throw new Error('Empty CSV');
  const headers = rows[0].map((h) => h.trim());
  // Numbers as numbers (csvjson.com's "parse numbers", on by default), read with
  // the file's own decimal separator: "12,5" in a ';' export is 12.5. Only whole
  // columns of numbers; identifiers with a leading zero stay text.
  const decimalSep = detectDecimalSeparator(rows.slice(1), delimiter || ',');
  const numeric = typeNumbers ? numericColumns(rows, decimalSep) : [];
  const cell = (v, i) => { const t = (v ?? '').trim(); if (!numeric[i] || t === '') return t; return parseLocaleNumber(t, decimalSep); };
  const result = rows.slice(1).map((vals) => Object.fromEntries(headers.map((h, i) => [h, cell(vals[i], i)])));
  const jsonText = JSON.stringify(result, null, 2);

  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });

  if (mode === 'file') {
    const blob = new Blob([jsonText], { type: 'application/json' });
    self.postMessage({ type: 'done', mode, blob, rowCount: rows.length, decimalSep, numericCount: numeric.filter(Boolean).length });
  } else {
    self.postMessage({ type: 'done', mode, json: jsonText, rowCount: rows.length, decimalSep, numericCount: numeric.filter(Boolean).length });
  }
}

self.onmessage = (e) => {
  run(e.data).catch((err) => {
    if (err instanceof RowLimitExceededError) {
      self.postMessage({ type: 'row_limit', limit: err.limit, mode: e.data.mode });
    } else {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  });
};
