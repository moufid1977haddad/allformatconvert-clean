'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonToCsharpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'csharp'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to C# Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate C# classes from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">C# Output</label><TextArea aria-label="C# Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="Model.cs" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to C# Class"}
        description={"JSON to C# Class generates C# classes from a JSON sample, entirely in your browser — nothing is uploaded to a server. It uses quicktype, the open-source engine behind app.quicktype.io: every nested object gets its own class, arrays of objects become Item[], integers are typed long and decimals double, optional or null fields become nullable, property names follow PascalCase and each property carries a System.Text.Json [JsonPropertyName] attribute with the original key."}
        howTo={[
          "Paste a JSON object or array (an API response, a config file) into the input box.",
          "Click 'Convert': one named type is generated for every nested object, and the fields of every element of an array are merged.",
          "Review the output — fields missing from some elements or holding null are marked optional.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to C# Class free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it handle nested objects and arrays as their own classes?", a: "Yes — each nested object becomes its own class, and arrays of objects become arrays of that class." },
          { q: "Is the generated code ready to use as-is?", a: "Yes with System.Text.Json: each property keeps the original JSON key in a [JsonPropertyName] attribute, so JsonSerializer.Deserialize maps it correctly." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "Property names are PascalCase (first_name becomes FirstName); the attribute keeps the JSON key.",
          "Paste several array elements so optional properties are detected.",
          "Whole numbers are typed long — change to int if your data allows."
        ]}
      />
    </div>
  );
}