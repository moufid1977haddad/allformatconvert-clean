'use client';
import { useState } from 'react';
export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const generate = () => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) return;
    setPassword(Array.from({length}, () => chars[Math.floor(Math.random() * chars.length)]).join(''));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Password Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate secure passwords</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Length: {length}</label><input type="range" min="8" max="64" value={length} onChange={e => setLength(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[['Uppercase', upper, setUpper],['Lowercase', lower, setLower],['Numbers', numbers, setNumbers],['Symbols', symbols, setSymbols]].map(([label, val, set]) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer bg-neutral-50 rounded-lg border border-neutral-200 p-3"><input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-4 h-4" /><span>{label}</span></label>
            ))}
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate Password</button>
          {password && <div className="space-y-2"><div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 font-mono text-center break-all text-indigo-400">{password}</div><button onClick={() => navigator.clipboard.writeText(password)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Password Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Password Generator tool. No signup required, no watermark, works on all devices.</p>
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