'use client';
import { useState } from 'react';
export default function DiffViewerPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diff, setDiff] = useState(null);
  const compare = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      const l1 = i < lines1.length ? lines1[i] : null;
      const l2 = i < lines2.length ? lines2[i] : null;
      if (l1 === l2) result.push({ type: 'same', line: l1, num: i+1 });
      else {
        if (l1 !== null) result.push({ type: 'removed', line: l1, num: i+1 });
        if (l2 !== null) result.push({ type: 'added', line: l2, num: i+1 });
      }
    }
    setDiff(result);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Diff Viewer</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two texts and highlight differences</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Original</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Original text..." value={text1} onChange={e => setText1(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Modified</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Modified text..." value={text2} onChange={e => setText2(e.target.value)} /></div>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compare</button>
          {diff && (
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {diff.map((d, i) => (
                <div key={i} className={"px-3 py-1 rounded flex gap-3 " + (d.type==='removed'?'bg-red-900/30 text-red-400':d.type==='added'?'bg-green-900/30 text-green-400':'bg-neutral-800 text-neutral-500')}>
                  <span className="text-neutral-600 w-6">{d.num}</span>
                  <span>{d.type==='removed'?'- ':d.type==='added'?'+ ':'  '}{d.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}