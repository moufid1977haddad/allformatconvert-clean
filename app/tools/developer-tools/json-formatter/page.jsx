'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reformatJson, jsonErrorPosition, sortJsonKeys } from '../../../lib/jsonText';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  // Re-indents the original text (app/lib/jsonText.js) instead of JSON.stringify(JSON.parse(...)),
  // which silently turned 12345678901234567890 into 12345678901234567000 and 1.10 into 1.1.
  // P24 (03/10): indentation choice, keys sorted, and the error's line / column with the line shown (jsonformatter.org)
  const [indent, setIndent] = useState('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [where, setWhere] = useState(null);
  const run = async (ind) => {
    try {
      const src = sortKeys ? await sortJsonKeys(input) : input;
      setOutput(reformatJson(src, ind)); setError(''); setWhere(null);
    } catch (e) {
      setOutput('');
      const pos = jsonErrorPosition(input);
      setWhere(pos ? { ...pos, text: input.split('\n')[pos.line - 1] } : null);
      setError('Invalid JSON' + (pos ? ` at line ${pos.line}, column ${pos.column}` : '') + (e?.message ? ': ' + e.message : ''));
    }
  };
  const format = () => run(indent === 'tab' ? '\t' : Number(indent));
  const minify = () => run(0);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and validate JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.json" /></div>
          </div>
          {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}
          {where && where.text !== undefined && <pre aria-label="Error location" className="text-xs bg-red-50 border border-red-200 rounded-lg p-2 overflow-x-auto">{where.text.slice(Math.max(0, where.column - 60), where.column + 60)}{'\n'}{' '.repeat(Math.min(where.column - 1, 60))}^</pre>}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2"><span className="text-neutral-500">Indent</span><select id="jf-indent" value={indent} onChange={e => setIndent(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-1"><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tab</option></select></label>
            <label className="flex items-center gap-2"><input id="jf-sort" type="checkbox" checked={sortKeys} onChange={e => setSortKeys(e.target.checked)} /> Sort keys A-Z</label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON Formatter"
        description={"JSON Formatter checks your JSON with the browser's JSON.parse, then re-indents the text you pasted instead of rebuilding it from parsed values. That is why 20-digit ids and 1.10 stay exactly as written, and so do escapes unless you sort the keys. Choose 2 spaces, 4 spaces or a tab, tick Sort keys A-Z to order the keys of every object at every depth, or use Minify for a single line. Invalid JSON is reported with its line and column, and the faulty line is shown with a caret under the problem. There is no tree view and no syntax coloring. Validation and re-indenting run in your browser."}
        example={{
          caption: "Format with 2 spaces: the 20-digit id and 1.10 are copied, not recalculated.",
          inputLabel: "Input",
          input: "{\"id\":12345678901234567890,\"price\":1.10,\"tags\":[\"a\",\"b\"],\"meta\":{}}",
          outputLabel: "Output",
          output: "{\n  \"id\": 12345678901234567890,\n  \"price\": 1.10,\n  \"tags\": [\n    \"a\",\n    \"b\"\n  ],\n  \"meta\": {}\n}",
        }}
        howToTitle={"How to format and validate JSON"}
        howTo={[
          "Paste JSON into \"Input\".",
          "Choose \"2 spaces\", \"4 spaces\" or \"Tab\" under Indent, and tick \"Sort keys A-Z\" if you want ordered keys.",
          "Click \"Format\", or \"Minify\" for a single line.",
          "If the JSON is invalid, read the red line under the boxes: it gives the line and column, and the block below marks the spot with ^.",
          "Click \"Copy\", or \"Download\" to save \"formatted.json\".",
        ]}
        specs={[
          { label: "Input", value: "JSON text, pasted" },
          { label: "Output", value: "Indented or one-line JSON, saved as formatted.json" },
          { label: "Indent", value: "2 spaces, 4 spaces or a tab" },
          { label: "Sort keys A-Z", value: "Every object at every depth, by character code (capitals first); numbers kept, strings re-escaped" },
          { label: "Length", value: "The code sets no maximum; above 1,000,000 characters the boxes show only the first 20,000 characters" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"JSON.parse and the re-indenter are part of the page, so formatting and validation take place in your browser and your JSON is not uploaded. If an Invalid JSON message is displayed, that message, with the quoted part of your JSON, long numbers and addresses removed, is reported to our error log, together with the tool name and your browser's name and version."}
        faqs={[
          { q: "Does it show where my JSON is invalid?", a: "Yes. Click \"Format\" and the message gives the line and column of the first error, while the box below shows that line with a caret under the problem. Trailing commas, single quotes and unquoted keys are the usual causes." },
          { q: "Will formatting change my numbers?", a: "No. The output is built from your original text, so 12345678901234567890 and 1.10 are copied as typed, whereas re-serializing would print 12345678901234567000 and 1.1. With Sort keys A-Z, numbers stay exact but escapes such as \\u00e9 are rewritten as the character." },
          { q: "Does Sort keys A-Z ignore case?", a: "No. Keys are ordered by character code at every depth, so capitals come first: B sorts before a. If a key appears twice in one object, only its last value is kept. Arrays keep their original order." },
          { q: "Is there a tree view?", a: "No. The output is plain text in a box, with no collapsible tree and no colors. The indentation, and the caret shown for an error, are the only guides." },
        ]}
        tips={[
          "A JSON file that starts with a byte order mark is rejected here as invalid; JSON Minifier and Code Formatter remove that mark first.",
        ]}
      />
    </div>
  );
}