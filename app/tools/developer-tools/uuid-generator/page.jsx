'use client';
import { useState } from 'react';
export default function UuidGeneratorPage() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(1);
  const generate = () => {
    const newUuids = Array.from({length: count}, () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }));
    setUuids(newUuids);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">UUID Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate unique UUIDs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Count</label><input type="number" min="1" max="20" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate</button>
          {uuids.length > 0 && <div className="space-y-2">{uuids.map((u,i) => <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="font-mono text-sm">{u}</span><button onClick={() => navigator.clipboard.writeText(u)} className="text-xs text-neutral-500 hover:text-white ml-2">Copy</button></div>)}</div>}
        </div>
      </div>
    </div>
  );
}