'use client';
import { useState } from 'react';

export default function CaseConverterPage() {
  const [text, setText] = useState('');
  const toUpper = () => setText(text.toUpperCase());
  const toLower = () => setText(text.toLowerCase());
  const toTitle = () => setText(text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()));
  const toSentence = () => setText(text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
  const toAlternate = () => setText(text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Case Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to any case format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={toUpper} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">UPPERCASE</button>
            <button onClick={toLower} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">lowercase</button>
            <button onClick={toTitle} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Title Case</button>
            <button onClick={toSentence} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sentence case</button>
            <button onClick={toAlternate} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">aLtErNaTe</button>
            <button onClick={() => setText('')} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
          </div>
          <button onClick={() => navigator.clipboard.writeText(text)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
        </div>
      </div>
    </div>
  );
}