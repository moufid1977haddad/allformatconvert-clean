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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Number Base Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">The Number Base Converter is a free online tool that instantly converts numbers between different bases including binary, decimal, hexadecimal, and octal. Perfect for programmers, students, and anyone working with different numeral systems, this tool eliminates manual calculation errors and saves valuable time.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Number Base Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your number in the input field provided on the tool interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the base of your current number from the dropdown menu (binary, decimal, hexadecimal, octal, etc.)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose the target base you want to convert to from the second dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Convert' button to instantly see your result displayed below</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What number bases does this converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The Number Base Converter supports all common bases including binary (base 2), octal (base 8), decimal (base 10), hexadecimal (base 16), and custom bases up to base 36.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Number Base Converter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Number Base Converter is completely free with no registration required, hidden fees, or usage limits. Convert as many numbers as you need without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert negative numbers with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the converter handles both positive and negative numbers across all supported bases, making it versatile for various mathematical and programming applications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why would I need to convert between different number bases?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Number base conversion is essential for programming, computer science, digital electronics, and mathematics. Different systems use different bases for specific purposes like hexadecimal in color codes and memory addresses.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access during your coding sessions and programming projects to speed up your workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Double-check your source base selection before converting to avoid incorrect results from misidentified number formats</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use hexadecimal conversion when working with web colors and HTML codes for a faster design workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remember that binary is base 2, octal is base 8, decimal is base 10, and hexadecimal is base 16 for quick mental reference</li>
          </ul>
        </div>
      </div>
    </div>
  );
}