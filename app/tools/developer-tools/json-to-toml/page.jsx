'use client';
import { useState } from 'react';
import { stringify } from 'smol-toml';
import SeoContent from '../../../components/SeoContent';
export default function JsonToTomlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    let obj;
    try {
      obj = JSON.parse(input);
    } catch(e) { setError('Invalid JSON'); return; }
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      setError('TOML documents are key/value tables at the top level -- wrap your JSON in an object (e.g. { "items": ... }) before converting.');
      return;
    }
    try {
      setOutput(stringify(obj));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TOML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to TOML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TOML Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to TOML"
        description="JSON to TOML converts a JSON object into valid TOML using the smol-toml library, entirely in your browser — nothing is uploaded to a server. Nested objects convert into TOML tables at any depth, arrays become proper TOML array syntax (including arrays of tables), and numbers, booleans, and ISO date strings are typed correctly rather than left as quoted text."
        howTo={[
          "Paste a JSON object into the input box (the top level must be an object, not an array).",
          "Click 'Convert' to generate TOML text.",
          "The output is copy-paste-ready TOML, including nested tables and arrays.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to TOML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it convert JSON arrays correctly?", a: "Yes — array values become proper TOML array syntax, e.g. tags = [\"a\", \"b\"], at any nesting depth." },
          { q: "Does it handle deeply nested JSON?", a: "Yes — nested objects convert into TOML tables (or tables of tables, using dotted section headers) at any depth, not just one level." },
          { q: "What happens to a JSON null value?", a: "A null value on an object key is simply omitted from the output, since TOML has no null type. A null inside an array isn't representable at all and produces an error instead of silently corrupting the array — remove it from your JSON first." },
          { q: "Why do I get an error even though my JSON is valid?", a: "TOML documents are key/value tables at the top level, so the JSON you paste must be an object ({...}), not a top-level array or a bare string/number." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Wrap top-level arrays in an object first (e.g. { \"items\": [...] }), since TOML itself has no concept of a top-level array.",
          "Remove any null values inside arrays before converting — TOML can't represent them there.",
          "ISO 8601 date strings in your JSON convert to TOML's native date-time type automatically.",
          "Always validate the output with a TOML linter or parser before using it in a real configuration file."
        ]}
      />
    </div>
  );
}
