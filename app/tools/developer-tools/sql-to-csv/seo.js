// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object. 29/09 (croissance-29-09, point 4): the page ranked first for
// "sql to csv" (CodeShack) reads multi-row INSERTs and escaped quotes; ours kept only the first row of a multi-row
// INSERT and split MySQL's \' — both fixed the same day (sqlToCsv.js, scripts/sql-to-csv-tests/), before this page
// was put forward.
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "SQL to CSV",
  path: "/tools/developer-tools/sql-to-csv",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "A mysqldump-style INSERT with three rows, an escaped quote and a NULL, and the CSV the tool returns:",
    inputLabel: "SQL",
    input: "INSERT INTO `users` (`id`, `name`, `city`) VALUES\n(1, 'Ann', 'Paris'),\n(2, 'O\\'Brien', NULL),\n(3, 'Smith, John', 'Lyon');",
    outputLabel: "CSV",
    output: "id,name,city\n1,Ann,Paris\n2,O'Brien,\n3,\"Smith, John\",Lyon",
  },
  related: [
    { href: "/tools/developer-tools/csv-to-sql", label: "CSV to SQL", note: "the other way: CREATE TABLE and INSERT statements from a CSV." },
    { href: "/tools/developer-tools/sql-formatter", label: "SQL Formatter", note: "put each SQL keyword and column on its own line." },
    { href: "/tools/developer-tools/csv-to-excel", label: "CSV to Excel", note: "open the resulting CSV as an .xlsx workbook." },
  ],
};
