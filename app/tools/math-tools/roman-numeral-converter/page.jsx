'use client';
import { useState } from 'react';

const toRoman = (num) => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) { result += syms[i]; num -= vals[i]; }
  }
  return result;
};

const fromRoman = (str) => {
  const map = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
  let result = 0;
  for (let i = 0; i < str.length; i++) {
    const curr = map[str[i]];
    const next = map[str[i+1]];
    if (next && curr < next) result -= curr;
    else result += curr;
  }
  return result;
};

export default function RomanNumeralConverterPage() {
  const [number, setNumber] = useState('');
  const [roman, setRoman] = useState('');

  const handleNumber = (val) => {
    setNumber(val);
    const n = parseInt(val);
    if (n > 0 && n <= 3999) setRoman(toRoman(n));
    else setRoman('');
  };

  const handleRoman = (val) => {
    setRoman(val.toUpperCase());
    const result = fromRoman(val.toUpperCase());
    if (result > 0) setNumber(result.toString());
    else setNumber('');
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Roman Numeral Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between numbers and Roman numerals</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Number (1-3999)</label>
            <input type="number" min="1" max="3999" value={number} onChange={e => handleNumber(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold" placeholder="Enter number..." />
          </div>
          <div className="text-center text-neutral-500 font-bold">⇅</div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Roman Numeral</label>
            <input type="text" value={roman} onChange={e => handleRoman(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xl font-bold font-mono" placeholder="Enter Roman numeral..." />
          </div>
          {roman && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-4xl font-bold text-indigo-400 font-mono">{roman}</div>
              <div className="text-neutral-500 mt-2">{number} = {roman}</div>
            </div>
          )}
          <button onClick={() => navigator.clipboard.writeText(roman)} disabled={!roman} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-2 font-semibold transition">Copy Roman Numeral</button>
        </div>
      </div>
    </div>
  );
}