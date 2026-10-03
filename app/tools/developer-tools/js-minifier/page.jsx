'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { minifyJs } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function JsMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const minify = async () => {
    try { setOutput(await minifyJs(input)); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JS Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Minified Output</label><TextArea aria-label="Minified Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="minified.js" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
      <SeoContent
        title={"JS Minifier"}
        description={"JS Minifier compresses JavaScript with Terser, the minifier used by webpack, Vite and most JavaScript minification sites, entirely in your browser. It parses your code first, so the result behaves exactly like the original: automatic semicolon insertion, return statements, regular expressions, template literals and operators such as a - -b are handled correctly, variable names inside functions are shortened, and dead code is removed. Code that doesn't parse is reported with the error position instead of producing a broken file."}
        howTo={[
          "Paste your JavaScript into the input box.",
          "Click 'Minify'.",
          "If the code has a syntax error, the message shows where; fix it and minify again.",
          "Click 'Copy' to copy the minified code."
        ]}
        faqs={[
          { q: "Is JS Minifier free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will minified code behave the same?", a: "Yes — Terser parses the code and only applies transformations that keep its behaviour, including code written without semicolons." },
          { q: "Does it rename variables?", a: "Local variables and function parameters are shortened; global names and object properties are kept, so other scripts can still use them." },
          { q: "Does it support modern JavaScript?", a: "Yes — ES2015+ syntax such as classes, arrow functions, async/await, optional chaining and BigInt." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "Minify a copy: keep your original source for editing.",
          "A syntax error is reported instead of producing output — the original minifiers of many sites silently output broken code in that case.",
          "For TypeScript, convert it to JavaScript first with the TypeScript to JS tool."
        ]}
      />
    </div>
  );
}