'use client';
import { useState } from 'react';

export default function PercentageCalculatorPage() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Percentage Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Calculate percentages easily</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">What is X% of Y?</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a} onChange={e => setA(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X %" />
              <input type="number" value={b} onChange={e => setB(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a && b ? `${(parseFloat(a) * parseFloat(b) / 100).toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">X is what % of Y?</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a} onChange={e => setA(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X" />
              <input type="number" value={b} onChange={e => setB(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a && b ? `${(parseFloat(a) / parseFloat(b) * 100).toFixed(2)}%` : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">Percentage change from X to Y</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a} onChange={e => setA(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="From X" />
              <input type="number" value={b} onChange={e => setB(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="To Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a && b ? `${((parseFloat(b) - parseFloat(a)) / parseFloat(a) * 100).toFixed(2)}%` : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Percentage Calculator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Percentage Calculator tool. No signup required, no watermark, works on all devices.</p>
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