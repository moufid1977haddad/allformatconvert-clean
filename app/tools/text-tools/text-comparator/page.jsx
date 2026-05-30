'use client';
import { useState } from 'react';

export default function TextComparatorPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState(null);

  const compare = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const diff = [];
    for (let i = 0; i < maxLines; i++) {
      const l1 = lines1[i] || '';
      const l2 = lines2[i] || '';
      diff.push({ l1, l2, same: l1 === l2 });
    }
    setResult(diff);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Comparator</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two texts side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 1</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste first text here..." value={text1} onChange={e => setText1(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 2</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste second text here..." value={text2} onChange={e => setText2(e.target.value)} />
            </div>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compare</button>
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500 text-center">{result.filter(r => !r.same).length} difference(s) found</p>
              {result.map((r, i) => (
                <div key={i} className={`grid grid-cols-2 gap-2 p-2 rounded-lg ${r.same ? 'bg-neutral-800' : 'bg-red-900/30'}`}>
                  <div className="text-sm font-mono">{r.l1 || <span className="text-neutral-600">empty</span>}</div>
                  <div className="text-sm font-mono">{r.l2 || <span className="text-neutral-600">empty</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}