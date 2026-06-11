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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Percentage Calculator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">The Percentage Calculator is a free online tool that helps you quickly calculate percentages, percentage changes, and percentage differences without any hassle. Whether you need to find what percentage one number is of another or calculate discounts and tips, this calculator provides accurate results instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Percentage Calculator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter the first number in the 'Number' field to start your calculation</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Input the percentage value in the 'Percentage' field or choose your calculation type</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select the type of calculation you need (percentage of a number, percentage change, or percentage difference)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Calculate' button to get your instant result displayed on the screen</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Percentage Calculator free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Percentage Calculator is completely free to use with no hidden fees, subscriptions, or registration required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use this calculator on my mobile device?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, the Percentage Calculator is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How accurate are the calculations?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The calculator uses standard mathematical formulas and provides highly accurate results up to multiple decimal places for all percentage calculations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of percentage calculations can I perform?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can calculate percentage of a number, percentage increase or decrease, percentage difference, and reverse percentage calculations.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the Percentage Calculator to quickly compute discounts while shopping to see your actual savings in real-time</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Calculate tip amounts at restaurants by entering the bill total and desired tip percentage for accurate results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Track percentage changes in your investments or savings by using the percentage change feature regularly</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save time on homework and work projects by using this tool instead of manually calculating percentages with pen and paper</li>
          </ul>
        </div>
      </div>
    </div>
  );
}