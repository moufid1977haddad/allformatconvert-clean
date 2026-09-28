import { MAX_ROWS, MOBILE_MAX_ROWS, PASTE_MAX_ROWS } from './config';

// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object. 29/09 (croissance-29-09, point 4): written from the pages ranked
// first for "csv to json" (ConvertCSV, CSVJSON, TableConvert: file or paste, header row as keys, number typing,
// worked example). Corrected on the way: the metadata still said "parses pasted CSV text" while the tool reads files.
const n = (v) => v.toLocaleString('en-US');

export const SEO = {
  name: 'CSV to JSON',
  path: '/tools/developer-tools/csv-to-json',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'CSV to JSON Converter — File or Paste, Numbers Typed, Free',
  description: 'Convert a CSV file or pasted CSV to a JSON array of objects: header row as keys, numbers as JSON numbers, delimiter and Excel encoding detected. Up to 500,000 rows, in your browser — nothing uploaded.',
  faqs: [
    { q: 'What does the JSON look like?', a: 'An array with one object per row, whose keys are the values of the first (header) row — for example [{"id": 1, "name": "Ann"}, …] — indented with two spaces.' },
    { q: 'Are numbers converted to JSON numbers?', a: 'Yes, when a whole column is numeric: 12 becomes 12 and a European decimal comma is read too (12,5 → 12.5). Values with a leading zero, such as phone numbers or postal codes, stay text so no digit is lost. You can turn this off to keep every value as a string.' },
    { q: 'Does it support file upload, or only pasted text?', a: 'Both — upload a .csv file, or paste CSV text directly into the box.' },
    { q: 'Is my data uploaded to a server?', a: 'No, conversion happens entirely in your browser, in a background Web Worker so the page never freezes.' },
    { q: 'Does it support delimiters other than commas, like semicolons or tabs?', a: "Yes — the delimiter (comma, semicolon, tab, or pipe) is auto-detected from the file, which matters for European CSVs that commonly use semicolons. A dropdown lets you override the detected delimiter if it's ever wrong." },
    { q: 'Why do accents come out right from an Excel CSV?', a: "Excel's classic \"CSV\" export is not UTF-8 but your Windows code page (Windows-1252 in Western Europe). The tool detects the encoding from the file's bytes and decodes it accordingly; you can also choose it yourself." },
    { q: 'Why is there a row limit?', a: `Converting a very large CSV in a browser tab risks running out of memory and crashing the tab rather than just being slow. Uploaded files support up to ${n(MAX_ROWS)} rows on desktop (${n(MOBILE_MAX_ROWS)} on phones/tablets); pasted text is capped lower, at ${n(PASTE_MAX_ROWS)} rows, since pasted text has to live in the page itself rather than being streamed in like a file. The count includes the header row.` },
    { q: 'Why is the pasted-text limit lower than the file-upload limit?', a: "A pasted CSV sits in the page's own memory and gets re-rendered into the input box on every change, on both desktop and mobile — an uploaded file is instead streamed straight into the background worker without that overhead, so it can safely handle far more rows." },
  ],
  example: {
    caption: 'A pasted CSV and the JSON the tool returns (numbers typed; the leading zero of the postal code is kept):',
    inputLabel: 'CSV',
    input: 'id,name,zip\n1,Ann,02134\n2,"Smith, John",75001',
    outputLabel: 'JSON',
    output: '[\n  {\n    "id": 1,\n    "name": "Ann",\n    "zip": "02134"\n  },\n  {\n    "id": 2,\n    "name": "Smith, John",\n    "zip": "75001"\n  }\n]',
  },
  related: [
    { href: '/tools/developer-tools/json-to-csv', label: 'JSON to CSV', note: 'the other way: a JSON array of objects back to CSV.' },
    { href: '/tools/developer-tools/csv-to-excel', label: 'CSV to Excel', note: 'an .xlsx or .xls workbook from the same CSV.' },
    { href: '/tools/developer-tools/csv-to-sql', label: 'CSV to SQL', note: 'CREATE TABLE and INSERT statements.' },
    { href: '/tools/developer-tools/json-formatter', label: 'JSON Formatter', note: 'indent, validate and minify JSON.' },
  ],
};
