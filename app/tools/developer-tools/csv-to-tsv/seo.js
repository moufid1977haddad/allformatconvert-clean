// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the pages ranked first for "csv to tsv" are small converters
// (paste or file); ours also reads Excel's semicolon exports and their encoding.
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "CSV to TSV",
  path: "/tools/developer-tools/csv-to-tsv",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "A semicolon CSV with a quoted note on two lines, and the TSV the tool returns (tabs shown as →):",
    inputLabel: "CSV",
    input: "Name;Price;Note\n\"Smith; John\";12,5;\"line one\nline two\"",
    outputLabel: "TSV",
    output: "Name→Price→Note\nSmith; John→12,5→\"line one\nline two\"",
  },
  related: [
    { href: "/tools/developer-tools/tsv-to-csv", label: "TSV to CSV", note: "the other way: tabs back to commas." },
    { href: "/tools/developer-tools/csv-to-excel", label: "CSV to Excel", note: "an .xlsx or .xls workbook from the same CSV." },
    { href: "/tools/developer-tools/csv-to-json", label: "CSV to JSON", note: "the same CSV as an array of JSON objects." },
    { href: "/tools/developer-tools/excel-to-csv", label: "Excel to CSV", note: "every sheet of an .xlsx, .xls or .ods file as CSV." },
  ],
};
