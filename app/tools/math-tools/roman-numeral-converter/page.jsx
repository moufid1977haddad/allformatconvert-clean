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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Roman Numeral Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">The Roman Numeral Converter is a free online tool that instantly converts between Arabic numerals and Roman numerals with complete accuracy. Whether you need to translate historical dates, educational assignments, or tattoo designs, this converter handles all conversions effortlessly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Roman Numeral Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your number in either the Arabic numeral field (1-3999) or the Roman numeral field (I-MMMCMXCIX)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically detects which format you've entered and processes the conversion in real-time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>View the converted result instantly displayed in the opposite field with full accuracy</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy your converted number to clipboard or use it for your project immediately</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum number this converter can handle?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The converter handles Roman numerals up to 3,999 (MMMCMXCIX). Ancient Romans didn't have a symbol for zero or numbers beyond this range in standard notation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert decimal or fractional numbers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, this tool only converts whole numbers. Roman numerals were designed for integers, so decimal values cannot be accurately represented in traditional Roman numeral format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are uppercase and lowercase Roman numerals both accepted?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the converter accepts both uppercase (IV) and lowercase (iv) Roman numerals and will standardly output in uppercase format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why does my Roman numeral show as invalid?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Roman numerals follow specific rules about repetition and placement. Invalid combinations like IIII or IL won't convert. Ensure you're using proper Roman numeral syntax.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use this converter for historical research, helping you quickly understand dates written in Roman numerals on ancient documents and monuments</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Perfect for students studying classical history, Latin, or mathematics who need instant verification of their Roman numeral conversions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for tattoo planning to ensure your Roman numeral design is spelled correctly before getting inked permanently</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the converter when reading copyright years on old books and films, making it easy to determine publication dates from Roman numerals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}