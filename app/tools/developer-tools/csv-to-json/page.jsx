'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseCsvRows } from '../../../lib/csvParser';

export default function CsvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const rows = parseCsvRows(input.trim());
      if (rows.length === 0) throw new Error('Empty CSV');
      const headers = rows[0].map(h => h.trim());
      const result = rows.slice(1).map(vals => Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()])));
      setOutput(JSON.stringify(result, null, 2));
      setError('');
    } catch(e) { setError('Invalid CSV'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name,age,city..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="CSV to JSON"
        description="CSV to JSON parses pasted CSV text and converts it to an array of JSON objects entirely in your browser — nothing is uploaded to a server. The first line is treated as the header row. Parsing is quote-aware: a field wrapped in double quotes can safely contain a comma or a newline (like 'Smith, John') without being split into extra columns, and a doubled double-quote inside a quoted field is unescaped to a single quote. It doesn't support delimiters other than commas, like semicolons or tabs."
        howTo={[
          "Paste your CSV text into the input box, with a header row as the first line.",
          "Click 'Convert' to generate the JSON array.",
          "Read the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." },
          { q: "Does it support delimiters other than commas, like semicolons or tabs?", a: "No, splitting is done on commas only — though a comma inside a properly double-quoted field is treated as data, not a delimiter." },
          { q: "Can I download the JSON as a file?", a: "No, there's only a 'Copy' button — you'd need to paste the copied text into a file yourself." }
        ]}
        tips={[
          "Include a header row as the first line — those values become the keys in each JSON object.",
          "Wrap a value in double quotes if it contains a comma (e.g. \"Smith, John\") — quoted fields are parsed correctly and won't shift into the wrong keys.",
          "Rows with fewer values than headers get empty strings for the missing fields.",
          "Validate the resulting JSON with a linter before using it in an application, especially for CSVs with unusual formatting."
        ]}
      />
    </div>
  );
}