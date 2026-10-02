'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
export default function JsonToTypescriptPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'typescript'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to TypeScript</h1>
        <p className="text-neutral-500 text-center mb-8">Generate TypeScript interfaces from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Output</label><textarea aria-label="TypeScript Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="types.ts" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to TypeScript"}
        description={"JSON to TypeScript generates TypeScript interfaces from a JSON sample, entirely in your browser — nothing is uploaded to a server. It uses quicktype, the open-source engine behind app.quicktype.io: every nested object gets its own named interface, every element of an array is examined and merged (so an array of objects becomes Item[]), fields missing from some elements become optional (field?:), null values are typed, and keys that aren't valid identifiers (\"first-name\") are quoted so the code compiles."}
        howTo={[
          "Paste a JSON object or array (an API response, a config file) into the input box.",
          "Click 'Convert': one named type is generated for every nested object, and the fields of every element of an array are merged.",
          "Review the output — fields missing from some elements or holding null are marked optional.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to TypeScript free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate nested interfaces for nested JSON?", a: "Yes — each nested object becomes its own named interface, referenced from its parent; arrays of objects become arrays of that interface." },
          { q: "What if my JSON has field names with hyphens or spaces?", a: "They are written as quoted property names (\"first-name\": string;), which is valid TypeScript." },
          { q: "Are optional fields detected?", a: "Yes — a field that is missing from some elements of an array is marked optional with ?, and a null value is reflected in the type." },
          { q: "Can I download the generated code as a file?", a: "No, there's only a 'Copy' button — paste the copied code into a file yourself." }
        ]}
        tips={[
          "Paste an array with several representative elements: the more samples, the more precise the optional fields and unions.",
          "Rename the Root interface to something specific to your data.",
          "Types are inferred from the sample only — a field that is always a string in your sample is typed string."
        ]}
      />
    </div>
  );
}