'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
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
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Output</label><TextArea aria-label="TypeScript Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"JSON to TypeScript reads a JSON sample and writes the TypeScript interfaces that describe it, using the quicktype-core engine in your browser. Every nested object becomes its own exported interface, and every element of an array is examined: a key that some elements lack gets a question mark, and a value that is sometimes null is typed with null in a union. Keys that are not valid identifiers, such as first-name, are written in quotes. It generates types only: no classes, no runtime checks, and no enums, dates or UUID types guessed from string values."}
        example={{
          caption: "Two array elements: nickname is null in one, team exists only in the second.",
          inputLabel: "JSON Input",
          input: "[{\"id\": 1, \"name\": \"Ada\", \"nickname\": null},\n {\"id\": 2, \"name\": \"Lin\", \"nickname\": \"lin\", \"team\": {\"name\": \"core\", \"size\": 4}}]",
          outputLabel: "TypeScript Output",
          output: "export interface Root {\n    id:       number;\n    name:     string;\n    nickname: null | string;\n    team?:    Team;\n}\n\nexport interface Team {\n    name: string;\n    size: number;\n}",
        }}
        howToTitle={"How to generate TypeScript interfaces from JSON"}
        howTo={[
          "Paste a JSON object, or an array of several representative objects, into \"JSON Input\".",
          "Click \"Convert\"; the engine loads on the first click, then the interfaces fill \"TypeScript Output\".",
          "Check the optional keys and the null unions against the data your code will really receive.",
          "Click \"Copy\", or \"Download\" to save the code as \"types.ts\".",
        ]}
        specs={[
          { label: "Input", value: "JSON text: an object, or an array of objects whose elements are merged; an array of plain values gives an empty output" },
          { label: "Output", value: "Exported TypeScript interfaces, one per nested object, saved as types.ts" },
          { label: "Optional keys", value: "A question mark when a key is missing from some array elements; null in a union when a value is null" },
          { label: "Not generated", value: "Classes, runtime validation, enums, date or UUID types (strings stay string)" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"The interfaces are generated in your browser: the page fetches the quicktype engine on your first click, and your JSON is not uploaded, nor is the TypeScript it produces. If an error message appears, a shortened copy of that message, with quoted text, long numbers and addresses removed, is sent to our error log together with the tool's name and your browser's name and version, so the tool can be fixed."}
        faqs={[
          { q: "Does it detect optional fields?", a: "Yes, when you paste an array. All elements are merged: a key missing from some of them is written with a question mark, and a key that is null in some of them gets null in its type, for example null | string. With a single object, every key it contains is required." },
          { q: "How are nested objects and arrays typed?", a: "Each nested object becomes a separate exported interface named after its key, such as Team for a team key, and an array of objects becomes an array of that interface. Arrays of strings or numbers become string[] or number[]." },
          { q: "What happens to keys with hyphens or spaces?", a: "They keep their exact spelling as quoted property names, which is valid TypeScript, so the interface matches the JSON without any renaming. Keys that are valid identifiers, like nickname, are written without quotes." },
          { q: "Can I save the result as a .ts file?", a: "Yes. After a conversion, a row named types.ts appears under the output with a \"Download\" button; on iPhone and iPad a \"Save / Share\" button is added next to it. \"Copy\" puts the same code on the clipboard." },
        ]}
        tips={[
          "Rename the Root interface after pasting it into your project; the name comes from the tool, not from your data.",
          "If the result is an Invalid JSON message, open the same text in JSON Formatter, which points to the line and column of the mistake.",
        ]}
      />
    </div>
  );
}