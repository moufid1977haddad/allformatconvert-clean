'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

import { jsonToCsv } from '../../../lib/jsonToCsv';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function JsonToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = () => {
    try {
      setOutput(jsonToCsv(input));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to CSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='[{"name":"John","age":30}]' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><TextArea aria-label="CSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.csv" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to CSV"
        description="JSON to CSV converts a JSON array of objects (or a single object) into CSV text, entirely in your browser — nothing is uploaded to a server. Every key found in any object becomes a column, in the order first seen, so no field is dropped when rows differ. Nested objects are flattened into dotted column names (address.city) and arrays into indexed ones (tags.0, tags.1), the way ConvertCSV and json-csv.com do. Numbers are written exactly as in your JSON (a 20-digit id is never rounded), and a value containing a comma, double quote, or line break is wrapped in double quotes with internal quotes doubled, so it stays in a single column when reopened."
        howTo={[
          'Paste a JSON array of objects into the input box, e.g. [{"name":"John","age":30}].',
          "Click 'Convert' to generate CSV text.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to CSV free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it flatten nested JSON into columns?", a: "Yes — a nested object becomes dotted columns (address.city, address.zip) and an array becomes indexed columns (tags.0, tags.1). An empty object or array is written as {} or []." },
          { q: "What if my objects have different keys?", a: "Every key that appears in any object becomes a column; a row that lacks a key gets an empty cell there. Nothing is dropped." },
          { q: "Does it handle values that contain commas?", a: "Yes — a value containing a comma, quote, or newline is automatically wrapped in double quotes in the output, so it's read back as a single column." }
        ]}
        tips={[
          "Paste an array of objects, a single object (one row), or an array of plain values (one \"value\" column).",
          "Objects with different keys are fine: the columns are the union of all keys, in first-seen order.",
          "Values containing a comma, quote, or newline are quoted automatically in the output — no manual cleanup needed for those.",
          "Nested JSON is flattened automatically; rename the dotted headers afterwards if you prefer other column names."
        ]}
      />
    </div>
  );
}