'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function TypescriptToJsPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let js = input;
    js = js.replace(/:\s*[\w<>\[\]|&,\s]+(?=[\s]*[=,);{])/g,'');
    js = js.replace(/interface\s+\w+\s*\{[^}]*\}/g,'');
    js = js.replace(/type\s+\w+\s*=\s*[^;]+;/g,'');
    js = js.replace(/<[\w,\s]+>/g,'');
    setOutput(js.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TypeScript to JavaScript</h1>
        <p className="text-neutral-500 text-center mb-8">Strip TypeScript types from code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TypeScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JavaScript Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="TypeScript to JavaScript"
        description="TypeScript to JavaScript strips type annotations using regex pattern matching, not the real TypeScript compiler, entirely in your browser. It handles common cases — simple parameter and variable type annotations, interface declarations, type aliases, and generic angle brackets — but pattern matching can misfire on code that merely resembles a type annotation. Most notably, a ternary expression followed by a comma in the same statement can get corrupted, since the colon looks like a type annotation to the regex."
        howTo={[
          "Paste your TypeScript code into the input box.",
          "Click 'Convert' to strip type annotations, interfaces, and type aliases.",
          "Review the output carefully, especially ternary expressions and generics.",
          "Click 'Copy' to copy the JavaScript result."
        ]}
        faqs={[
          { q: "Is TypeScript to JavaScript free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it use the real TypeScript compiler?", a: "No — it uses regex pattern matching to strip common type syntax, not the actual TypeScript compiler (tsc) or a TypeScript-aware transpiler like Babel." },
          { q: "Can it corrupt valid code?", a: "In specific cases, yes — a ternary expression followed by a comma in the same statement can be misread as a type annotation and stripped incorrectly." },
          { q: "Is my code uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Test the output by running it, especially for code with ternary expressions, generics, or unusual type syntax.",
          "For reliable TypeScript-to-JavaScript conversion, use the actual TypeScript compiler (tsc) or a build tool with TypeScript support instead.",
          "Simple parameter and variable type annotations convert reliably; complex or unusual type syntax is more likely to be mishandled.",
          "Keep your original TypeScript file, since this conversion isn't guaranteed to be correct for all code."
        ]}
      />
    </div>
  );
}