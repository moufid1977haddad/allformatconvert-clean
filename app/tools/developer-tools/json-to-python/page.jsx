'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
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
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Python Output</label><TextArea aria-label="Python Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"JSON to Python Class generates Python 3.7+ dataclasses that describe the shape of a JSON sample: type definitions, not a dict holding your values. It runs quicktype-core in your browser. Each nested object becomes a @dataclass, field names are converted to snake_case (first-name becomes first_name), and types use int, float, str, bool, List and Optional from typing, plus Union when a value has two types and Any for an empty array. Fields absent from some array elements get Optional[...] = None and are placed after the required ones, as dataclasses require. There is no from_dict or to_dict helper: you create the objects yourself."}
        example={{
          caption: "Two people; only Ada has a spouse, so spouse becomes Optional.",
          inputLabel: "JSON Input",
          input: "[{\"first-name\": \"Ada\", \"age\": 36, \"spouse\": {\"name\": \"Bob\"}},\n {\"first-name\": \"Lin\", \"age\": 29}]",
          outputLabel: "Python Output",
          output: "from dataclasses import dataclass\nfrom typing import Optional\n\n@dataclass\nclass Spouse:\n    name: str\n\n@dataclass\nclass RootElement:\n    first_name: str\n    age: int\n    spouse: Optional[Spouse] = None",
        }}
        howToTitle={"How to convert JSON to Python dataclasses"}
        howTo={[
          "Paste your JSON into \"JSON Input\"; an array of several records gives better types than a single one.",
          "Click \"Convert\" to see the dataclasses in \"Python Output\".",
          "Check renamed fields: keys that clash with Python keywords get a prefix, such as root_class for class.",
          "Click \"Copy\", or \"Download\" for a \"model.py\" file.",
        ]}
        specs={[
          { label: "Input", value: "JSON object, or array of objects; an array of plain values such as [1, 2] gives an empty output" },
          { label: "Output", value: "Python dataclasses with typing annotations, saved as model.py" },
          { label: "Names", value: "snake_case fields; a top-level array gives a class named RootElement" },
          { label: "Python version", value: "3.7 or later (dataclasses module)" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"The dataclasses are produced locally, in your browser, by the quicktype engine that loads on your first conversion; your JSON is not transmitted to us. If the tool displays an error, the message text is reported to our error log with the tool's name and your browser and its version, after quoted parts, long numbers and addresses are stripped from it."}
        faqs={[
          { q: "Does it create a dict with my data?", a: "No. It writes dataclass definitions that describe the data. To get a dict with your values, use json.loads on the text; to fill a dataclass, pass the matching values to its constructor." },
          { q: "How are optional and null fields typed?", a: "Optional[T] = None, when a key is missing from some array elements or null in some of them. A key that is null in every element has nothing to infer from and is typed None, so give it a real value in the sample if you want a type." },
          { q: "Does it generate Pydantic models?", a: "No. The output uses the standard dataclasses module only. Because the annotations are ordinary typing hints, you can turn a class into a Pydantic model by replacing @dataclass with a BaseModel subclass." },
          { q: "Are whole numbers and decimals kept apart?", a: "Yes. Whole numbers are typed int, and numbers written with a decimal point or an exponent are typed float, even 10.0, so a later value such as 10.5 still matches the annotation." },
        ]}
        tips={[
          "Rename RootElement or Root to a name that describes your records before you use the classes.",
        ]}
      />
    </div>
  );
}