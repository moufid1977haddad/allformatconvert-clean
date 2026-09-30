'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reformatJson } from '../../../lib/jsonText';
import { stripBom } from '../../../lib/jsonLossless';
export default function JsonMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const minify = () => { try { setOutput(reformatJson(stripBom(input), 0)); setError(''); } catch(e) { setError('Invalid JSON: ' + e.message); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JSON data</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Minified Output</label><textarea aria-label="Minified Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters ({Math.round((1 - output.length/input.length)*100)}%)</p>}
        </div>
      </div>
      <SeoContent
        title="JSON Minifier"
        description="JSON Minifier validates your JSON with the browser's built-in JSON.parse, then removes every space and line break outside strings from your original text, entirely in your browser — nothing is uploaded to a server. Because it works on the text you pasted rather than re-serializing it, nothing else changes: a 20-digit id, 1.10 or 1e21 stay exactly as written (re-serializing through JSON.stringify would round them). Invalid JSON is reported with the parser's own message instead of silently producing broken output."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Minify' to compress it to a single line.",
          "Review the result and the size-reduction percentage shown below.",
          "Click 'Copy' to copy the minified JSON to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON Minifier free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will minifying change my data?", a: "No — only whitespace and indentation outside strings are removed; every key, value, number and escape stays exactly as you wrote it (large ids and numbers like 1.10 are not rounded)." },
          { q: "What happens if my JSON is invalid?", a: "You'll see 'Invalid JSON' with the parser's own explanation instead of output, since the tool relies on the browser's real JSON parser rather than a best-effort text strip." },
          { q: "Is my data uploaded to a server?", a: "No, minifying happens entirely in your browser." }
        ]}
        tips={[
          "The percentage shown reflects real character-count savings for your specific JSON — heavily indented JSON with long key names shrinks the most.",
          "Keep your original formatted JSON for debugging; use the minified version for production or network transfer.",
          "If minifying fails with 'Invalid JSON,' check for trailing commas or unquoted keys, which JSON doesn't allow.",
          "There's no file upload or download — paste JSON in and copy the minified result out."
        ]}
      />
    </div>
  );
}