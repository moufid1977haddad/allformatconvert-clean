'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
export default function JsonToPythonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'python'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Python Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Python dataclasses from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Python Output</label><textarea aria-label="Python Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="model.py" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to Python Class"}
        description={"JSON to Python Class generates Python @dataclass definitions from a JSON sample — the type schema, not a dict of your data — entirely in your browser. It uses quicktype, the open-source engine behind app.quicktype.io: every nested object gets its own dataclass, arrays of objects become List[Item], integers are typed int and decimals float, fields that are missing or null become Optional, and JSON keys are turned into valid snake_case Python names."}
        howTo={[
          "Paste a JSON object or array (an API response, a config file) into the input box.",
          "Click 'Convert': one named type is generated for every nested object, and the fields of every element of an array are merged.",
          "Review the output — fields missing from some elements or holding null are marked optional.",
          "Click 'Copy' to copy the code into your project."
        ]}
        faqs={[
          { q: "Is JSON to Python Class free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it generate a Python dict or list with my actual data?", a: "No — it generates @dataclass type definitions. To load your actual JSON as a Python dict, use json.loads(json_string)." },
          { q: "Does it handle nested JSON objects?", a: "Yes — each nested object becomes its own dataclass, referenced from its parent; arrays of objects become List of that class." },
          { q: "Are integers and decimals distinguished?", a: "Yes — whole numbers are typed int, decimals float." },
          { q: "Is my data uploaded to a server?", a: "No, generation happens entirely in your browser." }
        ]}
        tips={[
          "Paste several array elements so optional fields are detected.",
          "Keys such as \"first-name\" become valid snake_case attribute names; map them back when you load data.",
          "Rename the Root class to something specific to your data."
        ]}
      />
    </div>
  );
}