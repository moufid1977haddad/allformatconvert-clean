// Excel to CSV / JSON (29/09) on fixtures/edge-cases.xlsx (built by
// make-excel-fixture.py with openpyxl). Oracle: the values written by openpyxl.
// Replays the exact read path of the two workers.
// Run: node scripts/converter-tests/08-excel.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { fixSupplementaryCharRefs } = await import(new URL('../../app/lib/xlsxSupplementaryChars.js', import.meta.url));
const { datesToText } = await import(new URL('../../app/lib/sheetDates.js', import.meta.url));
const bytes = new Uint8Array(readFileSync(new URL('./fixtures/edge-cases.xlsx', import.meta.url)));

let passed = 0;
const test = (name, fn) => { try { fn(); passed++; console.log('  PASS', name); } catch (e) { console.error('  FAIL', name, '\n', e.message); process.exitCode = 1; } };

test('before the fix the emoji is corrupted (U+F600) -- the defect is real', () => {
  const wb = XLSX.read(bytes, { type: 'array' });
  assert.equal(XLSX.utils.sheet_to_json(wb.Sheets.Data)[1].name, 'Zoé ');
});
test('supplementary character references are restored: emoji intact in CSV and JSON', () => {
  const { bytes: fixedBytes, fixed } = fixSupplementaryCharRefs(bytes);
  assert.equal(fixed, 1);
  const wb = XLSX.read(fixedBytes, { type: 'array' });
  assert.ok(XLSX.utils.sheet_to_csv(wb.Sheets.Data).includes('Zoé 😀'));
});
test('files without such references are passed through untouched', () => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a', '😀']]), 'S');
  const out = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
  const r = fixSupplementaryCharRefs(out);
  assert.equal(r.fixed, 0); assert.equal(r.bytes, out);
  const csvBytes = new TextEncoder().encode('a,b\n1,2');
  assert.equal(fixSupplementaryCharRefs(csvBytes).bytes, csvBytes);
});
test('JSON: dates as ISO text (not serial numbers), empty cells kept as null, zip codes intact', () => {
  const wb = XLSX.read(fixSupplementaryCharRefs(bytes).bytes, { type: 'array', cellNF: true });
  datesToText(wb.Sheets.Data, XLSX);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Data, { defval: null });
  assert.deepEqual(rows[0], { id: 1, name: 'Ann', date: '2024-01-15', zip: '01234', pct: 0.125, price: 1234.5, note: null, f: null });
  assert.deepEqual(rows[1], { id: 2, name: 'Zoé 😀', date: '2024-02-29T13:45:00', zip: '00012', pct: 1, price: 0.1, note: 'x, "y"', f: null });
});
test('CSV keeps what Excel displays (as Excel "Save as CSV" does)', () => {
  const wb = XLSX.read(fixSupplementaryCharRefs(bytes).bytes, { type: 'array' });
  assert.equal(XLSX.utils.sheet_to_csv(wb.Sheets.Data).split('\n')[1], '1,Ann,2024-01-15,01234,12.50%,"1,234.50",,');
});
console.log(`${passed} passed`);
