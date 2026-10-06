// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object. 29/09 (croissance-29-09, point 4): written from the pages ranked
// first for "csv to json" (ConvertCSV, CSVJSON, TableConvert: file or paste, header row as keys, number typing,
// worked example). Corrected on the way: the metadata still said "parses pasted CSV text" while the tool reads files.
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "CSV to JSON",
  path: "/tools/developer-tools/csv-to-json",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "A pasted CSV and the JSON the tool returns (numbers typed; the leading zero of the postal code is kept):",
    inputLabel: "CSV",
    input: "id,name,zip\n1,Ann,02134\n2,\"Smith, John\",75001",
    outputLabel: "JSON",
    output: "[\n  {\n    \"id\": 1,\n    \"name\": \"Ann\",\n    \"zip\": \"02134\"\n  },\n  {\n    \"id\": 2,\n    \"name\": \"Smith, John\",\n    \"zip\": \"75001\"\n  }\n]",
  },
  related: [
    { href: "/tools/developer-tools/json-to-csv", label: "JSON to CSV", note: "the other way: a JSON array of objects back to CSV." },
    { href: "/tools/developer-tools/csv-to-excel", label: "CSV to Excel", note: "an .xlsx or .xls workbook from the same CSV." },
    { href: "/tools/developer-tools/csv-to-sql", label: "CSV to SQL", note: "CREATE TABLE and INSERT statements." },
    { href: "/tools/developer-tools/json-formatter", label: "JSON Formatter", note: "indent, validate and minify JSON." },
  ],
};
