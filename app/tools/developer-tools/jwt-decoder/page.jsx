'use client';
import { useState } from 'react';
export default function JwtDecoderPage() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');
  const decode = () => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('Invalid JWT format');
      const header = JSON.parse(atob(parts[0].replace(/-/g,'+').replace(/_/g,'/')));
      const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
      setDecoded({ header, payload });
      setError('');
    } catch(e) { setError('Invalid JWT token'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JWT Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Decode and inspect JWT tokens</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none font-mono" placeholder="Paste JWT token here..." value={token} onChange={e => setToken(e.target.value)} />
          <button onClick={decode} disabled={!token} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {decoded && ['header','payload'].map(k => <div key={k} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-2 uppercase">{k}</div><pre className="font-mono text-sm text-indigo-400 overflow-x-auto">{JSON.stringify(decoded[k], null, 2)}</pre></div>)}
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Jwt Decoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Jwt Decoder tool. No signup required, no watermark, works on all devices.</p>
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