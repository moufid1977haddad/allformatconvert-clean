'use client';
import { useState } from 'react';
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
    </div>
  );
}