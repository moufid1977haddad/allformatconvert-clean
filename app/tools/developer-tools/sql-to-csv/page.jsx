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
        description={"SQL to CSV reads the INSERT INTO … VALUES statements in pasted SQL, such as a mysqldump export, and writes their rows as CSV with a header row. Multi-row inserts, INSERT IGNORE, names in backticks, double quotes or brackets, and schema.table names are read. The header comes from the column list, or is column_1, column_2 and so on when there is none. A CSV holds one table, so a dump with several tables asks which one to convert. It does not run SQL, read SELECT results or connect to a database; the parsing happens in your browser."}
        example={SEO.example}
        howToTitle="How to convert SQL INSERT statements to CSV"
        howTo={[
          "Paste SQL with INSERT statements into \"SQL Input\".",
          "Click \"Convert\".",
          "If several tables are found, click the \"Convert table\" button that carries the table you want.",
          "Click \"Copy\", or \"Download\" to save the rows of that table as data.csv.",
        ]}
        specs={[
          { label: "Input", value: "SQL text with INSERT INTO … VALUES statements" },
          { label: "Output", value: "CSV, header row from the column list (column_1, column_2… without one), file data.csv" },
          { label: "NULL", value: "empty field" },
          { label: "Tables", value: "one per CSV; you choose when there are several" },
        ]}
        privacy={"The SQL is parsed by the page in your browser and is not uploaded; no database is involved. Errors are reported to us with the tool name and your browser version, and their text is cleaned of quoted parts, but the messages about several tables or mismatched column lists contain those table and column names."}
        faqs={[
          { q: "Does it read multi-row INSERT statements from mysqldump?", a: "Yes. Every tuple of VALUES (…), (…), (…) becomes a row, across all the statements you paste. A MySQL escape such as O\\'Brien and the standard O''Brien both come out as O'Brien." },
          { q: "Is NULL written as the word NULL?", a: "No. NULL becomes an empty field, the same as an empty string, because CSV has no separate null. Search the SQL before converting if you need to tell the two apart." },
          { q: "Can statements list their columns differently?", a: "No. All INSERT statements for a table must list the same columns in the same order; otherwise the tool stops and shows both lists, since the rows would not line up. Statements without any column list get the headers column_1, column_2 and so on." },
          { q: "Are function calls such as NOW() evaluated?", a: "No. Nothing is executed: NOW() is written as the text NOW(). Backslash sequences other than an escaped quote are kept as written, because MySQL and standard SQL read them differently." },
        ]}
        tips={[
          "To create INSERT statements from a CSV file, use CSV to SQL.",
        ]}
        related={SEO.related}
      />
    </div>
  );
}