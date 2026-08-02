'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Standard SQL string-literal escaping: a single quote inside a value must be
// doubled, otherwise it closes the literal early and corrupts (or injects into)
// the surrounding statement.
const escapeSqlString = (v) => v.replace(/'/g, "''");

// RFC 4180-style CSV parser: splitting on plain commas/newlines breaks the
// moment a quoted field contains one of those characters (e.g. "Smith, John")
// — the field gets sliced apart into extra columns instead of staying intact.
// This tracks quote state so commas and newlines inside a quoted field are
// treated as literal data, and a doubled "" inside a quoted field is
// unescaped to a single ".
function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ',') { row.push(field); field = ''; i++; continue; }
    if (c === '\r') { i++; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
    field += c; i++;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

export default function CsvToSqlPage() {
  const [input, setInput] = useState('');
  const [tableName, setTableName] = useState('my_table');
  const [output, setOutput] = useState('');
  const convert = () => {
    const parsed = parseCsvRows(input.trim());
    const headers = (parsed[0] || []).map(h => h.trim());
    const rows = parsed.slice(1).map(r => r.map(v => v.trim()));
    const create = 'CREATE TABLE ' + tableName + ' (\n' + headers.map(h => '  ' + h + ' VARCHAR(255)').join(',\n') + '\n);\n\n';
    const inserts = rows.map(row => 'INSERT INTO ' + tableName + ' (' + headers.join(', ') + ') VALUES (' + row.map(v => "'" + escapeSqlString(v) + "'").join(', ') + ');').join('\n');
    setOutput(create + inserts);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to SQL</h1>
        <p className="text-neutral-500 text-center mb-8">Generate SQL INSERT statements from CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Table Name</label><input type="text" value={tableName} onChange={e => setTableName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="name,age,city..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">SQL Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="CSV to SQL"
        description="CSV to SQL generates a CREATE TABLE statement and one INSERT statement per row from pasted CSV text, entirely in your browser — nothing is uploaded to a server. CSV parsing is quote-aware: a field wrapped in double quotes can safely contain a comma (like 'Smith, John') without being split into extra values. Values are also escaped for SQL string literals (a quote inside a value is doubled, the standard SQL escaping), so data like an apostrophe in a name no longer breaks or corrupts the generated statements. Column and table names typed into the Table Name field are not escaped, so avoid spaces or SQL reserved words there."
        howTo={[
          "Type your table name, or keep the default.",
          "Paste your CSV text into the input box, with a header row as the first line.",
          "Click 'Convert' to generate a CREATE TABLE statement plus one INSERT per row.",
          "Click 'Copy' to copy the SQL to your clipboard."
        ]}
        faqs={[
          { q: "Is CSV to SQL free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Are values safely escaped in the generated SQL?", a: "Yes — quotes inside values are doubled following standard SQL string escaping, so values containing an apostrophe (like a name such as O'Brien) produce valid, safe SQL rather than broken or exploitable statements." },
          { q: "What data types does the CREATE TABLE statement use?", a: "Every column is created as VARCHAR(255), regardless of whether the CSV data looks numeric, a date, or text — edit the generated statement if you need different types." },
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload, and no delimiter other than commas (a comma inside a properly double-quoted field is treated as data, not a delimiter)." }
        ]}
        tips={[
          "Values are escaped for SQL, but the table name and column headers are inserted as-is — avoid spaces, quotes, or reserved SQL keywords in the Table Name field or your CSV header row.",
          "Every column defaults to VARCHAR(255); adjust the CREATE TABLE statement afterward if you need numeric, date, or other column types.",
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and stay as a single value.",
          "Always review generated SQL — and test it on a development database — before running it against production."
        ]}
      />
    </div>
  );
}