'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function YamlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const lines = input.split('\n');
      const obj = {};
      lines.forEach(line => {
        const match = line.match(/^([\w-]+):\s*(.*)$/);
        if (match) obj[match[1]] = isNaN(match[2]) ? match[2] : Number(match[2]);
      });
      setOutput(JSON.stringify(obj, null, 2));
      setError('');
    } catch(e) { setError('Invalid YAML'); }
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
        description="YAML to JSON parses simple, flat 'key: value' lines into a JSON object, entirely in your browser — nothing is uploaded to a server. It doesn't support nested structures, lists (- item), multi-line strings, comments, or booleans/null — only flat top-level key-value pairs. A key with no value after the colon converts to 0 rather than null, since it isn't recognized as a distinct case."
        howTo={[
          "Paste simple, flat YAML — one 'key: value' pair per line — into the input box.",
          "Click 'Convert' to parse it into JSON.",
          "Review the output, especially for nested keys, lists, or missing values.",
          "Click 'Copy' to copy the JSON result."
        ]}
        faqs={[
          { q: "Is YAML to JSON free to use?", a: "Yes, completely free with no registration required." },
          { q: "Does it support nested YAML structures?", a: "No — only flat, top-level 'key: value' pairs are recognized; indented nested keys aren't parsed into nested JSON objects." },
          { q: "Does it support YAML lists (- item)?", a: "No — list syntax isn't recognized and won't convert into a JSON array." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Works best on simple, flat configuration snippets with one key-value pair per line.",
          "For nested YAML, lists, comments, or multi-line strings, use a dedicated YAML parser library instead.",
          "Numbers are auto-detected and converted to JSON numbers; other values are kept as strings.",
          "A key left with no value (like 'foo:') converts to 0, not null — adjust the output manually if you need a true null."
        ]}
      />
    </div>
  );
}