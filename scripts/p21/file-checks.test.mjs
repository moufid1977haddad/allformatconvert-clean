// P21 (02/10): the robustness guards never refuse a good data file (UTF-8 with or without BOM, UTF-16 LE/BE with or
// without BOM, Windows-1252, Shift_JIS, TSV), and do refuse empty / binary / other-format files.
import assert from 'node:assert/strict';
import { textFileProblem, spreadsheetProblem, pdfFileProblem } from '../../app/lib/fileChecks.js';
const f = (bytes, name) => new File([bytes], name);
const csv = 'id;name;price\n1;Élodie;12,5\n2;Zoë;7\n';
const enc16 = (s, le) => { const b = Buffer.alloc(s.length * 2); for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (le) b.writeUInt16LE(c, i * 2); else b.writeUInt16BE(c, i * 2); } return b; };
const good = {
  'utf8.csv': Buffer.from(csv), 'bom.csv': Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(csv)]),
  'u16le-bom.csv': Buffer.concat([Buffer.from([0xff, 0xfe]), enc16(csv, true)]), 'u16be-bom.csv': Buffer.concat([Buffer.from([0xfe, 0xff]), enc16(csv, false)]),
  'u16le.csv': enc16(csv, true), 'cp1252.csv': Buffer.from(csv, 'latin1'), 'sjis.csv': Buffer.from([0x93, 0xfa, 0x96, 0x7b, 0x2c, 0x31, 0x0a]), 'tab.tsv': Buffer.from('a\tb\n1\t2\n'),
};
for (const [n, b] of Object.entries(good)) assert.equal(await textFileProblem(f(b, n)), null, n);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
for (const [n, b] of Object.entries({ 'empty.csv': Buffer.alloc(0), 'png.csv': png, 'rand.csv': Buffer.from(Array.from({ length: 512 }, (_, i) => (i * 2654435761 >>> 13) & 255)) })) assert.ok(await textFileProblem(f(b, n)), n);
assert.equal(await spreadsheetProblem(f(Buffer.from([0x50, 0x4b, 3, 4, 0, 0]), 'a.xlsx')), null);
assert.equal(await spreadsheetProblem(f(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1]), 'a.xls')), null);
assert.equal(await spreadsheetProblem(f(Buffer.from(csv), 'a.csv'), { allowCsv: true }), null);
assert.ok(await spreadsheetProblem(f(png, 'a.xlsx')));
assert.ok(await spreadsheetProblem(f(Buffer.alloc(0), 'a.xlsx')));
assert.equal(await pdfFileProblem(f(Buffer.concat([Buffer.from('junk\n'), Buffer.from('%PDF-1.7\n')]), 'a.pdf')), null);
assert.ok(await pdfFileProblem(f(png, 'a.pdf')));
console.log('file-checks: all passed');
// review 02/10: a CSV starting "BMW" / "BMI" is text, not a BMP; ".xls" files that are HTML / XML / tab text are let
// through to the spreadsheet reader
{
  const { textFileProblem: t, spreadsheetProblem: s } = await import('../../app/lib/fileChecks.js');
  assert.equal(await t(new File([Buffer.from('BMW,Série 3,2019\nAudi,A4,2020\n')], 'cars.csv')), null);
  assert.equal(await t(new File([Buffer.from('BMI,age\n22.5,40\n')], 'bmi.csv')), null);
  assert.equal(await s(new File([Buffer.from('<html><table><tr><td>1</td></tr></table></html>')], 'export.xls')), null);
  assert.equal(await s(new File([Buffer.from('<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"></Workbook>')], 'export.xls')), null);
  assert.equal(await s(new File([Buffer.from('a\tb\n1\t2\n')], 'export.xls')), null);
  console.log('file-checks (review cases): all passed');
}
// PDF with a user password: said at selection; an ordinary PDF passes
{
  const fs = await import('node:fs');
  const { pdfLockedProblem } = await import('../../app/lib/fileChecks.js');
  const locked = fs.readFileSync(new URL('../converter-tests/fixtures/encrypted-user-password.pdf', import.meta.url));
  assert.match(await pdfLockedProblem(new File([locked], 'l.pdf')) || '', /needs a password/);
  const { PDFDocument } = await import('pdf-lib');
  const d = await PDFDocument.create(); d.addPage();
  assert.equal(await pdfLockedProblem(new File([await d.save()], 'ok.pdf')), null);
  console.log('file-checks (locked PDF): all passed');
}
