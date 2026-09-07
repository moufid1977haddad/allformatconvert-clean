'use client';
import { useState } from 'react';
import { load } from 'js-yaml';
import SeoContent from '../../../components/SeoContent';
export default function YamlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = load(input);
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid YAML: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">YAML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert YAML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">YAML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name: John&#10;age: 30" value={input} onChange={e => setInput(e.target.value)} /></div>
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
        title="YAML to JSON"
        description="YAML to JSON parses YAML using the js-yaml library and converts it to JSON, entirely in your browser — nothing is uploaded to a server. Nested structures, lists (- item), multi-line strings, comments, booleans, and null all parse correctly, matching how a real YAML parser reads the file."
        howTo={[
          "Paste any valid YAML into the input box — flat, nested, or with lists.",
          "Click 'Convert' to parse it into JSON.",
          "The output preserves nested objects, arrays, and types (booleans, numbers, null) correctly.",
          "Click 'Copy' to copy the JSON result."
        ]}
        faqs={[
          { q: "Is YAML to JSON free to use?", a: "Yes, completely free with no registration required." },
          { q: "Does it support nested YAML structures?", a: "Yes — nested mappings convert into nested JSON objects at any depth." },
          { q: "Does it support YAML lists (- item)?", a: "Yes — list syntax converts into a proper JSON array." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Comments (starting with #) are supported and simply ignored, as in any YAML parser.",
          "Booleans, numbers, and null are recognized and converted to their real JSON types, not left as strings.",
          "Multi-line strings (using | or >) parse correctly into a single JSON string value.",
          "If conversion fails, the error message includes the line where the parser got stuck, which is usually the fastest way to find a YAML syntax mistake."
        ]}
      />
    </div>
  );
}
