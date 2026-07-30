'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error('JSON must be an array');
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h] ?? '').join(','))].join('\n');
      setOutput(csv);
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
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='[{"name":"John","age":30}]' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to CSV"
        description="JSON to CSV converts a JSON array of objects into CSV text, using the browser's built-in JSON.parse, entirely in your browser — nothing is uploaded to a server. Column headers come only from the first object's keys, and values are joined with commas without quoting, so a value containing a comma will shift into the wrong column. Nested objects or arrays inside a row become the literal text object Object rather than being flattened."
        howTo={[
          'Paste a JSON array of objects into the input box, e.g. [{"name":"John","age":30}].',
          "Click 'Convert' to generate CSV text.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to CSV free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it flatten nested JSON into columns?", a: "No — a nested object or array inside a row becomes the literal text \"[object Object]\" rather than being split into separate columns." },
          { q: "What if my objects have different keys?", a: "Only the first object's keys become CSV columns; other objects' extra keys are ignored, and missing keys show as blank." },
          { q: "Does it handle values that contain commas?", a: "No — values aren't quoted or escaped, so a value containing a comma will shift into the wrong column when opened in a spreadsheet." }
        ]}
        tips={[
          "Your JSON must be a top-level array of objects — a single object or a deeply nested structure will show an error.",
          "Keep every object in the array with the same set of keys for clean, aligned columns.",
          "Avoid commas within values, or replace them before converting, since output fields aren't quoted.",
          "For nested JSON, flatten it into simple key-value objects yourself before converting."
        ]}
      />
    </div>
  );
}