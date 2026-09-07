'use client';
import { useState } from 'react';
import { dump } from 'js-yaml';
import SeoContent from '../../../components/SeoContent';
export default function JsonToYamlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      setOutput(dump(obj, { lineWidth: -1 }));
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
        description="JSON to YAML converts JSON into valid YAML using the js-yaml library, entirely in your browser — nothing is uploaded to a server. Arrays convert into proper YAML list items (- item), nested objects convert at any depth, and string values are quoted automatically whenever needed (a colon, a leading special character, and similar cases) so the output parses back correctly."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate YAML.",
          "The output is copy-paste-ready YAML, including arrays and nested objects.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to YAML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it handle nested JSON objects?", a: "Yes — nested objects convert into properly indented YAML at any depth." },
          { q: "Does it convert JSON arrays correctly?", a: "Yes — array items are converted into proper YAML list syntax (- item), which parses back as an array, not an object." },
          { q: "Does it handle values containing special YAML characters, like a colon?", a: "Yes — values are quoted automatically whenever needed (e.g. a string containing \"Note: important\"), since the conversion uses the js-yaml library instead of manual string formatting." }
        ]}
        tips={[
          "Arrays and deeply nested objects both convert correctly — there's no need to restructure your JSON first.",
          "Values that need quoting (colons, leading special characters, etc.) are quoted automatically.",
          "The output uses YAML's block style throughout, so it stays readable even for large nested structures.",
          "It's still worth a quick sanity check in your target application, since some YAML consumers interpret edge cases (like unquoted 'yes'/'no') differently."
        ]}
      />
    </div>
  );
}
