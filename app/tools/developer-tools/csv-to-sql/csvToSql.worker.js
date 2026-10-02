import { IncrementalCsvParser } from '../../../lib/csvParser';
import { detectDecimalSeparator, numericColumns, parseLocaleNumber } from '../../../lib/csvEncoding';
import { MAX_ROWS } from './config';

// Standard SQL string-literal escaping: a single quote inside a value must be
// doubled, otherwise it closes the literal early and corrupts (or injects
// into) the surrounding statement.
// P24 review (03/10): the SQL of the chosen database (convertcsv.com offers the same choice). Before: identifiers were
// never quoted ("First Name" or "order" gave invalid SQL), a backslash was not escaped for MySQL ('C:\temp\new' stored
// wrong, 'abc\' broke the statement), VARCHAR(255) truncated longer text in non-strict MySQL, INTEGER overflowed past
// 2^31, DECIMAL(18,6) rounded 0.1234567, and every number went through a double: a 20-digit id lost its last digits.
const DIALECTS = {
  standard: { q: (s) => '"' + s.replace(/"/g, '""') + '"', str: (v) => "'" + v.replace(/'/g, "''") + "'", text: 'TEXT', varcharMax: 10485760, float: 'DOUBLE PRECISION' },
  mysql: { q: (s) => '`' + s.replace(/`/g, '``') + '`', str: (v) => "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'", text: 'LONGTEXT', varcharMax: 16383, float: 'DOUBLE' },
  sqlserver: { q: (s) => '[' + s.replace(/]/g, ']]') + ']', str: (v) => "N'" + v.replace(/'/g, "''") + "'", text: 'NVARCHAR(MAX)', varcharMax: 4000, float: 'FLOAT', varchar: 'NVARCHAR' },
};
// the number exactly as written (separators removed), never through a double
const numberText = (t, decimalSep) => {
  const s = (decimalSep === ',' ? t.replace(/[\s.\u00a0\u202f']/g, '').replace(',', '.') : t.replace(/[\s,\u00a0\u202f']/g, '')).replace(/^\+/, '');
  return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(s) ? s : null;
};

class RowLimitExceededError extends Error {
  constructor(limit) {
    super(`This CSV has more than ${limit.toLocaleString()} rows, counting the header row.`);
    this.name = 'RowLimitExceededError';
    this.limit = limit;
  }
}

async function run({ file, text, maxRows, mode, tableName, delimiter, encoding, typeNumbers = true, dialect = 'standard' }) {
  const D = DIALECTS[dialect] || DIALECTS.standard;
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
  const table = tableName || 'my_table';
  const headers = rows[0].map((h) => h.trim());
  const dataRows = rows.slice(1).map((r) => r.map((v) => v.trim()));
  // Numeric columns (ConvertCSV's CSV-to-SQL infers them too): INTEGER or DECIMAL,
  // values written with a '.' whatever the file's decimal separator ("12,5" -> 12.5).
  const decimalSep = detectDecimalSeparator(dataRows, delimiter || ',');
  const numeric = typeNumbers ? numericColumns([headers, ...dataRows], decimalSep) : [];
  const texts = headers.map((_, i) => (numeric[i] ? dataRows.map((r) => (r[i] ? numberText(r[i], decimalSep) : null)) : null));
  // a column is numeric only if every value reads exactly as a number
  headers.forEach((_, i) => { if (numeric[i] && texts[i].some((t, r) => dataRows[r][i] && t === null)) numeric[i] = false; });
  const colType = (i) => {
    if (numeric[i]) {
      const vals = texts[i].filter(Boolean);
      if (vals.some((t) => /[eE]/.test(t))) return D.float;
      const scale = Math.max(0, ...vals.map((t) => (t.split('.')[1] || '').length));
      const intDigits = Math.max(1, ...vals.map((t) => t.replace('-', '').split('.')[0].replace(/^0+(?=\d)/, '').length));
      if (!scale) return intDigits <= 9 ? 'INTEGER' : intDigits <= 18 ? 'BIGINT' : `DECIMAL(${Math.min(38, intDigits)}, 0)`;
      return intDigits + scale <= 38 ? `DECIMAL(${intDigits + scale}, ${scale})` : D.float;
    }
    const longest = Math.max(1, ...dataRows.map((r) => [...(r[i] ?? '')].length));
    return longest <= D.varcharMax ? `${D.varchar || 'VARCHAR'}(${longest})` : D.text;
  };
  const sqlValue = (v, i) => {
    if (numeric[i]) return v === '' || v === undefined ? 'NULL' : numberText(v, decimalSep);
    return D.str(v ?? '');
  };
  const t = D.q(table), cols = headers.map((h) => D.q(h)).join(', ');
  const create = 'CREATE TABLE ' + t + ' (\n' + headers.map((h, i) => '  ' + D.q(h) + ' ' + colType(i)).join(',\n') + '\n);\n\n';
  const inserts = dataRows.map((row) => 'INSERT INTO ' + t + ' (' + cols + ') VALUES (' + headers.map((_, i) => sqlValue(row[i], i)).join(', ') + ');').join('\n');
  const sqlText = create + inserts;

  self.postMessage({ type: 'progress', pct: 97, phase: 'building' });

  if (mode === 'file') {
    const blob = new Blob([sqlText], { type: 'application/sql' });
    self.postMessage({ type: 'done', mode, blob, rowCount: dataRows.length, decimalSep, numericCount: numeric.filter(Boolean).length });
  } else {
    self.postMessage({ type: 'done', mode, sql: sqlText, rowCount: dataRows.length, decimalSep, numericCount: numeric.filter(Boolean).length });
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
