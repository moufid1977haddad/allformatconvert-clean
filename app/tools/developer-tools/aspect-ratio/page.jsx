'use client';
import { useState } from 'react';
export default function AspectRatioPage() {
  const [w, setW] = useState('1920');
  const [h, setH] = useState('1080');
  const gcd = (a,b) => b === 0 ? a : gcd(b, a%b);
  const g = gcd(parseInt(w)||1, parseInt(h)||1);
  const ratio = `${(parseInt(w)||1)/g}:${(parseInt(h)||1)/g}`;
  const decimal = ((parseInt(w)||1)/(parseInt(h)||1)).toFixed(4);
  const presets = [['16:9','1920x1080'],['4:3','1024x768'],['1:1','1080x1080'],['21:9','2560x1080'],['9:16','1080x1920']];
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Aspect Ratio Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Calculate aspect ratios for any dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width</label><input type="number" value={w} onChange={e => setW(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height</label><input type="number" value={h} onChange={e => setH(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-2">
            <div className="text-4xl font-bold text-indigo-400">{ratio}</div>
            <div className="text-neutral-500">Decimal: {decimal}</div>
          </div>
          <div><label className="block text-sm text-neutral-500 mb-2">Common Presets</label><div className="grid grid-cols-3 gap-2">{presets.map(([r,d]) => <button key={r} onClick={() => { const [pw,ph] = d.split('x'); setW(pw); setH(ph); }} className="bg-neutral-800 hover:bg-neutral-100 rounded-lg p-2 text-sm transition"><div className="font-semibold">{r}</div><div className="text-neutral-500 text-xs">{d}</div></button>)}</div></div>
        </div>
      </div>
    </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Aspect Ratio</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Aspect Ratio tool. No signup required, no watermark, works on all devices.</p>
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