'use client';
import { useState } from 'react';
export default function UnicodeConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toUnicode = () => setOutput(input.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join(''));
  const fromUnicode = () => setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g,(_,code) => String.fromCharCode(parseInt(code,16))));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unicode Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to Unicode escapes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or unicode..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">To Unicode</button>
            <button onClick={fromUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">From Unicode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>
  );
}