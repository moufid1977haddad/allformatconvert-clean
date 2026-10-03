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
        description="JSON Formatter checks your JSON with the browser's built-in JSON.parse, then re-indents your original text without re-serializing it — so large numbers like 64-bit IDs, trailing zeros (1.10) and escapes stay exactly as you wrote them — entirely in your browser — nothing is uploaded to a server. Format adds 2-space indentation; Minify strips it back to a single line. Since it uses a real parser, invalid JSON is reliably caught and reported rather than guessed at."
        howTo={[
          "Paste your JSON into the input box.",
          "Choose the indent (2 spaces, 4 spaces or a tab) and whether to sort the keys A-Z, then click 'Format' for readable JSON, or 'Minify' for a compact single-line version.",
          "If the JSON is invalid, the error names its line and column and shows that line with a caret under the problem.",
          "If the JSON is invalid, an 'Invalid JSON' error appears instead of output.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it validate my JSON?", a: "Yes — since it uses the browser's real JSON parser, any syntax error causes a clear 'Invalid JSON' message rather than a best-effort guess." },
          { q: "Can it sort keys or use tabs?", a: "Yes — tick 'Sort keys A-Z' (every object, at every depth; numbers are still written exactly as in your JSON) and choose 2 spaces, 4 spaces or a tab." },
          { q: "Does it support a tree view or syntax highlighting?", a: "No, output is plain indented or minified text in a textarea — there's no collapsible tree view or colored syntax highlighting." },
          { q: "Is my data uploaded to a server?", a: "No, formatting and minifying both happen entirely in your browser." }
        ]}
        tips={[
          "If you get 'Invalid JSON', check for common issues like trailing commas, single quotes instead of double quotes, or unquoted keys — none of which are valid JSON.",
          "Format and Minify are reversible: format minified JSON to read it, or minify formatted JSON to compact it back down.",
          "There's no file upload or download — paste JSON in and copy the result out.",
          "For very large JSON, formatting and minifying both run synchronously in your browser, so extremely large input may briefly freeze the page."
        ]}
      />
    </div>
  );
}