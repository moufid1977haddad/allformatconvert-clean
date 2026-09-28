// One source for this page's search content: the visible FAQ, example and links (page.jsx) and the metadata and
// structured data (layout.tsx) read the same object. 29/09 (croissance-29-09, point 4): the page ranked first for
// "sql to csv" (CodeShack) reads multi-row INSERTs and escaped quotes; ours kept only the first row of a multi-row
// INSERT and split MySQL's \' — both fixed the same day (sqlToCsv.js, scripts/sql-to-csv-tests/), before this page
// was put forward.
export const SEO = {
  name: 'SQL to CSV',
  path: '/tools/developer-tools/sql-to-csv',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'SQL to CSV Converter — INSERT Statements & mysqldump to CSV',
  description: 'Convert SQL INSERT statements to CSV: multi-row INSERTs, mysqldump output, quoted names and escaped quotes are read, commas inside values stay in one column. Free, in your browser, nothing uploaded.',
  faqs: [
    { q: 'Does it run my SQL against a database or convert SELECT query results?', a: "No — it doesn't execute any SQL. It reads the text of the INSERT INTO … VALUES (…) statements you paste in." },
    { q: 'Does it read multi-row INSERT statements, like the ones mysqldump writes?', a: 'Yes — every row of INSERT INTO t (a, b) VALUES (1, \'x\'), (2, \'y\'), … becomes a CSV row, across as many statements as you paste. Names in backticks, double quotes or brackets (`users`, "users", [users], schema.table) and INSERT IGNORE are read too.' },
    { q: 'What if the INSERT has no column list?', a: 'The header row is then column_1, column_2, … since the column names are not in the SQL.' },
    { q: 'How are quotes inside values handled?', a: "A doubled quote ('O''Brien', standard SQL) and a backslash-escaped quote ('O\\'Brien', MySQL) both come out as O'Brien. Other backslash sequences are kept as written, because MySQL and standard SQL read them differently." },
    { q: 'Does it handle values containing commas?', a: "Yes — a quoted SQL string like 'Smith, John' is parsed as a single value, and the resulting CSV field is quoted too if needed, so it stays as one column rather than splitting apart." },
    { q: 'What happens to NULL?', a: 'NULL is written as the word NULL in the CSV, so you can tell it apart from an empty string.' },
    { q: 'Can I customize the CSV delimiter?', a: 'No, output always uses commas — there is no option for semicolons, tabs, or pipes.' },
    { q: 'Is SQL to CSV free to use?', a: "Yes, it's completely free with no signup required, and the SQL never leaves your browser." },
  ],
  example: {
    caption: 'A mysqldump-style INSERT with three rows, and the CSV the tool returns:',
    inputLabel: 'SQL',
    input: "INSERT INTO `users` (`id`, `name`) VALUES\n(1, 'Ann'),\n(2, 'O\\'Brien'),\n(3, 'Smith, John');",
    outputLabel: 'CSV',
    output: 'id,name\n1,Ann\n2,O\'Brien\n3,"Smith, John"',
  },
  related: [
    { href: '/tools/developer-tools/csv-to-sql', label: 'CSV to SQL', note: 'the other way: CREATE TABLE and INSERT statements from a CSV.' },
    { href: '/tools/developer-tools/sql-formatter', label: 'SQL Formatter', note: 'put each SQL keyword and column on its own line.' },
    { href: '/tools/developer-tools/csv-to-excel', label: 'CSV to Excel', note: 'open the resulting CSV as an .xlsx workbook.' },
  ],
};
