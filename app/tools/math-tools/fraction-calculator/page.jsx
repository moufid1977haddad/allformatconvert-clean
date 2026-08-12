'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const simplify = (num, den) => {
  const g = gcd(Math.abs(num), Math.abs(den));
  return { num: num / g, den: den / g };
};

export default function FractionCalculatorPage() {
  const [n1, setN1] = useState('');
  const [d1, setD1] = useState('');
  const [n2, setN2] = useState('');
  const [d2, setD2] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [op, setOp] = useState('+');

  const calculate = () => {
    setError('');
    const a = parseInt(n1), b = parseInt(d1), c = parseInt(n2), d = parseInt(d2);
    if (isNaN(a) || isNaN(b) || isNaN(c) || isNaN(d) || b === 0 || d === 0) {
      setResult(null);
      setError('Denominators cannot be zero.');
      return;
    }
    let num, den;
    if (op === '+') { num = a*d + c*b; den = b*d; }
    else if (op === '-') { num = a*d - c*b; den = b*d; }
    else if (op === '*') { num = a*c; den = b*d; }
    else { num = a*d; den = b*c; }
    if (den === 0) {
      setResult(null);
      setError('Cannot divide by zero.');
      return;
    }
    const simplified = simplify(num, den);
    setResult({ ...simplified, decimal: (simplified.num / simplified.den).toFixed(6) });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Fraction Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Add, subtract, multiply and divide fractions</p>

        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-4 justify-center">

            {/* Fraction 1 */}
            <div className="text-center">
              <input type="number" value={n1} onChange={e => setN1(e.target.value)}
                className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="1" />
              <div className="border-t-2 border-neutral-400 my-1.5" />
              <input type="number" value={d1} onChange={e => setD1(e.target.value)}
                className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="2" />
            </div>

            {/* Operators */}
            <div className="flex flex-col gap-2">
              {['+','-','*','/'].map(o => (
                <button
                  key={o}
                  onClick={() => setOp(o)}
                  className={`w-11 h-11 rounded-lg font-bold text-base transition ${
                    op === o ? 'bg-indigo-500 text-white' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>

            {/* Fraction 2 */}
            <div className="text-center">
              <input type="number" value={n2} onChange={e => setN2(e.target.value)}
                className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="1" />
              <div className="border-t-2 border-neutral-400 my-1.5" />
              <input type="number" value={d2} onChange={e => setD2(e.target.value)}
                className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="3" />
            </div>
          </div>

          {/* Calculate button */}
          <button
            onClick={calculate}
            disabled={!n1 || !d1 || !n2 || !d2}
            className="w-full mt-6 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-200 dark:disabled:bg-neutral-800 disabled:text-indigo-400 dark:disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold transition"
          >
            Calculate
          </button>

          {/* Result */}
          {result && (
            <div className="mt-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-extrabold text-indigo-500">{result.num}/{result.den}</div>
              <div className="text-neutral-500 mt-2">= {result.decimal}</div>
            </div>
          )}
          {error && (
            <div className="mt-5 bg-red-50 dark:bg-red-950 border border-red-500 rounded-xl p-4 text-center text-red-500 font-semibold">
              {error}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Fraction Calculator"
        description="Fraction Calculator adds, subtracts, multiplies, and divides two fractions entirely in your browser, automatically reducing every result to its simplest form and showing the decimal equivalent alongside it."
        howTo={[
          "Enter the numerator and denominator of your first fraction.",
          "Click one of the four operator buttons (+, −, ×, ÷) to choose the operation.",
          "Enter the numerator and denominator of your second fraction.",
          "Click \"Calculate\" to see the simplified result and its decimal equivalent."
        ]}
        faqs={[
          { q: "Does this calculator simplify fractions automatically?", a: "Yes, every result is automatically reduced to its lowest terms using the greatest common divisor." },
          { q: "Is Fraction Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What operations can I perform?", a: "Addition, subtraction, multiplication, and division, working with positive and negative whole-number numerators and denominators." },
          { q: "Does it show a decimal equivalent?", a: "Yes, the decimal value is displayed alongside the simplified fraction result." }
        ]}
        tips={[
          "Enter a negative sign in the numerator field to work with negative fractions.",
          "Use the decimal result shown alongside the fraction to sanity-check your answer.",
          "Make sure your second fraction's numerator isn't zero when dividing — division by zero won't produce a valid result.",
          "Bookmark this page for quick access whenever you need to check fraction homework or calculations."
        ]}
      />
    </div>
  );
}