'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { beautify, minifyCss } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';

export default function CssFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = async () => {
    try { setOutput(await beautify(input, 'css')); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  const minify = async () => {
    try { setOutput(await minifyCss(input)); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSS Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify CSS</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.css" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"CSS Formatter"}
        description={"CSS Formatter beautifies CSS with js-beautify (the engine of beautifier.io) and minifies it with CSSO, entirely in your browser. Both understand CSS syntax rather than replacing characters: strings, comments, data: URLs such as url(data:image/png;base64,…) and at-rules like @media keep their meaning. Minifying also merges identical rules and shortens colors and values when that is safe."}
        howTo={[
          "Paste your CSS into the input box.",
          "Click 'Format' for readable CSS or 'Minify' for the smallest equivalent CSS.",
          "Review the result.",
          "Click 'Copy' to copy it."
        ]}
        faqs={[
          { q: "Is CSS Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can formatting or minifying break my CSS?", a: "No — both parse the CSS first; semicolons or braces inside strings and URLs are never treated as syntax." },
          { q: "What does minifying remove?", a: "Comments, whitespace, redundant semicolons and zeros; CSSO also merges duplicate rules and shortens values when the result is equivalent." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "Format third-party minified CSS to read or debug it.",
          "Keep your formatted source and publish the minified version."
        ]}
      />
    </div>
  );
}