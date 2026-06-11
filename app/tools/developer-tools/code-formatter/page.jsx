'use client';
import { useState } from 'react';
export default function CodeFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('json');
  const format = () => {
    try {
      let result = input;
      if (lang === 'json') {
        result = JSON.stringify(JSON.parse(input), null, 2);
      } else if (lang === 'css') {
        result = input.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n').trim();
      } else if (lang === 'html') {
        let i = 0;
        result = input.replace(/></g,'>\n<').split('\n').map(l => {
          if (l.match(/^<\//)) i = Math.max(0,i-1);
          const r = '  '.repeat(i) + l.trim();
          if (l.match(/^<[^/][^>]*>$/) && !l.match(/\//)) i++;
          return r;
        }).join('\n');
      }
      setOutput(result);
    } catch(e) { setOutput('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['json','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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