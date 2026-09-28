import { MAX_ROWS, MOBILE_MAX_ROWS, PASTE_MAX_ROWS } from './config';

// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object, so they can never disagree. 29/09 (croissance-29-09, point 4):
// written from the queries people type (Google suggestions: "csv to sql insert", "csv to sql table", "converter") and
// the pages ranked first (TableConvert, CodeShack, ConvertCSV: CREATE TABLE + INSERT, type inference, dialects,
// worked example). Corrected on the way: an answer said every column was VARCHAR(255) while the tool types whole
// numeric columns as INTEGER or DECIMAL (csvToSql.worker.js) — the page contradicted itself.
const n = (v) => v.toLocaleString('en-US');

export const SEO = {
  name: 'CSV to SQL',
  path: '/tools/developer-tools/csv-to-sql',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'CSV to SQL Converter — CREATE TABLE & INSERT Statements',
  description: 'Convert a CSV file to SQL: a CREATE TABLE with INTEGER, DECIMAL or VARCHAR columns and one INSERT per row. Delimiter and Excel encoding detected, values escaped. Runs in your browser, nothing uploaded.',
  faqs: [
    { q: 'Is CSV to SQL free to use?', a: "Yes, it's completely free with no signup required." },
    { q: 'What data types does the CREATE TABLE statement use?', a: 'A column whose every value is a whole number becomes INTEGER; a column of numbers with decimals becomes DECIMAL(18,6), written with a dot even when the file uses decimal commas (12,5 → 12.5); every other column is VARCHAR(255). Numbers with a leading zero, such as phone numbers or postal codes, stay text. Untick "Numeric columns as INTEGER / DECIMAL" to get VARCHAR(255) everywhere.' },
    { q: 'Which databases can run the generated SQL?', a: 'The output is plain standard SQL — CREATE TABLE with INTEGER, DECIMAL and VARCHAR, and INSERT INTO … VALUES with single-quoted strings — which MySQL, MariaDB, PostgreSQL, SQLite and SQL Server all accept. Table and column names are written as they are, without quotes, so keep them free of spaces and reserved words.' },
    { q: 'Are values safely escaped in the generated SQL?', a: "Yes — quotes inside values are doubled following standard SQL string escaping, so values containing an apostrophe (like a name such as O'Brien) produce valid, safe SQL rather than broken or exploitable statements." },
    { q: 'What happens to empty cells?', a: 'An empty cell in a numeric column becomes NULL; in a text column it becomes an empty string (\'\').' },
    { q: 'Does it support file upload, or only pasted text?', a: 'Both — upload a .csv file, or paste CSV text directly into the box.' },
    { q: 'Does it support semicolon- or tab-delimited files, not just commas?', a: "Yes — the delimiter (comma, semicolon, tab, or pipe) is auto-detected from the file, which matters for European CSVs that commonly use semicolons. A dropdown lets you override the detected delimiter if it's ever wrong." },
    { q: 'Why do accents come out right from an Excel CSV?', a: "Excel's classic \"CSV\" export is not UTF-8 but your Windows code page (Windows-1252 in Western Europe). The tool detects the encoding from the file's bytes and decodes it accordingly; you can also choose it yourself." },
    { q: 'Why is there a row limit, and why is it lower for pasted text?', a: `Converting a very large CSV in a browser tab risks running out of memory and crashing the tab. Uploaded files support up to ${n(MAX_ROWS)} rows on desktop (${n(MOBILE_MAX_ROWS)} on phones/tablets); pasted text is capped lower, at ${n(PASTE_MAX_ROWS)} rows on any device, since pasted text has to live in the page itself and be re-rendered into the input box, rather than being streamed in like a file. The count includes the header row.` },
  ],
  example: {
    caption: 'A small CSV pasted with the default table name, and the SQL the tool returns:',
    inputLabel: 'CSV',
    input: "id,name,price\n1,Ann,12.5\n2,O'Brien,8",
    outputLabel: 'SQL',
    output: "CREATE TABLE my_table (\n  id INTEGER,\n  name VARCHAR(255),\n  price DECIMAL(18,6)\n);\n\nINSERT INTO my_table (id, name, price) VALUES (1, 'Ann', 12.5);\nINSERT INTO my_table (id, name, price) VALUES (2, 'O''Brien', 8);",
  },
  related: [
    { href: '/tools/developer-tools/sql-to-csv', label: 'SQL to CSV', note: 'the other way: INSERT statements back to CSV rows.' },
    { href: '/tools/developer-tools/csv-to-json', label: 'CSV to JSON', note: 'the same CSV as an array of JSON objects.' },
    { href: '/tools/developer-tools/csv-to-excel', label: 'CSV to Excel', note: 'an .xlsx workbook with real number cells.' },
    { href: '/tools/developer-tools/sql-formatter', label: 'SQL Formatter', note: 'put each SQL keyword and column on its own line.' },
  ],
};
