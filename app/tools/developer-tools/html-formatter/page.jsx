'use client';
import { useState } from 'react';
export default function HtmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let indent = 0;
    const lines = input.replace(/></g,'>\n<').split('\n');
    const formatted = lines.map(line => {
      if (line.match(/^<\//)) indent--;
      const result = '  '.repeat(Math.max(0,indent)) + line.trim();
      if (line.match(/^<[^/][^>]*[^/]>/) && !line.match(/^<(br|hr|img|input|link|meta)/i)) indent++;
      return result;
    });
    setOutput(formatted.join('\n'));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}