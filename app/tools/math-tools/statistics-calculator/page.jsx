'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseNumberList, statistics, formatStat } from '../../../lib/mathTools';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function StatisticsCalculatorPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);

  const [error, setError] = useToolError('');
  const [method, setMethod] = useState('inclusive');
  const calculate = (m = method) => {
    try { setResult(statistics(parseNumberList(input), { quartiles: m })); setError(''); }
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
            <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-24 resize-none" placeholder="e.g. 1, 2, 3, 4, 5" value={input} onChange={e => setInput(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label htmlFor="st-quartiles" className="text-neutral-600">Quartile method</label>
            <select id="st-quartiles" value={method} onChange={(e) => { setMethod(e.target.value); if (result) calculate(e.target.value); }} className="bg-neutral-50 border border-neutral-200 rounded-lg p-2">
              <option value="inclusive">Inclusive — Excel QUARTILE.INC, calculator.net</option>
              <option value="exclusive">Exclusive — Excel QUARTILE.EXC, Minitab, SPSS</option>
            </select>
          </div>
          <button onClick={() => calculate()} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Calculate</button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {result && (
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Count', result.count],
                ['Sum', formatStat(result.sum)],
                ['Mean', formatStat(result.mean)],
                ['Median', formatStat(result.median)],
                ['Mode', result.mode.length ? `${result.mode.map(formatStat).join(', ')} (×${result.modeCount})` : 'None (no value repeats)'],
                ['Geometric mean', result.geometricMean === null ? '— (needs all values > 0)' : formatStat(result.geometricMean)],
                ['Harmonic mean', result.harmonicMean === null ? '— (needs all values > 0)' : formatStat(result.harmonicMean)],
                ['Range', formatStat(result.range)],
                ['Sample std dev (s)', formatStat(result.sampleStdDev)],
                ['Population std dev (σ)', formatStat(result.populationStdDev)],
                ['Sample variance (s²)', formatStat(result.sampleVariance)],
                ['Population variance (σ²)', formatStat(result.populationVariance)],
                ['Q1', result.q1 === null ? '— (too few values for this method)' : formatStat(result.q1)],
                ['Q3', result.q3 === null ? '— (too few values for this method)' : formatStat(result.q3)],
                ['Interquartile range (IQR)', formatStat(result.iqr)],
                ['Standard error of the mean', formatStat(result.standardError)],
                ['Coefficient of variation (sample s ÷ |mean|)', result.coefficientOfVariation === null ? '—' : `${formatStat(result.coefficientOfVariation * 100)} %`],
                ['Skewness (Excel SKEW)', result.skewness === null ? '— (needs 3+ values, not all equal)' : formatStat(result.skewness)],
                ['Excess kurtosis (Excel KURT)', result.kurtosis === null ? '— (needs 4+ values, not all equal)' : formatStat(result.kurtosis)],
                ['Sum of squares (Σ(x − mean)²)', formatStat(result.sumOfSquares)],
                ['Outliers (1.5 × IQR rule)', result.iqr === null ? '—' : result.outliers.length ? result.outliers.map(formatStat).join(', ') : 'None'],
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
        description={`Statistics Calculator describes a list of numbers with 23 values: count, sum, the arithmetic, geometric and harmonic means, median, mode, range, sample and population standard deviation and variance, Q1, Q3 and the interquartile range by the inclusive or exclusive method, standard error, coefficient of variation, Excel-style skewness and excess kurtosis, sum of squares, outliers by the 1.5 × IQR rule, minimum and maximum. Separate the numbers with commas, spaces, tabs, semicolons or new lines. Results show 12 significant digits, and an entry that is not a number stops the calculation with a message naming it.`}
        example={{
          caption: 'A list of eight numbers and part of the grid the page shows (the page\'s own statistics code, run in Node on October 6, 2026).',
          inputLabel: 'Numbers (Quartile method: Inclusive)',
          input: '2, 4, 4, 4, 5, 5, 7, 9',
          outputLabel: 'Some of the results',
          output: 'Mean 5 · Median 4.5 · Mode 4 (×3)\nSample std dev (s) 2.1380899353\nPopulation std dev (σ) 2\nQ1 4 · Q3 5.5 · IQR 1.5 (Exclusive: Q1 4, Q3 6.5)\nCoefficient of variation 42.761798706 %\nSkewness 0.818487553357 · Excess kurtosis 0.940625\nOutliers 9',
        }}
        howToTitle="How to calculate mean, median and standard deviation"
        howTo={[
          'Paste or type the numbers, separated by commas, spaces, tabs, semicolons or new lines, with a dot for decimals.',
          `Leave "Quartile method" on the inclusive option, as in Excel QUARTILE.INC, or pick the exclusive one used by Minitab and SPSS.`,
          `Click "Calculate" and read the grid; changing the quartile method afterwards recalculates at once.`,
          `If the page lists entries after "Not a number", correct them and click "Calculate" again.`,
        ]}
        specs={[
          { label: 'Separators', value: 'Commas, spaces, tabs, semicolons and new lines; a dot for decimals' },
          { label: 'Statistics', value: '23 values, from count and sum to skewness, kurtosis and outliers' },
          { label: 'Quartiles', value: 'Inclusive (Excel QUARTILE.INC) or Exclusive (Excel QUARTILE.EXC, Minitab, SPSS); exclusive quartiles need enough values' },
          { label: 'Undefined values', value: 'Shown as —; the reason is written for the geometric and harmonic means, the quartiles, skewness and kurtosis' },
          { label: 'Entries that are not numbers', value: 'The list is refused and the first five such entries are named' },
        ]}
        privacyTitle="Where your numbers are processed"
        privacy="Every statistic is computed in your browser, and your numbers are not uploaded. If some entries are not numbers, the error message that names up to five of them is sent, cleaned, to our error log with the tool's name and your browser's name and major version; the valid numbers are never part of it."
        faqs={[
          { q: 'Does it give both sample and population standard deviation?', a: 'Yes. The sample value s divides by n − 1 and estimates a larger population from your sample; the population value σ divides by n and describes exactly the numbers you entered. With a single number, s and the sample variance show —.' },
          { q: 'Can I match the quartiles of Excel?', a: 'Yes. Inclusive, the default, follows QUARTILE.INC and calculator.net; Exclusive follows QUARTILE.EXC, Minitab and SPSS. For 2, 4, 4, 4, 5, 5, 7, 9, Q3 is 5.5 with the inclusive method and 6.5 with the exclusive one. With too few values the exclusive quartiles are undefined, and the page says so.' },
          { q: 'How are outliers found?', a: '1.5 × IQR beyond the quartiles: a value below Q1 − 1.5 × IQR or above Q3 + 1.5 × IQR is listed. In 2, 4, 4, 4, 5, 5, 7, 9 that flags 9. Because the IQR comes from the quartiles, the list can change with the quartile method.' },
          { q: 'What if no value repeats?', a: 'No mode is given: the Mode cell reads None (no value repeats). When several values tie for the most repeats, all of them are listed, followed by how many times each one appears in your list.' },
          { q: 'Can I paste numbers with thousands separators?', a: 'No. A comma separates values, so 1,000 is read as two numbers, 1 and 0, and 2,5 as 2 and 5. Remove thousands separators and write decimals with a dot before you calculate.' },
        ]}
        tips={[
          'Paste a spreadsheet column as it is: the line breaks between cells already separate the values.',
        ]}
      />
    </div>
  );
}