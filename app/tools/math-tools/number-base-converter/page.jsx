'use client';
import { useState } from 'react';

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
    </div>
  );
}