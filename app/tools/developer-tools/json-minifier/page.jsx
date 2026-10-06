'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reformatJson } from '../../../lib/jsonText';
import { stripBom } from '../../../lib/jsonLossless';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const minify = () => { try { setOutput(reformatJson(stripBom(input), 0)); setError(''); } catch(e) { setError('Invalid JSON: ' + e.message); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JSON data</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Minified Output</label><TextArea aria-label="Minified Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="minified.json" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters ({Math.round((1 - output.length/input.length)*100)}%)</p>}
        </div>
      </div>
      <SeoContent
        title="JSON Minifier"
        description={"JSON Minifier removes every space, tab and line break outside strings and puts your JSON on one line. It validates the text with the browser's JSON.parse first, then copies your original characters, so values are never re-serialized: a 20-digit id, 1.10, 1e21 and escapes stay exactly as written, and spaces inside strings are kept. A byte order mark at the start is removed. The line under the result gives the characters saved and the percentage. The page has no option to sort keys or change values, and it does its work in your browser."}
        example={{
          caption: "Formatted JSON on five lines becomes one; the two spaces inside the string stay.",
          inputLabel: "Input",
          input: "{\n  \"id\": 12345678901234567890,\n  \"total\": 1e21,\n  \"name\": \"a  b\"\n}",
          outputLabel: "Minified Output",
          output: "{\"id\":12345678901234567890,\"total\":1e21,\"name\":\"a  b\"}",
        }}
        howToTitle={"How to minify JSON"}
        howTo={[
          "Paste formatted JSON into \"Input\".",
          "Click \"Minify\".",
          "Take the single line from \"Minified Output\"; the line below it says how many characters were saved.",
          "Click \"Copy\", or \"Download\" to save \"minified.json\".",
        ]}
        specs={[
          { label: "Input", value: "JSON text; a leading byte order mark is removed" },
          { label: "Output", value: "One-line JSON, saved as minified.json" },
          { label: "Kept as written", value: "Every key, value, number and escape, and the spaces inside strings" },
          { label: "Saving shown", value: "Characters saved and the percentage, counted in characters rather than bytes" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"Minification is a few lines of JavaScript in this page: your JSON is read and rewritten in the browser and never uploaded. When the page displays an error, Invalid JSON followed by the browser's reason, that message is reported to our error log with the tool name and your browser's name and version, cleaned of quoted passages, long numbers and addresses."}
        faqs={[
          { q: "Will minifying change my data?", a: "No. Only whitespace outside strings is removed. Keys, values, numbers and escapes are copied character for character, so large ids are not rounded, and two spaces inside a string value stay two spaces." },
          { q: "Does it tell me when the JSON is invalid?", a: "Yes. A red Invalid JSON message with the browser's explanation appears and nothing new is produced. A result from an earlier run stays in the output box, so read the message before copying." },
          { q: "Does it also sort or clean my JSON?", a: "No. It keeps key order, duplicate keys and values as they are. To sort keys or pick an indentation, use JSON Formatter, which offers sorting and three indent choices." },
        ]}
      />
    </div>
  );
}