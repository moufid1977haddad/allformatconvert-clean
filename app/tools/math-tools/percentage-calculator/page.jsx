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
  );
}