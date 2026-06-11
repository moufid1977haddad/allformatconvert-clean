'use client';
import { useState } from 'react';

export default function TextReverserPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const reverseText = () => setResult(text.split('').reverse().join(''));
  const reverseWords = () => setResult(text.split(' ').reverse().join(' '));
  const reverseLines = () => setResult(text.split('\n').reverse().join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Reverser</h1>
        <p className="text-neutral-500 text-center mb-8">Reverse any text, words or lines</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={reverseText} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Text</button>
            <button onClick={reverseWords} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Words</button>
            <button onClick={reverseLines} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Lines</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}