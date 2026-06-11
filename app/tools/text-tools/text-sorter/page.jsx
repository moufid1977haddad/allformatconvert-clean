'use client';
import { useState } from 'react';

export default function TextSorterPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const sortAZ = () => setResult(text.split('\n').sort().join('\n'));
  const sortZA = () => setResult(text.split('\n').sort().reverse().join('\n'));
  const sortByLength = () => setResult(text.split('\n').sort((a, b) => a.length - b.length).join('\n'));
  const shuffle = () => setResult(text.split('\n').sort(() => Math.random() - 0.5).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Sorter</h1>
        <p className="text-neutral-500 text-center mb-8">Sort lines alphabetically or by length</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={sortAZ} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sort A-Z</button>
            <button onClick={sortZA} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sort Z-A</button>
            <button onClick={sortByLength} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sort by Length</button>
            <button onClick={shuffle} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Shuffle</button>
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