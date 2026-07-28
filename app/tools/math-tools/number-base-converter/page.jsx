'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function NumberBaseConverterPage() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState('10');

  const convert = (base) => {
    try {
      const decimal = parseInt(value, parseInt(fromBase));
      if (isNaN(decimal)) return 'Invalid';
      return decimal.toString(parseInt(base));
    } catch {
      return 'Invalid';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between binary, decimal, octal and hex</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Input Value</label>
              <input type="text" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="Enter value..." />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">From Base</label>
              <select value={fromBase} onChange={e => setFromBase(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="2">Binary (2)</option>
                <option value="8">Octal (8)</option>
                <option value="10">Decimal (10)</option>
                <option value="16">Hexadecimal (16)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['2','Binary'],['8','Octal'],['10','Decimal'],['16','Hexadecimal']].map(([base, label]) => (
              <div key={base} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
                <div className="text-neutral-500 text-sm mb-1">{label}</div>
                <div className="font-mono text-indigo-400 text-lg font-bold break-all">{value ? convert(base).toUpperCase() : '—'}</div>
                {value && convert(base) !== 'Invalid' && (
                  <button onClick={() => navigator.clipboard.writeText(convert(base))} className="text-xs text-neutral-500 hover:text-neutral-300 mt-1">Copy</button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <SeoContent
        title="Number Base Converter"
        description="Number Base Converter instantly converts a number between binary, octal, decimal, and hexadecimal, showing all four results side by side as you type — entirely in your browser."
        howTo={[
          "Enter your number in the input field.",
          "Select the base your number is currently in (Binary, Octal, Decimal, or Hexadecimal).",
          "View the converted value in all four bases at once, updated instantly.",
          "Click \"Copy\" next to any result to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What number bases does this converter support?", a: "Binary (base 2), Octal (base 8), Decimal (base 10), and Hexadecimal (base 16) — that's the full set; other custom bases aren't supported." },
          { q: "Is Number Base Converter free to use?", a: "Yes, it's completely free with no registration and no usage limits." },
          { q: "Can I convert negative numbers?", a: "Yes, negative numbers are converted using a standard sign-based representation (not two's complement), so a negative decimal converts to a negative value in the target base." },
          { q: "Do I need to pick a target base to convert to?", a: "No — all four base results are shown side by side simultaneously; there's no separate \"convert to\" selector." }
        ]}
        tips={[
          "Double-check your \"From Base\" selection before typing — an incorrect source base will silently produce a wrong (but validly formatted) result.",
          "Use the Hexadecimal result directly for CSS/HTML color codes or memory addresses.",
          "If a result shows \"Invalid,\" your input contains a digit that isn't valid for the selected source base (e.g., an \"8\" in binary).",
          "Click \"Copy\" on any of the four result cards to grab that specific base's value."
        ]}
      />
    </div>
  );
}