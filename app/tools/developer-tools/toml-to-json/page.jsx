'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function TomlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = {};
      let currentSection = obj;
      input.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        if (line.startsWith('[')) {
          const key = line.slice(1,-1);
          obj[key] = {};
          currentSection = obj[key];
        } else if (line.includes('=')) {
          const eqIdx = line.indexOf('=');
          const k = line.slice(0, eqIdx).trim();
          const v = line.slice(eqIdx+1).trim().replace(/^"|"$/g,'');
          currentSection[k] = isNaN(v) ? v : Number(v);
        }
      });
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid TOML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TOML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TOML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TOML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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
        title="TOML to JSON"
        description="TOML to JSON parses simple TOML — [section] headers and key = value pairs, one level deep — into a JSON object, entirely in your browser — nothing is uploaded to a server. It doesn't support nested tables (like [section.subsection]), arrays, multi-line strings, or TOML's native date/time literals, so more advanced TOML files won't convert correctly."
        howTo={[
          "Paste simple, single-level TOML into the input box.",
          "Click 'Convert' to parse [section] headers and key = value pairs into JSON.",
          "Review the output, especially for nested tables, arrays, or dates.",
          "Click 'Copy' to copy the JSON to your clipboard."
        ]}
        faqs={[
          { q: "Is TOML to JSON free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it support nested tables, like [section.subsection]?", a: "No — only one level of [section] headers is recognized; dotted or nested table headers aren't parsed into nested JSON objects." },
          { q: "Does it support TOML arrays or date/time values?", a: "No — arrays (key = [1, 2, 3]) and TOML's native date/time literals aren't parsed specially; they'll come through as unparsed text rather than proper JSON arrays or dates." },
          { q: "Can I download the JSON as a file?", a: "No, there's only a 'Copy' button — paste the copied text into a file yourself if you need one." }
        ]}
        tips={[
          "Works best on simple, flat TOML with basic key = value pairs and single-level [section] headers.",
          "For nested tables, arrays, or advanced TOML features, use a dedicated TOML parser library instead.",
          "Numbers are auto-detected and converted to JSON numbers; quoted string values have their surrounding double quotes stripped.",
          "Review the output carefully for any file using TOML features beyond simple flat key-value pairs."
        ]}
      />
    </div>
  );
}