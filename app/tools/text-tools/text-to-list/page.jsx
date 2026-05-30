'use client';
import { useState } from 'react';

export default function TextToListPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const toBullet = () => setResult(text.split('\n').filter(l => l.trim()).map(l => '• ' + l.trim()).join('\n'));
  const toNumbered = () => setResult(text.split('\n').filter(l => l.trim()).map((l, i) => (i+1) + '. ' + l.trim()).join('\n'));
  const toComma = () => setResult(text.split('\n').filter(l => l.trim()).join(', '));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text to List</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to different list formats</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toBullet} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Bullet List</button>
            <button onClick={toNumbered} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Numbered List</button>
            <button onClick={toComma} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Comma List</button>
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