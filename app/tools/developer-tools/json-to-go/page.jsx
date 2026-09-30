'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
export default function JsonToGoPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'go'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Go Struct</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Go structs from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Go Struct Output</label><textarea aria-label="Go Struct Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to Go Struct"}
        description={"JSON to Go Struct generates Go struct types from a JSON sample, entirely in your browser — nothing is uploaded to a server. It uses quicktype, the open-source engine behind app.quicktype.io: every nested object gets its own named struct, arrays of objects become []Item, integers are typed int64 and decimals float64, optional fields become pointers, field names follow Go convention (FirstName) and each field keeps a json struct tag with the original key, so encoding/json marshals and unmarshals it unchanged."}
        howTo={[
          "Paste a JSON object or array (an API response, a config file) into the input box.",
          "Click 'Convert': one named type is generated for every nested object, and the fields of every element of an array are merged.",
          "Review the output — fields missing from some elements or holding null are marked optional.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to Go Struct free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate nested structs for nested JSON?", a: "Yes — each nested object becomes its own struct type, referenced from its parent." },
          { q: "Is the generated code ready to use as-is?", a: "Yes for encoding/json: every field carries a json tag with the original key. Types come from your sample, so review them against real data." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "Field names are converted to Go convention (first_name becomes FirstName); the json tag keeps the original key.",
          "Paste several array elements so fields that are sometimes missing become pointers.",
          "Whole numbers are typed int64 — change to a smaller type if your data allows."
        ]}
      />
    </div>
  );
}