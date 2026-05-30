'use client';
import { useState } from 'react';

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
  const [op, setOp] = useState('+');

  const calculate = () => {
    const a = parseInt(n1), b = parseInt(d1), c = parseInt(n2), d = parseInt(d2);
    if (!a || !b || !c || !d) return;
    let num, den;
    if (op === '+') { num = a*d + c*b; den = b*d; }
    else if (op === '-') { num = a*d - c*b; den = b*d; }
    else if (op === '*') { num = a*c; den = b*d; }
    else { num = a*d; den = b*c; }
    const simplified = simplify(num, den);
    setResult({ ...simplified, decimal: (simplified.num / simplified.den).toFixed(6) });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Fraction Calculator</h1>
        <p className="text-neutral-500 text-center mb-8">Add, subtract, multiply and divide fractions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4 justify-center">
            <div className="text-center">
              <input type="number" value={n1} onChange={e => setN1(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" placeholder="1" />
              <div className="border-t-2 border-neutral-400 my-1" />
              <input type="number" value={d1} onChange={e => setD1(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" placeholder="2" />
            </div>
            <div className="flex flex-col gap-2">
              {['+','-','*','/'].map(o => (
                <button key={o} onClick={() => setOp(o)} className={`w-10 h-10 rounded-lg font-bold transition ${op === o ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>{o}</button>
              ))}
            </div>
            <div className="text-center">
              <input type="number" value={n2} onChange={e => setN2(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" placeholder="1" />
              <div className="border-t-2 border-neutral-400 my-1" />
              <input type="number" value={d2} onChange={e => setD2(e.target.value)} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-2 text-center" placeholder="3" />
            </div>
          </div>
          <button onClick={calculate} disabled={!n1 || !d1 || !n2 || !d2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Calculate</button>
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-2">
              <div className="text-4xl font-bold text-indigo-400">{result.num}/{result.den}</div>
              <div className="text-neutral-500">= {result.decimal}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}