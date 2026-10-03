'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { SEO } from './seo';
import { sqlInsertsToCsv } from './sqlToCsv';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function SqlToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const [tables, setTables] = useState(null); // several tables in the dump: the visitor picks one (P24)
  const convert = (pick) => {
    try {
      setOutput(sqlInsertsToCsv(input, { table: pick || null }));
      setError(''); if (!pick) setTables(null);
    } catch(e) { setOutput(''); setError(e.message); setTables(e.tables || null); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Extract data from SQL to CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SQL Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="INSERT INTO..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><TextArea aria-label="CSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.csv" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {tables && <div className="flex flex-wrap gap-2 justify-center" data-tables>{tables.map((t) => <button key={t} type="button" onClick={() => convert(t)} className="px-3 py-1 rounded-lg border border-neutral-300 bg-white text-sm">Convert table {t}</button>)}</div>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => convert()} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
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
        faqs={SEO.faqs}
        example={SEO.example}
        related={SEO.related}
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