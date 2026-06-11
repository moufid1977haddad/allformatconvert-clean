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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Statistics Calculator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Statistics Calculator is a free online tool designed to help you quickly compute essential statistical measures including mean, median, mode, standard deviation, and variance from any dataset. Whether you're a student, researcher, or data analyst, this calculator simplifies complex statistical computations with an intuitive interface and instant results.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Statistics Calculator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your numerical data points into the input field, separating each value with a comma or space</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select which statistical measures you want to calculate from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Calculate' button to process your data and generate results</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>View your results instantly and download or share the calculations as needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What statistical measures can this calculator compute?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The Statistics Calculator can compute mean, median, mode, standard deviation, variance, range, and quartiles for your datasets.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to how many data points I can enter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, the calculator can handle datasets of any size, making it suitable for both small and large statistical analyses.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use decimal numbers and negative values?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the calculator supports both decimal numbers and negative values for accurate statistical calculations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data saved or stored when I use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all calculations are performed locally in your browser and no data is stored or transmitted to external servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the clear button to reset your data quickly if you need to perform calculations on a new dataset</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the results directly from the output fields to paste them into documents or spreadsheets</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For large datasets, paste data from Excel or CSV files directly into the input field</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Double-check your data entry by reviewing the count of data points shown in the results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}