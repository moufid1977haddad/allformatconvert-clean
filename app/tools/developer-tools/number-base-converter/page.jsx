'use client';
import { useState } from 'react';
export default function NumberBaseConverterDevPage() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const convert = (base) => { try { const d = parseInt(value, parseInt(fromBase)); return isNaN(d) ? 'Invalid' : d.toString(parseInt(base)).toUpperCase(); } catch { return 'Invalid'; } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between binary, decimal, octal and hex</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Value</label><input type="text" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="Enter value..." /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">From Base</label><select value={fromBase} onChange={e => setFromBase(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option value="2">Binary</option><option value="8">Octal</option><option value="10">Decimal</option><option value="16">Hexadecimal</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['2','Binary'],['8','Octal'],['10','Decimal'],['16','Hexadecimal']].map(([base,label]) => <div key={base} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-1">{label}</div><div className="font-mono text-indigo-400 text-lg font-bold">{value ? convert(base) : '—'}</div></div>)}
          </div>
        </div>
      </div>
    </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Number Base Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Number Base Converter tool. No signup required, no watermark, works on all devices.</p>
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