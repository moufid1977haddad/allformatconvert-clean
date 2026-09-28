export const faqs = [
          { q: "What's the difference between TSV and CSV?", a: "TSV separates values with tabs; CSV uses commas. This tool converts the delimiter from tabs to commas." },
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload." },
          { q: "Is my data uploaded to a server?", a: "No, the conversion happens entirely in your browser." },
          { q: "Does it handle values that already contain a comma?", a: "Yes — any value containing a comma, quote, or newline is automatically wrapped in double quotes in the output, so it's read back as a single column rather than looking like an extra one." }
        ];

// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the page ranked first for "tsv to csv" (Online CSV Tools) is a
// paste-in converter like ours; both quote values that contain a comma.
export const SEO = {
  name: 'TSV to CSV',
  path: '/tools/developer-tools/tsv-to-csv',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'TSV to CSV Converter — Tab-Separated to Comma, Online Free',
  description: 'Convert tab-separated values (TSV) to CSV: paste the text, get comma-separated output with every value that contains a comma, quote or line break quoted correctly. Free, in your browser, nothing uploaded.',
  faqs: [
    ...faqs,
    { q: 'How do I get TSV out of a spreadsheet?', a: 'Select the cells in Excel, Google Sheets or LibreOffice and copy them: the clipboard holds them as tab-separated text, ready to paste here.' },
  ],
  example: {
    caption: 'Two tab-separated lines (tabs shown as →) and the CSV the tool returns — the value with a comma is quoted:',
    inputLabel: 'TSV',
    input: 'name→city\nSmith, John→Paris',
    outputLabel: 'CSV',
    output: 'name,city\n"Smith, John",Paris',
  },
  related: [
    { href: '/tools/developer-tools/csv-to-tsv', label: 'CSV to TSV', note: 'the other way, with delimiter and encoding detection.' },
    { href: '/tools/developer-tools/csv-to-json', label: 'CSV to JSON', note: 'turn the CSV into a JSON array of objects.' },
    { href: '/tools/developer-tools/csv-to-excel', label: 'CSV to Excel', note: 'an .xlsx or .xls workbook.' },
  ],
};
