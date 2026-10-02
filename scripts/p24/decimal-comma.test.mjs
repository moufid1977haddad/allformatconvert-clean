// P24 (03/10): Excel to CSV "Decimal comma" — only the number's own separators are swapped. Literals of the format
// ("kg.", a CPF mask) are kept; an ODS cell's text already in the file's language ("3,14", "1 234,50 €") is kept; long
// General numbers written in full keep their digits. The worker's functions are run as the worker runs them.
// Usage: node scripts/p24/decimal-comma.test.mjs
import fs from 'fs';
import XLSXmod from 'xlsx';
import { generalNumbersInFull } from '../../app/lib/sheetDates.js';
const XLSX = XLSXmod.default || XLSXmod;
const src = fs.readFileSync(new URL('../../app/tools/developer-tools/excel-to-csv/excelToCsv.worker.js', import.meta.url), 'utf8');
const decimalCommas = new Function('XLSX', src.slice(src.indexOf('const LIT_POINT'), src.indexOf('async function run(')) + '\nreturn decimalCommas;')(XLSX);
let fails = 0;
const check = (name, got, want) => { const ok = got === want; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${JSON.stringify(got)}${ok ? '' : ' (want ' + JSON.stringify(want) + ')'}`); };
for (const [v, z, want] of [
  [3.14, 'General', '3,14'], [1234.5, '#,##0.00', '1.234,50'], [0.125, '0.0%', '12,5%'], [1.5e10, '0.00E+00', '1,50E+10'],
  [1234.5, '"$"#,##0.00', '$1.234,50'], [-1234.5, '#,##0.00;(#,##0.00)', '(1.234,50)'], [1.5, '0.0 "kg."', '1,5 kg.'],
  [12345678909, '000"."000"."000"-"00', '123.456.789-09'], [1.5, '0.0\\.', '1,5.'],
]) { const ws = { '!ref': 'A1', A1: { t: 'n', v, z } }; decimalCommas(ws, XLSX); check(`format ${z}`, ws.A1.w, want); }
for (const [v, w] of [[3.14, '3,14'], [1234.5, '1 234,50 €'], [0.5, '50,00 %']]) { const ws = { '!ref': 'A1', A1: { t: 'n', v, w } }; decimalCommas(ws, XLSX); check(`localised ODS text ${w} kept`, ws.A1.w, w); }
const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([[123456789012.5, 3.14, 4006381333931, 0.1 + 0.2]]), 'S');
for (const type of ['xlsx', 'ods']) {
  const back = XLSX.read(XLSX.write(wb, { type: 'buffer', bookType: type }), { type: 'buffer' });
  const s = back.Sheets[back.SheetNames[0]];
  generalNumbersInFull(s, XLSX); decimalCommas(s, XLSX);
  check(`${type} round trip (long number, 3.14, EAN, 0.1+0.2)`, JSON.stringify([s.A1.w, s.B1.w, s.C1.w, s.D1.w]), JSON.stringify(['123456789012,5', '3,14', '4006381333931', type === 'ods' ? '0,30000000000000004' : '0,3']));
}
console.log(fails ? `decimal-comma: ${fails} FAILED` : 'decimal-comma: all passed');
process.exitCode = fails ? 1 : 0;
