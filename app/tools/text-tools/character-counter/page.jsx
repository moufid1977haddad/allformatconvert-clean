'use client';
import { useState } from 'react';

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const chars = text.length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const numbers = (text.match(/[0-9]/g) || []).length;
  const spaces = (text.match(/\s/g) || []).length;
  const special = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Character Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count characters in real time</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{chars}</div><div className="text-neutral-400 text-sm mt-1">Total Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{letters}</div><div className="text-neutral-400 text-sm mt-1">Letters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{numbers}</div><div className="text-neutral-400 text-sm mt-1">Numbers</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{spaces}</div><div className="text-neutral-400 text-sm mt-1">Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{special}</div><div className="text-neutral-400 text-sm mt-1">Special</div></div>
          </div>
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Character Counter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Character Counter tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
  );
}