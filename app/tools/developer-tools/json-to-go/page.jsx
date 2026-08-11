'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToGoPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'float64', boolean: 'bool' };
      const lines = ['type Root struct {'];
      Object.entries(obj).forEach(([k,v]) => {
        const goType = Array.isArray(v) ? '[]interface{}' : (typeMap[typeof v] || 'interface{}');
        const name = k.charAt(0).toUpperCase() + k.slice(1);
        lines.push('  ' + name + ' ' + goType + ' `json:"' + k + '"`');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Go Struct</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Go structs from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Go Struct Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to Go Struct"
        description="JSON to Go Struct generates a single Root struct with one field per top-level JSON key, entirely in your browser — nothing is uploaded to a server. Strings, numbers, and booleans map to string, float64, and bool with json struct tags matching your original keys; arrays become []interface{} and nested objects become interface{}, since nested values aren't recursively converted into their own structs."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate a Go struct from the top-level properties.",
          "Review the output and add nested struct types by hand where needed.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to Go Struct free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate nested structs for nested JSON?", a: "No — only top-level keys become typed fields. Nested objects are typed as interface{} and arrays as []interface{}, rather than generating separate nested struct types." },
          { q: "Is the generated code ready to use as-is?", a: "For flat JSON, yes. For nested data, you'll need to manually define additional struct types and update the field types to reference them." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "Field names are capitalized only on the first letter (e.g. first_name becomes First_name) so they're exported — rename them to proper Go convention (FirstName) by hand if you want that style.",
          "The json struct tag preserves your original JSON key, so encoding/json still marshals and unmarshals correctly even after you rename the Go field.",
          "For nested objects or arrays of objects, manually create additional struct types and update the generated field types to match.",
          "Numbers always map to float64 — change to int or another numeric type if that better fits your data."
        ]}
      />
    </div>
  );
}