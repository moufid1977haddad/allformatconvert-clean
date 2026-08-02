'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function PercentageCalculatorPage() {
  const [a1, setA1] = useState('');
  const [b1, setB1] = useState('');
  const [a2, setA2] = useState('');
  const [b2, setB2] = useState('');
  const [a3, setA3] = useState('');
  const [b3, setB3] = useState('');

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
              {a1 && b1 ? `${(parseFloat(a1) * parseFloat(b1) / 100).toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">X is what % of Y?</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a2} onChange={e => setA2(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="X" />
              <input type="number" value={b2} onChange={e => setB2(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a2 && b2 ? (parseFloat(b2) === 0 ? <span className="text-red-500">Cannot divide by zero</span> : `${(parseFloat(a2) / parseFloat(b2) * 100).toFixed(2)}%`) : '—'}
            </div>
          </div>
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-3">
            <h2 className="font-semibold text-indigo-400">Percentage change from X to Y</h2>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={a3} onChange={e => setA3(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="From X" />
              <input type="number" value={b3} onChange={e => setB3(e.target.value)} className="bg-neutral-200 border border-neutral-600 rounded-lg p-2" placeholder="To Y" />
            </div>
            <div className="text-center text-xl font-bold text-green-400">
              {a3 && b3 ? (parseFloat(a3) === 0 ? <span className="text-red-500">Cannot divide by zero</span> : `${((parseFloat(b3) - parseFloat(a3)) / parseFloat(a3) * 100).toFixed(2)}%`) : '—'}
            </div>
          </div>
        </div>
      </div>
      <SeoContent
        title="Percentage Calculator"
        description="Percentage Calculator offers three independent instant calculations — what X% of Y is, what percent X is of Y, and the percentage change from X to Y — all computed live as you type, entirely in your browser. Each panel has its own pair of number fields, so entering values in one doesn't affect the others."
        howTo={[
          "Scroll to the panel for the calculation you need: \"What is X% of Y?\", \"X is what % of Y?\", or \"Percentage change from X to Y\".",
          "Enter your two numbers in that panel's input fields.",
          "The result appears instantly below the inputs — no calculate button needed.",
          "Each panel keeps its own values, so you can fill in more than one calculation at a time."
        ]}
        faqs={[
          { q: "Do the three panels work independently?", a: "Yes — each panel has its own two input fields, so entering values in one doesn't change or clear the others." },
          { q: "Is Percentage Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How accurate are the results?", a: "Results use standard floating-point math and are shown to 2 decimal places." },
          { q: "What calculations are available?", a: "Percentage of a number, what percent one number is of another, and percentage change between two numbers." }
        ]}
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