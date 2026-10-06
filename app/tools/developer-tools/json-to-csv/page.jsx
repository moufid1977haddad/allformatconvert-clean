'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

import { jsonToCsv } from '../../../lib/jsonToCsv';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function JsonToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = () => {
    try {
      setOutput(jsonToCsv(input));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to CSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='[{"name":"John","age":30}]' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><TextArea aria-label="CSV Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.csv" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to CSV"
        description={"JSON to CSV turns pasted JSON into comma-separated text with a header row. It takes an array of objects, a single object (one row) or an array of plain values (one value column). Every key seen in any object becomes a column, in first-seen order (keys that are whole numbers, such as 10, come first); nested objects are flattened to dotted names and arrays to numbered ones. Numbers are copied exactly as written, so a 20-digit ID is not rounded. Values with a comma, a quote, a line break or spaces at either end are quoted. The JSON is read and the CSV written inside your browser tab."}
        example={{"caption":"Two objects with different keys, a nested address and a tags array, and the CSV the tool returns:","inputLabel":"JSON","input":"[\n  {\"id\": 12345678901234567890, \"name\": \"Ann\", \"address\": {\"city\": \"Paris\"}, \"tags\": [\"a\", \"b\"]},\n  {\"id\": 2, \"name\": \"Lee, Bo\", \"email\": null}\n]","outputLabel":"CSV","output":"id,name,address.city,tags.0,tags.1,email\n12345678901234567890,Ann,Paris,a,b,\n2,\"Lee, Bo\",,,,"}}
        howToTitle="How to convert JSON to CSV"
        howTo={[
          "Paste your JSON into \"JSON Input\".",
          "Click \"Convert\".",
          "Check the header row and the columns in \"CSV Output\".",
          "Take the result with \"Copy\", or keep it as data.csv with \"Download\".",
        ]}
        specs={[
          { label: "Input", value: "JSON text: an array of objects, one object, or an array of values" },
          { label: "Output", value: "comma-separated text with a header row, saved as data.csv" },
          { label: "Missing keys and null", value: "empty cell" },
        ]}
        privacy={"The JSON is parsed and the CSV built in your browser when you click \"Convert\"; the text you paste is not uploaded. If an error occurs, such as invalid JSON, we receive its message with quoted text masked, plus the tool name and your browser and version."}
        faqs={[
          { q: "Can it flatten nested JSON?", a: "Yes. An address object with a city key becomes the column address.city, and a tags array becomes tags.0, tags.1 and so on, at any depth. An empty object or array is written as {} or [] so its column is not lost." },
          { q: "Is it a problem if objects have different keys?", a: "No. The columns are the union of all keys, in the order they first appear (whole-number keys first), and a row without a key gets an empty cell there. A null value also gives an empty cell, and true and false are written as words." },
          { q: "Can I convert a single JSON string or number?", a: "No. The top level must be an array or an object; otherwise the tool answers that the JSON must be an array of objects, or a single object. An empty array is refused too, since it has no row to write." },
          { q: "Can I choose another separator than the comma?", a: "No. The output always uses commas, with the header first and one row per line; a value holding a line break stays quoted over several lines. If you need tabs instead, copy the result and paste it into CSV to TSV, which detects the comma and writes tab-separated text." },
        ]}
        tips={[
          "To build JSON from a CSV file, use CSV to JSON, which can also type numeric columns.",
        ]}
      />
    </div>
  );
}