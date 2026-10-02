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
        <p className="text-neutral-500 text-center mb-8">Calculate percentages easily</p>
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
        description="Percentage Calculator offers six independent instant calculations — what X% of Y is, what percent X is of Y, the percentage change from X to Y, X is Y% of what, increasing or decreasing X by Y%, and the percentage difference between X and Y — all computed live as you type, entirely in your browser. Each panel has its own pair of number fields, so entering values in one doesn't affect the others."
        howTo={[
          "Scroll to the panel for the calculation you need: \"What is X% of Y?\", \"X is what % of Y?\", \"Percentage change from X to Y\", \"X is Y% of what?\", \"Increase or decrease X by Y%\" or \"Percentage difference between X and Y\".",
          "Enter your two numbers in that panel's input fields.",
          "The result appears instantly below the inputs — no calculate button needed.",
          "Each panel keeps its own values, so you can fill in more than one calculation at a time."
        ]}
        faqs={SEO.faqs}
        example={SEO.example}
        related={SEO.related}
        tips={[
          "Since each panel is independent, you can keep values filled in across all three at once for quick comparisons.",
          "For percentage change, a negative result means a decrease and a positive result means an increase.",
          "Use \"X is what % of Y?\" to quickly figure out grades, discounts, or completion rates.",
          "Round results manually for money calculations to avoid odd fractional cents."
        ]}
      />
    </div>
  );
}