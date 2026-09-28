'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseFraction, fractionOp, describeFraction } from '../../../lib/mathTools';

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
    try {
      // Each field accepts an integer or a decimal; numerator/denominator are
      // combined exactly (BigInt), so 1.5/2 = 3/4 and huge values keep every digit.
      const f1 = fractionOp(parseFraction(n1), parseFraction(d1), '/');
      const f2 = fractionOp(parseFraction(n2), parseFraction(d2), '/');
      setResult(describeFraction(fractionOp(f1, f2, op)));
    } catch (e) {
      setResult(null);
      setError(e.message);
    }
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
              <input type="text" inputMode="decimal" value={n1} onChange={e => setN1(e.target.value)}
                className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="1" />
              <div className="border-t-2 border-neutral-400 my-1.5" />
              <input type="text" inputMode="decimal" value={d1} onChange={e => setD1(e.target.value)}
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
              <input type="text" inputMode="decimal" value={n2} onChange={e => setN2(e.target.value)}
                className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="1" />
              <div className="border-t-2 border-neutral-400 my-1.5" />
              <input type="text" inputMode="decimal" value={d2} onChange={e => setD2(e.target.value)}
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
              <div className="text-4xl font-extrabold text-indigo-500 break-all">{result.fraction}</div>
              {result.mixed !== result.fraction && <div className="text-neutral-600 mt-2">= {result.mixed} (mixed number)</div>}
              <div className="text-neutral-500 mt-1 break-all">= {result.decimal}</div>
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
        title={"Fraction Calculator"}
        description={"Fraction Calculator adds, subtracts, multiplies and divides two fractions and simplifies the result, entirely in your browser. Arithmetic is exact at any size (no rounding, even with 20-digit numerators), signs are normalised (1/-2 is shown as -1/2), and the result is given as a simplified fraction, a mixed number (1 1/8) and a decimal — exact when the decimal terminates, otherwise rounded to 12 significant digits and marked as such. Each box also accepts a decimal such as 1.5; anything that isn't a number is reported, never read as a different value."}
        howTo={[
          "Enter the numerator and denominator of each fraction (decimals such as 0.5 are accepted).",
          "Choose +, -, × or ÷.",
          "Click 'Calculate'.",
          "Read the simplified fraction, the mixed number and the decimal."
        ]}
        faqs={[
          { q: "Is Fraction Calculator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it simplify the result?", a: "Yes — the result is always reduced to lowest terms using the greatest common divisor." },
          { q: "Can I use negative numbers or decimals?", a: "Yes — -3/4, 3/-4 and 0.75 are all accepted; the sign is moved to the numerator in the result." },
          { q: "Is the decimal exact?", a: "When the fraction has a terminating decimal (like 9/8 = 1.125) it is exact; otherwise (like 1/3) it is rounded to 12 significant digits and marked '(rounded)'." }
        ]}
        tips={[
          "To enter a mixed number like 1 1/2, type 3 over 2 (or 1.5 over 1).",
          "Dividing by a fraction equal to zero is reported instead of giving an infinite result."
        ]}
      />
    </div>
  );
}