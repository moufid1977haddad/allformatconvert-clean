'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToYamlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const toYaml = (o, indent = 0) => Object.entries(o).map(([k,v]) => typeof v === 'object' && v !== null ? `${'  '.repeat(indent)}${k}:\n${toYaml(v, indent+1)}` : `${'  '.repeat(indent)}${k}: ${v}`).join('\n');
      setOutput(toYaml(obj));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to YAML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to YAML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name": "John"}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">YAML Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to YAML"
        description="JSON to YAML recursively converts JSON objects into indented YAML, entirely in your browser — nothing is uploaded to a server. Nested objects convert cleanly at any depth, but two gaps are worth knowing: JSON arrays are converted into numbered keys (0, 1, 2...) rather than proper YAML list items, and string values are inserted without quoting, so a value containing a colon-plus-space can produce invalid YAML."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate indented YAML.",
          "Review the output, especially for arrays or values containing a colon.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to YAML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it handle nested JSON objects?", a: "Yes — nested objects convert into properly indented YAML at any depth." },
          { q: "Does it convert JSON arrays correctly?", a: "No — array items are converted into numbered keys like 0: a and 1: b, which a YAML parser reads back as an object with keys \"0\" and \"1\", not as a list." },
          { q: "Does it handle values containing special YAML characters, like a colon?", a: "Not reliably — values are inserted without quoting, so a string containing a colon followed by a space (e.g. \"Note: important\") can produce YAML that fails to parse." }
        ]}
        tips={[
          "Rewrite array values as YAML list syntax by hand afterward, since numbered keys parse back as an object, not a list.",
          "If a value contains a colon followed by a space, wrap it in quotes manually in the output to keep it valid YAML.",
          "Nested objects are this tool's strength — nesting converts correctly at any depth.",
          "Validate the output with a YAML parser or linter before using it in a real configuration file, especially for free-form text values."
        ]}
      />
    </div>
  );
}