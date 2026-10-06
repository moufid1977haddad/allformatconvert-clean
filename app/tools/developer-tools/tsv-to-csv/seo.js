// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the page ranked first for "tsv to csv" (Online CSV Tools) is a
// paste-in converter like ours; both quote values that contain a comma.
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "TSV to CSV",
  path: "/tools/developer-tools/tsv-to-csv",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "Three tab-separated lines (tabs shown as →), one value with a comma, one with a quote mark and one quoted over two lines, and the CSV the tool returns:",
    inputLabel: "TSV",
    input: "name→city→note\nSmith, John→Paris→5\" screen\nAnn→Lyon→\"two\nlines\"",
    outputLabel: "CSV",
    output: "name,city,note\r\n\"Smith, John\",Paris,\"5\"\" screen\"\r\nAnn,Lyon,\"two\nlines\"",
  },
  related: [
    { href: "/tools/developer-tools/csv-to-tsv", label: "CSV to TSV", note: "the other way, with delimiter and encoding detection." },
    { href: "/tools/developer-tools/csv-to-json", label: "CSV to JSON", note: "turn the CSV into a JSON array of objects." },
    { href: "/tools/developer-tools/csv-to-excel", label: "CSV to Excel", note: "an .xlsx or .xls workbook." },
  ],
};
