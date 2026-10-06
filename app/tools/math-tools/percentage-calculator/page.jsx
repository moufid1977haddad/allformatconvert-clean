'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatSignificant } from '../../../lib/exactNumbers';
import { SEO } from './seo';

// Results use significant digits, not toFixed(2): 0.001 % of 5 used to read "0.00" (measured 2026-09-22).

export default function PercentageCalculatorPage() {
  const [a1, setA1] = useState('');
  const [b1, setB1] = useState('');
  const [a2, setA2] = useState('');
  const [b2, setB2] = useState('');
  const [a3, setA3] = useState('');
  const [b3, setB3] = useState('');
  // P24 (03/10): calculator.net's other three calculations
  const [a4, setA4] = useState(''); const [b4, setB4] = useState('');
  const [a5, setA5] = useState(''); const [b5, setB5] = useState(''); const [dir5, setDir5] = useState('increase');
  const [a6, setA6] = useState(''); const [b6, setB6] = useState('');
  const f = (v) => parseFloat(v);

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Percentage Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Six percentage calculations that update as you type</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-6">
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">What is X% of Y?</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a1} onChange={e => setA1(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X %" />
              <input type="number" value={b1} onChange={e => setB1(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a1 && b1 ? formatSignificant(parseFloat(a1) * parseFloat(b1) / 100) : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">X is what % of Y?</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a2} onChange={e => setA2(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X" />
              <input type="number" value={b2} onChange={e => setB2(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a2 && b2 ? (parseFloat(b2) === 0 ? <span className="text-red-500">Cannot divide by zero</span> : `${formatSignificant(parseFloat(a2) / parseFloat(b2) * 100)}%`) : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">Percentage change from X to Y</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a3} onChange={e => setA3(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="From X" />
              <input type="number" value={b3} onChange={e => setB3(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="To Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a3 && b3 ? (parseFloat(a3) === 0 ? <span className="text-red-500">Cannot divide by zero</span> : `${formatSignificant((parseFloat(b3) - parseFloat(a3)) / Math.abs(parseFloat(a3)) * 100)}%` /* P24: divided by |X| — from -10 to -5 is +50 %, not -50 % */) : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">X is Y% of what?</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a4} onChange={e => setA4(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X" />
              <input type="number" value={b4} onChange={e => setB4(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y %" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a4 && b4 ? (f(b4) === 0 ? <span className="text-red-500">Cannot divide by zero</span> : formatSignificant(f(a4) * 100 / f(b4))) : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">Increase or decrease X by Y%</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a5} onChange={e => setA5(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X" />
              <input type="number" value={b5} onChange={e => setB5(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y %" />
              <select aria-label="Increase or decrease" value={dir5} onChange={e => setDir5(e.target.value)} className="col-span-2 bg-neutral-200 border border-neutral-600 rounded-lg p-2"><option value="increase">Increase</option><option value="decrease">Decrease</option></select>
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a5 && b5 ? formatSignificant(f(a5) * (1 + (dir5 === 'increase' ? 1 : -1) * f(b5) / 100)) : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">Percentage difference between X and Y</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a6} onChange={e => setA6(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X" />
              <input type="number" value={b6} onChange={e => setB6(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a6 && b6 ? (f(a6) + f(b6) === 0 ? <span className="text-red-500">Undefined when X + Y = 0</span> : `${formatSignificant(Math.abs(f(a6) - f(b6)) / (Math.abs(f(a6) + f(b6)) / 2) * 100)}%`) : '—'}
            </div>
          </div>
        </div>
      </div>
      <SeoContent
        title="Percentage Calculator"
        description={`Percentage Calculator has six panels, each answering one question: what X% of Y is, what percent X is of Y, the percentage change from X to Y, the number that X is Y% of, X increased or decreased by Y%, and the percentage difference between X and Y. Results appear as you type, with up to 10 significant digits and no rounding of small values to zero, and each panel keeps its own numbers. A division by zero is reported instead of a made-up value.`}
        example={{
          caption: 'Each panel with sample numbers and the result it shows (the page\'s own formulas, run in Node on October 6, 2026).',
          inputLabel: 'You enter',
          input: 'What is 15% of 80?\n12 is what % of 80?\nChange from 60 to 72\nChange from 72 to 60\n12 is 15% of what?\nIncrease 80 by 15%\nDecrease 80 by 15%\nDifference between 60 and 72',
          outputLabel: 'Result',
          output: '12\n15%\n20%\n-16.66666667%\n80\n92\n68\n18.18181818%',
        }}
        howToTitle="How to calculate a percentage"
        howTo={[
          `Find the panel for your question, from "What is X% of Y?" down to "Percentage difference between X and Y".`,
          `Type the two numbers in that panel; in "Increase or decrease X by Y%", also choose "Increase" or "Decrease".`,
          'Read the result under the fields: it changes as you type, and there is no button to press.',
        ]}
        specs={[
          { label: 'Calculations', value: 'X% of Y; X as a percent of Y; change from X to Y; X is Y% of what; X increased or decreased by Y%; difference between X and Y' },
          { label: 'Change formula', value: '(Y − X) ÷ |X| × 100, so the sign follows the direction even when X is negative' },
          { label: 'Difference formula', value: '|X − Y| ÷ (|X + Y| ÷ 2) × 100, the same whichever number comes first' },
          { label: 'Precision', value: 'Up to 10 significant digits; very small results are written out, not rounded to zero' },
          { label: 'Zero', value: 'Cannot divide by zero when the base is 0; Undefined when X + Y = 0 in the difference panel' },
        ]}
        privacyTitle="Where your numbers are processed"
        privacy="The six panels apply their formulas in your browser, and your numbers are neither sent nor stored: the fields are empty again when you reload. A crash of the calculator is reported by our error watch as a cleaned error message with the tool's name and your browser's name and major version, never the numbers in the six panels."
        faqs={[
          { q: 'Is percentage change the same as percentage difference?', a: 'No. Change measures a move from a starting value, so the order matters: 60 to 72 is a rise of 20 percent, 72 to 60 a fall of about 16.67 percent. Difference compares two values with no start, dividing the gap by their average. The third and sixth panels give each.' },
          { q: 'Does a 20 percent rise followed by a 20 percent fall bring me back to the start?', a: 'No. The fall applies to the larger amount: 100 rises to 120, and taking 20 percent off 120 leaves 96. Undoing a 20 percent rise takes a fall of 20 ÷ 120, about 16.67 percent, which the "Increase or decrease X by Y%" panel lets you check.' },
          { q: 'Can a percentage change go below minus 100 percent?', a: 'Yes, when the new value is negative. The page divides by the absolute value of the starting number, so 10 to −5 is a change of −150 percent, and −10 to −5 counts as a rise of 50 percent, since the value went up.' },
          { q: 'What if the starting value is 0?', a: 'No percentage can be given, because it would mean dividing by zero: a change from 0, X as a percent of 0, and X is 0 percent of what all show Cannot divide by zero. The difference panel shows Undefined when the two numbers add up to 0.' },
          { q: 'How many decimals does it show?', a: '10 significant digits at most, without rounding small results to zero: 0.001 percent of 5 shows 0.00005, where a two-decimal display would show 0.00. Round money amounts to cents yourself before using them.' },
        ]}
        related={SEO.related}
        tips={[
          `To find a price before a discount, use "X is Y% of what?" with the sale price and the share of the full price you paid.`,
          `To add a tip or a tax to a bill, "Increase or decrease X by Y%" gives the total in one step.`,
        ]}
      />
    </div>
  );
}