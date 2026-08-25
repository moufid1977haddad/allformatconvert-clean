import { IncrementalCsvParser } from '../../../lib/csvParser';
import { MAX_ROWS } from './config';

// Standard SQL string-literal escaping: a single quote inside a value must be
// doubled, otherwise it closes the literal early and corrupts (or injects
// into) the surrounding statement.
const escapeSqlString = (v) => v.replace(/'/g, "''");

class RowLimitExceededError extends Error {
  constructor(limit) {
    super(`This CSV has more than ${limit.toLocaleString()} rows, counting the header row.`);
    this.name = 'RowLimitExceededError';
    this.limit = limit;
  }
}

async function run({ file, text, maxRows, mode, tableName }) {
  const limit = maxRows || MAX_ROWS;
  const rows = [];
  const parser = new IncrementalCsvParser((row) => {
    rows.push(row);
    if (rows.length > limit) throw new RowLimitExceededError(limit);
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
  if (rows.length === 0) throw new Error('Empty CSV');
  const table = tableName || 'my_table';
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).map((r) => r.map((v) => v.trim()));
  const create = 'CREATE TABLE ' + table + ' (\n' + headers.map((h) => '  ' + h + ' VARCHAR(255)').join(',\n') + '\n);\n\n';
  const inserts = dataRows.map((row) => 'INSERT INTO ' + table + ' (' + headers.join(', ') + ') VALUES (' + row.map((v) => "'" + escapeSqlString(v) + "'").join(', ') + ');').join('\n');
  const sqlText = create + inserts;

  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });

  if (mode === 'file') {
    const blob = new Blob([sqlText], { type: 'application/sql' });
    self.postMessage({ type: 'done', mode, blob, rowCount: dataRows.length });
  } else {
    self.postMessage({ type: 'done', mode, sql: sqlText, rowCount: dataRows.length });
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
