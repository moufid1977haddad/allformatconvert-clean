'use client';
import { useState } from 'react';

export default function WhitespaceRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const removeAll = () => setResult(text.replace(/\s+/g, ' ').trim());
  const removeExtra = () => setResult(text.replace(/[ \t]+/g, ' ').trim());
  const removeLeading = () => setResult(text.split('\n').map(l => l.trimStart()).join('\n'));
  const removeTrailing = () => setResult(text.split('\n').map(l => l.trimEnd()).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Whitespace Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove extra spaces from text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={removeAll} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove All Extra</button>
            <button onClick={removeExtra} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Extra Spaces</button>
            <button onClick={removeLeading} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Leading</button>
            <button onClick={removeTrailing} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Trailing</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}