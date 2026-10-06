// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object, so they can never disagree. 29/09 (croissance-29-09, point 4):
// written from the queries people type (Google suggestions: "csv to sql insert", "csv to sql table", "converter") and
// the pages ranked first (TableConvert, CodeShack, ConvertCSV: CREATE TABLE + INSERT, type inference, dialects,
// worked example). Corrected on the way: an answer said every column was VARCHAR(255) while the tool types whole
// numeric columns as INTEGER or DECIMAL (csvToSql.worker.js) — the page contradicted itself.
// P34 (05/10): the example, two answers and a tip still described the types and the unquoted names of before the
// P24 review (03/10: identifiers quoted per database, VARCHAR / DECIMAL sized to the data) — the example's output was
// not what the tool gives (scripts/browser-tests/seo-pages-29-09.mjs). Rewritten from csvToSql.worker.js.
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "CSV to SQL",
  path: "/tools/developer-tools/csv-to-sql",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "A small CSV pasted with the default table name, and the SQL the tool returns:",
    inputLabel: "CSV",
    input: "id,name,price\n1,Ann,12.5\n2,O'Brien,8",
    outputLabel: "SQL",
    output: "CREATE TABLE \"my_table\" (\n  \"id\" INTEGER,\n  \"name\" VARCHAR(7),\n  \"price\" DECIMAL(3, 1)\n);\n\nINSERT INTO \"my_table\" (\"id\", \"name\", \"price\") VALUES (1, 'Ann', 12.5);\nINSERT INTO \"my_table\" (\"id\", \"name\", \"price\") VALUES (2, 'O''Brien', 8);",
  },
  related: [
    { href: "/tools/developer-tools/sql-to-csv", label: "SQL to CSV", note: "the other way: INSERT statements back to CSV rows." },
    { href: "/tools/developer-tools/csv-to-json", label: "CSV to JSON", note: "the same CSV as an array of JSON objects." },
    { href: "/tools/developer-tools/csv-to-excel", label: "CSV to Excel", note: "an .xlsx workbook with real number cells." },
    { href: "/tools/developer-tools/sql-formatter", label: "SQL Formatter", note: "put each SQL keyword and column on its own line." },
  ],
};
