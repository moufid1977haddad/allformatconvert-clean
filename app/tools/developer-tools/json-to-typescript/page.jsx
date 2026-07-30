'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToTypescriptPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const lines = ['interface Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const t = Array.isArray(v) ? 'any[]' : typeof v === 'object' && v !== null ? 'object' : typeof v;
        lines.push('  ' + k + ': ' + t + ';');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TypeScript</h1>
        <p className="text-neutral-500 text-center mb-8">Generate TypeScript interfaces from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to TypeScript"
        description="JSON to TypeScript generates a single Root interface with one field per top-level JSON key, entirely in your browser — nothing is uploaded to a server. Strings, numbers, and booleans map directly to their TypeScript types; arrays are typed as any[] and nested objects as object, since nested values aren't recursively converted into their own interfaces. Field names are inserted as plain identifiers with no quoting, so a JSON key containing a hyphen or space will produce invalid TypeScript."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate a TypeScript interface from the top-level properties.",
          "Review the output and add nested interfaces by hand where needed.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to TypeScript free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate nested interfaces for nested JSON?", a: "No — only top-level keys become typed fields. Nested objects are typed as object and arrays as any[], rather than generating separate nested interfaces." },
          { q: "What if my JSON has unusual field names, like ones with hyphens or spaces?", a: "Field names are inserted as plain TypeScript identifiers with no quoting, so a key like \"first-name\" produces invalid syntax — you'll need to manually wrap such names in quotes." },
          { q: "Can I download the generated code as a file?", a: "No, there's only a 'Copy' button — paste the copied code into a file yourself." }
        ]}
        tips={[
          "For nested objects or arrays of objects, manually define additional interfaces and update the field types to reference them.",
          "Rename the generated interface from Root to something more specific to your data.",
          "If your JSON has field names that aren't valid identifiers (hyphens, spaces, leading digits), wrap them in quotes by hand, e.g. 'first-name': string;.",
          "Review whether any fields should be optional (marked with ?) based on your actual data, since the tool always generates required fields."
        ]}
      />
    </div>
  );
}