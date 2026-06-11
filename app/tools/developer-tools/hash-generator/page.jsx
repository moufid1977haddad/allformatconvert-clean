'use client';
import { useState } from 'react';
export default function HashGeneratorPage() {
  const [input, setInput] = useState('');
  const [hashes, setHashes] = useState(null);
  const generate = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = async (algo) => { const buf = await crypto.subtle.digest(algo, data); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''); };
    const [sha1, sha256, sha512] = await Promise.all([hashBuffer('SHA-1'), hashBuffer('SHA-256'), hashBuffer('SHA-512')]);
    setHashes({ sha1, sha256, sha512 });
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hash Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate SHA-1, SHA-256, SHA-512 hashes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Enter text to hash..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={generate} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Generate Hashes</button>
          {hashes && ['sha1','sha256','sha512'].map(k => (
            <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
              <div className="text-neutral-500 text-xs mb-1 uppercase">{k}</div>
              <div className="font-mono text-xs break-all text-indigo-400">{hashes[k]}</div>
              <button onClick={() => navigator.clipboard.writeText(hashes[k])} className="text-xs text-neutral-500 hover:text-neutral-300 mt-1">Copy</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}