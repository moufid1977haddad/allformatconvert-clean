'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToRustPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'String', number: 'f64', boolean: 'bool' };
      const lines = ['#[derive(Debug, Serialize, Deserialize)]','struct Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const rustType = Array.isArray(v) ? 'Vec<serde_json::Value>' : (typeMap[typeof v] || 'serde_json::Value');
        lines.push('  ' + k + ': ' + rustType + ',');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Rust Struct</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Rust structs from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Rust Struct Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to Rust Struct"
        description="JSON to Rust Struct generates a single Root struct annotated with #[derive(Debug, Serialize, Deserialize)] and one field per top-level JSON key, entirely in your browser — nothing is uploaded to a server. Strings, numbers, and booleans map to String, f64, and bool; arrays become Vec of serde_json::Value and nested objects become serde_json::Value, since nested values aren't recursively converted into their own structs. The Serialize/Deserialize derives assume your project already depends on the serde and serde_json crates."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate a Rust struct from the top-level properties.",
          "Review the output and add nested struct types by hand where needed.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to Rust Struct free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate nested structs for nested JSON?", a: "No — only top-level keys become typed fields. Nested objects are typed as serde_json::Value and arrays as Vec<serde_json::Value>, rather than generating separate nested struct types." },
          { q: "Do I need any dependencies to use the generated code?", a: "Yes — the derive(Serialize, Deserialize) attribute requires the serde crate (with the derive feature) and serde_json in your Cargo.toml." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "Add serde with the derive feature, plus serde_json, to your Cargo.toml before using the generated struct.",
          "For nested objects or arrays of objects, manually define additional struct types and update the field types to reference them.",
          "Numbers always map to f64 — change to a specific integer type like i32 or u64 if that better matches your data.",
          "Field names are used exactly as written in your JSON; rename to snake_case and add a serde rename attribute if your JSON uses a different naming convention."
        ]}
      />
    </div>
  );
}