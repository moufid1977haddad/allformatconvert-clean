// JSON to CSV (29/09). Measured before: columns came only from the FIRST
// object (keys that appear later were dropped without a word), nested objects
// were written as the text "[object Object]", 12345678901234567890 became
// 12345678901234567000, an array of plain values produced empty lines and an
// empty array crashed with "Cannot convert undefined or null to object".
//
// Now, as ConvertCSV and json-csv.com do: every key seen in any row becomes a
// column (first-seen order), nested objects are flattened to dotted paths
// (address.city), arrays to indexed paths (tags.0, tags.1), and numbers are
// written exactly as in the JSON.
import { parseJsonLossless, LosslessNumber } from './jsonLossless.js';

function flatten(value, prefix, out) {
  if (value instanceof LosslessNumber || value === null || typeof value !== 'object') {
    out.set(prefix, value);
    return;
  }
  const keys = Array.isArray(value) ? value.map((_, i) => String(i)) : Object.keys(value);
  if (keys.length === 0) {
    if (prefix === '') return; // a row that is just {}
    // An empty {} or [] still gets its column, written as the JSON text.
    out.set(prefix, Array.isArray(value) ? '[]' : '{}');
    return;
  }
  for (const k of keys) flatten(value[k], prefix === '' ? k : `${prefix}.${k}`, out);
}

function field(v, delimiter) {
  if (v === undefined || v === null) return '';
  const s = v instanceof LosslessNumber ? v.source : String(v);
  if (s.includes(delimiter) || /["\r\n]/.test(s) || /^\s|\s$/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function jsonToCsv(text, { delimiter = ',', eol = '\n' } = {}) {
  const data = parseJsonLossless(text);
  let rows;
  if (Array.isArray(data)) rows = data;
  else if (data !== null && typeof data === 'object' && !(data instanceof LosslessNumber)) rows = [data];
  else throw new Error('The JSON must be an array of objects, or a single object.');
  if (rows.length === 0) throw new Error('The JSON array is empty: there is no row to convert.');

  const flatRows = rows.map((row) => {
    const m = new Map();
    // A plain value in the array (["a","b"] or [1,2]) becomes one "value" column.
    if (row === null || typeof row !== 'object' || row instanceof LosslessNumber) m.set('value', row);
    else flatten(row, '', m);
    return m;
  });
  const headers = [];
  const seen = new Set();
  for (const m of flatRows) for (const k of m.keys()) if (!seen.has(k)) { seen.add(k); headers.push(k); }
  const lines = [headers.map((h) => field(h, delimiter)).join(delimiter)];
  for (const m of flatRows) lines.push(headers.map((h) => field(m.get(h), delimiter)).join(delimiter));
  return lines.join(eol);
}
