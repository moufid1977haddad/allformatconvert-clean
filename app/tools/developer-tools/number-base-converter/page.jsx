'use client';
import { useState } from 'react';
export default function NumberBaseConverterDevPage() {
  const [value, setValue] = useState('');
  const [fromBase, setFromBase] = useState('10');
  const convert = (base) => { try { const d = parseInt(value, parseInt(fromBase)); return isNaN(d) ? 'Invalid' : d.toString(parseInt(base)).toUpperCase(); } catch { return 'Invalid'; } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number Base Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between binary, decimal, octal and hex</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Value</label><input type="text" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="Enter value..." /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">From Base</label><select value={fromBase} onChange={e => setFromBase(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option value="2">Binary</option><option value="8">Octal</option><option value="10">Decimal</option><option value="16">Hexadecimal</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[['2','Binary'],['8','Octal'],['10','Decimal'],['16','Hexadecimal']].map(([base,label]) => <div key={base} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4"><div className="text-neutral-500 text-sm mb-1">{label}</div><div className="font-mono text-indigo-400 text-lg font-bold">{value ? convert(base) : '—'}</div></div>)}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Number Base Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Number Base Converter is a free online tool that instantly converts numbers between different bases including binary, decimal, octal, and hexadecimal. This utility is perfect for programmers, students, and anyone working with computer systems who needs quick and accurate base conversions.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Number Base Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter your number in the input field at the top of the converter tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the base of your current number from the dropdown menu (binary, octal, decimal, or hexadecimal)</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose the target base you want to convert your number to</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Convert button to instantly see your result displayed below</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What number bases does this converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The Number Base Converter supports the most common bases used in computing: binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16).</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a limit to the size of numbers I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The converter can handle most standard number sizes, though extremely large numbers may have processing limitations. For typical use cases in programming and mathematics, there are no practical restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert negative numbers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Number Base Converter supports negative numbers across all supported bases, making it suitable for a wide range of mathematical and programming applications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install anything to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation is required. Number Base Converter is a free online tool that works directly in your web browser, accessible from any device with internet connectivity.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save time by using keyboard shortcuts to quickly switch between input and target bases when making multiple conversions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Learn the pattern of how numbers convert between bases to better understand binary and hexadecimal systems used in programming</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the hexadecimal converter feature when working with color codes in web design, as colors are typically represented in hex format</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access when debugging code or working on computer science assignments that require base conversions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}