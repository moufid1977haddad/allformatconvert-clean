'use client';
import { useState } from 'react';

export default function StatisticsCalculatorPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const numbers = input.split(',').map(n => parseFloat(n.trim())).filter(n => !isNaN(n));
    if (numbers.length === 0) return;
    const sorted = [...numbers].sort((a, b) => a - b);
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / numbers.length;
    const median = sorted.length % 2 === 0 ? (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2 : sorted[Math.floor(sorted.length/2)];
    const freq = {};
    numbers.forEach(n => freq[n] = (freq[n] || 0) + 1);
    const maxFreq = Math.max(...Object.values(freq));
    const mode = Object.keys(freq).filter(k => freq[k] === maxFreq).join(', ');
    const variance = numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    const range = sorted[sorted.length-1] - sorted[0];
    setResult({ count: numbers.length, sum, mean, median, mode, variance, stdDev, range, min: sorted[0], max: sorted[sorted.length-1] });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Statistics Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Mean, median, mode, standard deviation and more</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Enter numbers separated by commas</label>
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-24 resize-none" placeholder="e.g. 1, 2, 3, 4, 5" value={input} onChange={e => setInput(e.target.value)} />
          </div>
          <button onClick={calculate} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Calculate</button>
          {result && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Count', result.count],
                ['Sum', result.sum.toFixed(2)],
                ['Mean', result.mean.toFixed(4)],
                ['Median', result.median.toFixed(4)],
                ['Mode', result.mode],
                ['Std Dev', result.stdDev.toFixed(4)],
                ['Variance', result.variance.toFixed(4)],
                ['Range', result.range.toFixed(4)],
                ['Min', result.min],
                ['Max', result.max],
              ].map(([label, value]) => (
                <div key={label} className="bg-neutral-50 rounded-xl border border-neutral-200 p-3 text-center">
                  <div className="text-neutral-500 text-xs mb-1">{label}</div>
                  <div className="font-bold text-indigo-400">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}