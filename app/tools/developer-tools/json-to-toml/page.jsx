'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToTomlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const lines = [];
      Object.entries(obj).forEach(([k,v]) => {
        if (typeof v === 'object' && v !== null) {
          lines.push('[' + k + ']');
          Object.entries(v).forEach(([k2,v2]) => {
            const val = typeof v2 === 'string' ? '"' + v2 + '"' : v2;
            lines.push(k2 + ' = ' + val);
          });
        } else {
          const val = typeof v === 'string' ? '"' + v + '"' : v;
          lines.push(k + ' = ' + val);
        }
      });
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
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
        description="JSON to TOML converts a flat or one-level-nested JSON object into TOML text, entirely in your browser — nothing is uploaded to a server. One level of nested objects correctly becomes a TOML table section, but JSON arrays are mishandled — converted into numbered keys instead of a proper TOML array — and objects nested two or more levels deep produce invalid, literal object-text rather than valid TOML."
        howTo={[
          "Paste a flat or one-level-nested JSON object into the input box.",
          "Click 'Convert' to generate TOML text.",
          "Review the output carefully, especially for arrays or deeply nested values.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to TOML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it convert JSON arrays correctly?", a: "No — array values are converted into numbered keys (0, 1, 2, ...) inside a table instead of proper TOML array syntax like tags = [\"a\", \"b\"]." },
          { q: "Does it handle deeply nested JSON?", a: "Only one level of nesting converts correctly into a TOML table. Objects nested two or more levels deep produce invalid output instead of valid TOML." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Stick to flat JSON, or JSON with at most one level of nested objects, for reliable results.",
          "Avoid JSON arrays in your input, since they're not converted into valid TOML array syntax — rewrite them by hand afterward.",
          "For deeply nested JSON, flatten or restructure it before converting, since anything past one level of nesting won't convert correctly.",
          "Always validate the output with a TOML linter or parser before using it in a real configuration file."
        ]}
      />
    </div>
  );
}