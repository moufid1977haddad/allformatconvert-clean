'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
export default function JsonToRustPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'rust'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
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
        description="JSON to Rust Struct generates Rust structs for serde from a JSON sample, entirely in your browser — nothing is uploaded to a server. It uses quicktype, the open-source engine behind app.quicktype.io: every nested object gets its own struct, arrays become Vec<Item>, null or missing fields become Option<T>, integers are typed i64 and decimals f64, field names are converted to snake_case with #[serde(rename_all)] or #[serde(rename = \"...\")] attributes that keep the original JSON keys, and every struct derives Debug, Clone, Serialize and Deserialize."
        howTo={[
          "Paste a JSON object or array (an API response, a config file) into the input box.",
          "Click 'Convert': one named type is generated for every nested object, and the fields of every element of an array are merged.",
          "Review the output — fields missing from some elements or holding null are marked optional.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to Rust Struct free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate nested structs for nested JSON?", a: "Yes — each nested object becomes its own struct, and arrays of objects become Vec of that struct." },
          { q: "How are camelCase or hyphenated keys handled?", a: "Fields are renamed to snake_case, and serde attributes (#[serde(rename_all = \"camelCase\")] or #[serde(rename = \"last-name\")]) keep the original JSON key, so serde_json reads and writes it unchanged." },
          { q: "How are null values handled?", a: "A field that is null or missing in the sample becomes Option<T>, and optional fields are skipped when serializing if they are None." },
          { q: "Do I need any dependencies to use the generated code?", a: "Yes — serde (with the derive feature) and serde_json in your Cargo.toml." }
        ]}
        tips={[
          "Add serde = { version = \"1\", features = [\"derive\"] } and serde_json = \"1\" to Cargo.toml.",
          "Paste several array elements so fields that are sometimes missing become Option.",
          "Whole numbers are typed i64 — change to u32 or another type if your data allows."
        ]}
      />
    </div>
  );
}