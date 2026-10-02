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

async function run({ file, text, maxRows, mode, delimiter, encoding, typeNumbers = true, shape = 'objects' }) {
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
  // P24 review (03/10): two columns with the same header made one key — the first column's values were lost
  // ({"name":"B"} from name,name / A,B); a header left empty, or values beyond the last header, were dropped. Every
  // column now keeps its values: name, name_2…; column_N for an empty or missing header; and the page says so.
  const notes = [];
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const seen = new Map();
  const headers = Array.from({ length: width }, (_, i) => {
    let h = (rows[0][i] ?? '').trim() || `column_${i + 1}`;
    if (seen.has(h)) { let k = seen.get(h) + 1; while (seen.has(`${h}_${k}`)) k++; seen.set(h, k); const n = `${h}_${k}`; notes.push(`"${h}" appears twice: the second column is "${n}"`); h = n; }
    seen.set(h, seen.get(h) || 1);
    return h;
  });
  if (width > rows[0].length) notes.push(`some rows have more values than the header row: the extra ones are in column_${rows[0].length + 1}${width > rows[0].length + 1 ? '…' : ''}`);
  // Numbers as numbers (csvjson.com's "parse numbers", on by default), read with
  // the file's own decimal separator: "12,5" in a ';' export is 12.5. Only whole
  // columns of numbers; identifiers with a leading zero stay text.
  const decimalSep = detectDecimalSeparator(rows.slice(1), delimiter || ',');
  const numeric = typeNumbers ? numericColumns(rows, decimalSep) : [];
  const cell = (v, i) => { const t = (v ?? '').trim(); if (!numeric[i] || t === '') return t; return parseLocaleNumber(t, decimalSep); };
  // P24 (03/10): the shapes convertcsv.com offers — objects (default), arrays (header row first), JSON Lines (one
  // object per line, for logs and big-data tools)
  const asObject = (vals) => Object.fromEntries(headers.map((h, i) => [h, cell(vals[i], i)]));
  const data = rows.slice(1);
  const jsonText = shape === 'arrays' ? JSON.stringify([headers, ...data.map((vals) => headers.map((_, i) => cell(vals[i], i)))], null, 2)
    : shape === 'jsonl' ? data.map((vals) => JSON.stringify(asObject(vals))).join('\n')
    : JSON.stringify(data.map(asObject), null, 2);

  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });

  if (mode === 'file') {
    const blob = new Blob([jsonText], { type: 'application/json' });
    self.postMessage({ type: 'done', mode, blob, rowCount: rows.length, decimalSep, numericCount: numeric.filter(Boolean).length, notes });
  } else {
    self.postMessage({ type: 'done', mode, json: jsonText, rowCount: rows.length, decimalSep, numericCount: numeric.filter(Boolean).length, notes });
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
