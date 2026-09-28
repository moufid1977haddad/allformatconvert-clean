export const faqs = [
          { q: "What's the difference between CSV and TSV?", a: "CSV separates values with commas (or semicolons in many European exports); TSV uses tabs. TSV can be more reliable for data that itself contains commas, since tabs rarely appear inside a value." },
          { q: "Does it read semicolon-separated files from Excel?", a: "Yes — the delimiter is detected from the file (comma, semicolon, tab or pipe), so a French or German Excel export with values like 12,5 keeps its columns and its decimal commas intact." },
          { q: "Why do accents show correctly from an Excel CSV?", a: "Excel's classic 'CSV' export uses your Windows code page (Windows-1252 in Western Europe), not UTF-8. The tool detects this from the file's bytes and decodes it accordingly; you can also pick the encoding yourself." },
          { q: "Is my data uploaded to a server?", a: "No, the conversion happens entirely in your browser." },
          { q: "Does it handle quoted fields?", a: "Yes — a field wrapped in double quotes is parsed as a single value, and in the TSV a value that contains a tab or a line break is written in quotes, so that Excel and LibreOffice read it back as one cell." }
        ];

// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the pages ranked first for "csv to tsv" are small converters
// (paste or file); ours also reads Excel's semicolon exports and their encoding.
export const SEO = {
  name: 'CSV to TSV',
  path: '/tools/developer-tools/csv-to-tsv',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'CSV to TSV Converter — Excel CSV, Semicolons & Encodings',
  description: 'Convert CSV to tab-separated TSV: comma, semicolon or pipe detected, Excel encodings read correctly, quoted fields kept whole. Paste or open a file up to 50 MB, download a .tsv — in your browser, nothing uploaded.',
  faqs,
  example: {
    caption: 'A semicolon CSV as Excel writes it in Europe, and the TSV the tool returns (tabs shown as →):',
    inputLabel: 'CSV',
    input: 'Name;Price\n"Smith; John";12,5',
    outputLabel: 'TSV',
    output: 'Name→Price\nSmith; John→12,5',
  },
  related: [
    { href: '/tools/developer-tools/tsv-to-csv', label: 'TSV to CSV', note: 'the other way: tabs back to commas.' },
    { href: '/tools/developer-tools/csv-to-excel', label: 'CSV to Excel', note: 'an .xlsx or .xls workbook from the same CSV.' },
    { href: '/tools/developer-tools/csv-to-json', label: 'CSV to JSON', note: 'the same CSV as an array of JSON objects.' },
    { href: '/tools/developer-tools/excel-to-csv', label: 'Excel to CSV', note: 'every sheet of an .xlsx, .xls or .ods file as CSV.' },
  ],
};
