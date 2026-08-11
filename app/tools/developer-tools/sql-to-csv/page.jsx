'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// RFC 4180-style CSV field writer: a value that itself contains a comma,
// double quote, or newline is indistinguishable from a delimiter unless it's
// wrapped in double quotes (with any internal quote doubled).
function csvField(v) {
  const s = String(v ?? '');
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Parses a SQL "(a, b, c)" list starting at the '(' at `input[start]`,
// respecting single-quoted string literals (where '' is an escaped quote) so
// a literal ',' or ')' inside a quoted value — e.g. VALUES ('Smith (Jr), II')
// — isn't mistaken for the list's own delimiter or closing paren. A plain
// `[^)]+` regex capture can't tell the difference, so it truncates or
// mis-splits the moment a value contains either character.
function parseSqlParenList(input, start) {
  let i = start + 1;
  const n = input.length;
  const items = [];
  let item = '';
  let inString = false;
  while (i < n) {
    const c = input[i];
    if (inString) {
      if (c === "'") {
        if (input[i + 1] === "'") { item += "''"; i += 2; continue; }
        inString = false; item += c; i++; continue;
      }
      item += c; i++; continue;
    }
    if (c === "'") { inString = true; item += c; i++; continue; }
    if (c === ',') { items.push(item.trim()); item = ''; i++; continue; }
    if (c === ')') { items.push(item.trim()); return { items, end: i + 1 }; }
    item += c; i++;
  }
  items.push(item.trim());
  return { items, end: n };
}

// Strips the surrounding quotes from a single SQL value (leaving numeric/NULL
// values as-is) and unescapes a doubled '' back to a literal single quote.
function unquoteSqlValue(v) {
  const t = v.trim();
  if (t.length >= 2 && t[0] === "'" && t[t.length - 1] === "'") {
    return t.slice(1, -1).replace(/''/g, "'");
  }
  return t;
}

export default function SqlToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const rows = [];
      let headers = null;
      const insertRe = /INSERT INTO (\w+)\s*\(/gi;
      let match;
      while ((match = insertRe.exec(input)) !== null) {
        const colListStart = match.index + match[0].length - 1;
        const cols = parseSqlParenList(input, colListStart);
        const afterCols = input.slice(cols.end);
        const valuesMatch = /^\s*VALUES\s*\(/i.exec(afterCols);
        if (!valuesMatch) continue;
        const valuesStart = cols.end + valuesMatch[0].length - 1;
        const vals = parseSqlParenList(input, valuesStart);
        if (!headers) { headers = cols.items.map(h => h.trim()); rows.push(headers.map(csvField).join(',')); }
        rows.push(vals.items.map(unquoteSqlValue).map(csvField).join(','));
        insertRe.lastIndex = vals.end;
      }
      if (rows.length === 0) throw new Error('No INSERT statements found');
      setOutput(rows.join('\n'));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Extract data from SQL to CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SQL Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="INSERT INTO..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="SQL to CSV"
        description="SQL to CSV extracts data from INSERT INTO ... VALUES (...) statements in pasted SQL text and turns them into CSV rows, entirely in your browser — nothing is uploaded to a server. It doesn't run a database or execute SELECT queries. Parsing the value list is quote-aware: a comma or closing parenthesis inside a quoted SQL string (like 'Smith, John' or 'Smith (Jr)') is treated as literal data rather than a delimiter, and a doubled '' inside a value is unescaped to a single quote. Output CSV fields are quoted per the standard convention whenever a value contains a comma, quote, or newline."
        howTo={[
          "Paste SQL text containing one or more INSERT INTO ... VALUES (...) statements.",
          "Click 'Convert' to extract the column names and values into CSV rows.",
          "Review the output, especially for values containing commas.",
          "Click 'Copy' to copy the CSV to your clipboard."
        ]}
        faqs={[
          { q: "Does it run my SQL against a database or convert SELECT query results?", a: "No — it doesn't execute any SQL. It only pattern-matches the text of INSERT INTO ... VALUES (...) statements you paste in." },
          { q: "Is SQL to CSV free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I customize the CSV delimiter?", a: "No, output always uses commas — there's no option for semicolons, tabs, or pipes." },
          { q: "Does it handle values containing commas?", a: "Yes — a quoted SQL string like 'Smith, John' is parsed as a single value, and the resulting CSV field is quoted too if needed, so it stays as one column rather than splitting apart." }
        ]}
        tips={[
          "This tool only works with INSERT statement text — it can't process SELECT queries or connect to an actual database.",
          "Values are parsed with SQL's own quoting rules, so commas and even closing parentheses inside a quoted string (e.g. 'Smith (Jr)') are handled correctly.",
          "Headers come from the column list in the first matching INSERT statement — make sure it's representative of the rest.",
          "Output CSV fields are quoted automatically whenever a value contains a comma, quote, or newline."
        ]}
      />
    </div>
  );
}