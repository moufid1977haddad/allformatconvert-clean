'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const format = () => { try { setOutput(JSON.stringify(JSON.parse(input), null, 2)); setError(''); } catch(e) { setError('Invalid JSON'); } };
  const minify = () => { try { setOutput(JSON.stringify(JSON.parse(input))); setError(''); } catch(e) { setError('Invalid JSON'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and validate JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON Formatter"
        description="JSON Formatter parses your JSON with the browser's built-in JSON.parse and re-serializes it with JSON.stringify, entirely in your browser — nothing is uploaded to a server. Format adds 2-space indentation; Minify strips it back to a single line. Since it uses a real parser, invalid JSON is reliably caught and reported rather than guessed at."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Format' for readable, indented JSON, or 'Minify' for a compact single-line version.",
          "If the JSON is invalid, an 'Invalid JSON' error appears instead of output.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it validate my JSON?", a: "Yes — since it uses the browser's real JSON parser, any syntax error causes a clear 'Invalid JSON' message rather than a best-effort guess." },
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