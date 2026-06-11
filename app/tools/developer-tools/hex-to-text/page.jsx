'use client';
import { useState } from 'react';
export default function HexToTextPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toHex = () => setOutput(input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
  const fromHex = () => { try { setOutput(input.replace(/\s/g,'').match(/.{2}/g).map(h => String.fromCharCode(parseInt(h,16))).join('')); } catch(e) { setOutput('Invalid hex'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hex to Text</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between text and hexadecimal</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or hex..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Text to Hex</button>
            <button onClick={fromHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Hex to Text</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Hex To Text</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Hex To Text tool. No signup required, no watermark, works on all devices.</p>
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