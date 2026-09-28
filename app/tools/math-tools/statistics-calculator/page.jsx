'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseNumberList, statistics, formatStat } from '../../../lib/mathTools';

export default function StatisticsCalculatorPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const [error, setError] = useState('');
  const calculate = () => {
    try { setResult(statistics(parseNumberList(input))); setError(''); }
    catch (e) { setResult(null); setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Statistics Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Mean, median, mode, standard deviation and more</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Enter numbers separated by commas, spaces or new lines</label>
            <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-24 resize-none" placeholder="e.g. 1, 2, 3, 4, 5" value={input} onChange={e => setInput(e.target.value)} />
          </div>
          <button onClick={calculate} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Calculate</button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {result && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Count', result.count],
                ['Sum', formatStat(result.sum)],
                ['Mean', formatStat(result.mean)],
                ['Median', formatStat(result.median)],
                ['Mode', result.mode.length ? result.mode.map(formatStat).join(', ') : 'None (no value repeats)'],
                ['Range', formatStat(result.range)],
                ['Sample std dev (s)', formatStat(result.sampleStdDev)],
                ['Population std dev (σ)', formatStat(result.populationStdDev)],
                ['Sample variance (s²)', formatStat(result.sampleVariance)],
                ['Population variance (σ²)', formatStat(result.populationVariance)],
                ['Q1', formatStat(result.q1)],
                ['Q3', formatStat(result.q3)],
                ['Min', formatStat(result.min)],
                ['Max', formatStat(result.max)],
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
      <SeoContent
        title={"Statistics Calculator"}
        description={"Statistics Calculator computes count, sum, mean, median, mode, range, quartiles, and both sample and population standard deviation and variance for a list of numbers, entirely in your browser. Values can be separated by commas, spaces, tabs or new lines (paste a spreadsheet column directly); any entry that isn't a number is listed instead of being silently skipped or partly read. Results are shown to 12 significant digits, so small values are never rounded to 0."}
        howTo={[
          "Paste or type your numbers, separated by commas, spaces or new lines.",
          "Click 'Calculate'.",
          "Read every statistic in the grid; use the sample standard deviation for a sample of a larger population, the population one when you have every value.",
          "Fix any value reported as 'Not a number' and calculate again."
        ]}
        faqs={[
          { q: "Is Statistics Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Sample or population standard deviation?", a: "Both are shown. The sample SD (divides by n − 1) estimates the spread of a larger population from a sample; the population SD (divides by n) describes exactly the values you entered." },
          { q: "What if no value repeats?", a: "The mode is reported as 'None' instead of listing every value." },
          { q: "How are quartiles calculated?", a: "With the inclusive method used by Excel's QUARTILE.INC." },
          { q: "Is my data uploaded?", a: "No — all calculations happen in your browser." }
        ]}
        tips={[
          "Numbers with a comma as thousands separator (1,000) are read as two values — remove the separator first.",
          "Use a dot for decimals: 2.5, not 2,5."
        ]}
      />
    </div>
  );
}