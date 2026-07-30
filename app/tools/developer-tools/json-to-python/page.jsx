'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToPythonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'str', number: 'float', boolean: 'bool' };
      const lines = ['from dataclasses import dataclass','','@dataclass','class Root:'];
      Object.entries(obj).forEach(([k,v]) => {
        const pyType = Array.isArray(v) ? 'list' : (typeMap[typeof v] || 'dict');
        lines.push('  ' + k + ': ' + pyType);
      });
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Python Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Python dataclasses from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Python Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to Python Class"
        description="JSON to Python Class generates a Python @dataclass with one type-annotated field per top-level JSON key — not a populated dictionary or list containing your actual data — entirely in your browser. Strings, numbers, and booleans map to str, float, and bool; arrays are annotated as list and nested objects as dict, since nested values aren't recursively converted into their own dataclasses."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate a Python dataclass from the top-level properties.",
          "Review the output — this defines field types, not populated data.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to Python Class free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate a Python dict or list with my actual data?", a: "No — it generates a @dataclass type definition with annotated fields like name: str, not populated data. To get your actual JSON as a Python dict, use Python's own json.loads(json_string) instead." },
          { q: "Does it handle nested JSON objects?", a: "No — only top-level keys become typed fields; nested objects are annotated as dict and arrays as list, without generating nested dataclasses." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "If you need your actual JSON values as Python data, use json.loads() directly — this tool only generates a type schema, not populated data.",
          "For nested objects, manually define additional @dataclass types and update the field annotations to reference them.",
          "Numbers always map to float, even for values that look like integers — change to int where that fits your data better.",
          "Field names are used exactly as written in your JSON, so non-identifier characters like spaces or hyphens will produce invalid Python — rename them first if needed."
        ]}
      />
    </div>
  );
}