'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { typescriptToJs } from '../../../lib/codeTools';

export default function TypescriptToJsPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = async () => {
    try { setOutput(await typescriptToJs(input, { jsx: /<\/?[A-Za-z][^>]*>/.test(input) && /return\s*\(?\s*</.test(input) })); } catch (e) { setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TypeScript to JavaScript</h1>
        <p className="text-neutral-500 text-center mb-8">Strip TypeScript types from code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TypeScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JavaScript Output</label><textarea aria-label="JavaScript Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"TypeScript to JavaScript"}
        description={"TypeScript to JS removes TypeScript syntax and keeps your JavaScript, entirely in your browser, using Sucrase's TypeScript transform (the same type-stripping approach as the TypeScript compiler and Babel). It parses the code, so type annotations, interfaces, type aliases, generics, access modifiers, non-null assertions and satisfies/as casts are removed without touching object literals, ternaries or arrow functions; enums become plain JavaScript objects. Modern JavaScript syntax is kept as is. Code that doesn't parse is reported with the error position."}
        howTo={[
          "Paste your TypeScript into the input box.",
          "Click 'Convert'.",
          "Review the JavaScript output.",
          "Click 'Copy' to copy it."
        ]}
        faqs={[
          { q: "Is TypeScript to JavaScript free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it type-check my code?", a: "No — like Babel and esbuild, it removes types without checking them; use tsc for type errors." },
          { q: "What happens to enums and namespaces?", a: "Enums are converted to the equivalent JavaScript object; everything else that only exists for the type system is removed." },
          { q: "Does it support TSX?", a: "Yes — JSX in the file is kept as JSX." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "The output keeps your formatting and comments, so it stays readable.",
          "import type statements disappear, since they only exist for the type checker."
        ]}
      />
    </div>
  );
}