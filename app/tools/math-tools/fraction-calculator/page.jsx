'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseFraction, fractionOp, describeFraction, fractionSteps, mixedFraction } from '../../../lib/mathTools';
import { useToolError } from '../../../lib/useToolError';

export default function FractionCalculatorPage() {
  const [n1, setN1] = useState('');
  const [d1, setD1] = useState('');
  const [n2, setN2] = useState('');
  const [d2, setD2] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [op, setOp] = useState('+');
  // P24 (03/10): optional whole-number parts (mixed numbers) and the working, as Calculator Soup shows them
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [steps, setSteps] = useState([]);

  const calculate = () => {
    setError('');
    try {
      // Each field accepts an integer or a decimal; numerator/denominator are
      // combined exactly (BigInt), so 1.5/2 = 3/4 and huge values keep every digit.
      const operand = (w, n, d) => (w.trim() && !n.trim() && !d.trim() ? { num: 0n, den: 1n } : fractionOp(parseFraction(n), parseFraction(d), '/'));
      const f1 = mixedFraction(w1, operand(w1, n1, d1));
      const f2 = mixedFraction(w2, operand(w2, n2, d2));
      setResult(describeFraction(fractionOp(f1, f2, op)));
      const mixedStep = (w, f) => (w.trim() ? [`${w.trim()} and the fraction = ${f.den === 1n ? f.num : `${f.num}/${f.den}`} as an improper fraction`] : []);
      setSteps([...mixedStep(w1, f1), ...mixedStep(w2, f2), ...fractionSteps(f1, f2, op)]);
    } catch (e) {
      setResult(null); setSteps([]);
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
            <input type="text" inputMode="numeric" value={w1} onChange={e => setW1(e.target.value)} aria-label="Whole number 1 (optional)" title="Whole number (optional, for a mixed number)"
              className="w-12 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="" />
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
            <input type="text" inputMode="numeric" value={w2} onChange={e => setW2(e.target.value)} aria-label="Whole number 2 (optional)" title="Whole number (optional, for a mixed number)"
              className="w-12 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center text-neutral-800 focus:outline-none" placeholder="" />
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
            disabled={!((n1 && d1) || (w1 && !n1 && !d1)) || !((n2 && d2) || (w2 && !n2 && !d2))}
            className="w-full mt-6 bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-200 dark:disabled:bg-neutral-800 disabled:text-indigo-400 dark:disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-xl py-3.5 font-bold transition"
          >
            Calculate
          </button>

          {/* Result */}
          {result && (
            <div className="mt-5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 rounded-xl p-6 text-center">
              <div className="text-4xl font-extrabold text-indigo-500 break-all">{result.fraction}</div>
              {result.mixed !== result.fraction && <div className="text-neutral-600 mt-2">= {result.mixed} (mixed number)</div>}
              <div className="text-neutral-500 mt-1 break-all" data-decimal>= {result.decimal}</div>
              {/\(/.test(result.decimal) && <div className="text-xs text-neutral-500 mt-1">Digits in brackets repeat forever.</div>}
              {steps.length > 0 && (
                <ol className="text-left text-sm text-neutral-600 mt-4 space-y-1 list-decimal list-inside break-all" data-steps>
                  {steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              )}
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
        description={`Fraction Calculator does one operation on two fractions: add, subtract, multiply or divide. Each box takes a whole number, a decimal such as 0.75 or a fraction, and the small box on the left turns an entry into a mixed number. The arithmetic uses exact whole numbers of any length, so a 20-digit numerator is not rounded. You get the result reduced to lowest terms, as a mixed number when it differs, and as a decimal written exactly, with repeating digits in brackets, followed by the steps of the calculation, worked out by the page with whole-number arithmetic.`}
        example={{
          caption: 'Three calculations and what the page shows (the page\'s own fraction code, run in Node on October 6, 2026).',
          inputLabel: 'You enter',
          input: '1 (whole) and 1/2  +  3/4\n1/6  /  2/3\n22/7  *  1/1',
          outputLabel: 'Result and steps',
          output: '9/4 = 2 1/4 (mixed number) = 2.25\n  1 and the fraction = 3/2 as an improper fraction\n  Least common denominator of 2 and 4: 4\n  3/2 = 6/4 and 3/4 = 3/4\n  6/4 + 3/4 = 9/4\n1/4 = 0.25\n  Dividing by 2/3 is multiplying by its reciprocal 3/2\n  (1 × 3) / (6 × 2) = 3/12\n  Simplify by 3: 1/4\n22/7 = 3 1/7 (mixed number) = 3.(142857)\n  Multiply across: (22 × 1) / (7 × 1) = 22/7',
        }}
        howToTitle="How to add, subtract, multiply or divide fractions"
        howTo={[
          'Type each numerator above the line and each denominator below it; a box may also hold a decimal such as 0.5.',
          'For a mixed number such as 1 1/2, put the 1 in the small box on the left, with any minus sign there.',
          `Pick "+", "-", "*" or "/" between the two fractions.`,
          `Click "Calculate" to get the reduced fraction, the mixed number, the decimal and the numbered steps.`,
        ]}
        specs={[
          { label: 'Entries', value: 'Whole numbers, decimals and fractions such as 3/-4 in any box; a whole part in the small box for a mixed number' },
          { label: 'Number size', value: 'Any length: exact integer arithmetic, never rounded' },
          { label: 'Decimal', value: 'Exact; the repeating part is shown in brackets, and a period longer than 100 digits is cut with a note' },
          { label: 'Reported instead of a result', value: 'A zero denominator, division by zero, and text that is not a number' },
        ]}
        privacyTitle="Where your fractions are processed"
        privacy="All the arithmetic is done by this page in your browser, and your numbers are not sent anywhere. When an error message is shown, its text goes to our error log with the tool's name and your browser's name and major version, and whatever it quotes from your entries is replaced by a placeholder."
        faqs={[
          { q: 'Is the answer always in lowest terms?', a: 'Yes. Every result is divided by the greatest common divisor of its numerator and denominator, and the minus sign moves to the numerator, so 1/-2 is shown as -1/2. When that division changes something, a step names the number it divided by.' },
          { q: 'Can I enter mixed numbers?', a: 'Yes. Type the whole part in the small box before the fraction: 1 there, then 1 over 2, means 1 1/2. For a negative mixed number, put the minus on the whole part only, as in -1 and 1/2; a minus inside the fraction as well is refused with a message.' },
          { q: 'Is the decimal exact?', a: 'Yes. 9/8 is written 1.125, and a repeating decimal shows its period in brackets: 1/6 is 0.1(6) and 22/7 is 3.(142857). When the period runs past 100 digits, the digits are cut, never rounded, and a note says the repeating part is longer.' },
          { q: 'What happens if I divide by zero?', a: 'No result is given. Dividing by a fraction equal to zero shows Cannot divide by zero, and so does a 0 typed in a denominator box; a fraction typed in one box, such as 1/0, is reported as an error that quotes it.' },
        ]}
        tips={[
          'To compare two fractions, subtract one from the other: a negative result means the first one is smaller.',
        ]}
      />
    </div>
  );
}