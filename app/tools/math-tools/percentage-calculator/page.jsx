'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

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
      <SeoContent
        title="Percentage Calculator"
        description="Percentage Calculator offers three instant calculations — what X% of Y is, what percent X is of Y, and the percentage change from X to Y — all computed live as you type, entirely in your browser. Note: all three panels share the same two number fields, so entering values in one updates the numbers used by the others."
        howTo={[
          "Scroll to the panel for the calculation you need: \"What is X% of Y?\", \"X is what % of Y?\", or \"Percentage change from X to Y\".",
          "Enter your two numbers in that panel's input fields.",
          "The result appears instantly below the inputs — no calculate button needed.",
          "Since all three panels share the same two values, re-enter your numbers when you switch to a different calculation."
        ]}
        faqs={[
          { q: "Do the three panels work independently?", a: "Not quite — they all read from the same two input values, so typing in one panel updates the numbers shown in the others too. Enter your values for the calculation you want, then read that panel's result." },
          { q: "Is Percentage Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How accurate are the results?", a: "Results use standard floating-point math and are shown to 2 decimal places." },
          { q: "What calculations are available?", a: "Percentage of a number, what percent one number is of another, and percentage change between two numbers." }
        ]}
        tips={[
          "Since all three panels share the same two inputs, re-enter your numbers each time you switch which calculation you want to read.",
          "For percentage change, a negative result means a decrease and a positive result means an increase.",
          "Use \"X is what % of Y?\" to quickly figure out grades, discounts, or completion rates.",
          "Round results manually for money calculations to avoid odd fractional cents."
        ]}
      />
    </div>
  );
}