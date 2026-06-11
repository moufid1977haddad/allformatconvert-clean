'use client';
import { useState } from 'react';
export default function HexToTextPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toHex = () => setOutput(input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
  const fromHex = () => { try { setOutput(input.replace(/\s/g,'').match(/.{2}/g).map(h => String.fromCharCode(parseInt(h,16))).join('')); } catch(e) { setOutput('Invalid hex'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hex to Text</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between text and hexadecimal</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or hex..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Text to Hex</button>
            <button onClick={fromHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Hex to Text</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Hex To Text</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Hex To Text is a free online conversion tool that instantly transforms hexadecimal code into readable text characters. Perfect for developers, programmers, and anyone needing to decode hex values quickly and accurately.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Hex To Text</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your hexadecimal code into the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Ensure each hex pair (like 48, 65, 6C) is separated by spaces or on new lines</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Convert button to process your hex string</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the decoded text output from the results area</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is hexadecimal and why convert it to text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Hexadecimal is a base-16 number system used in computing. Converting hex to text helps decode data stored in hex format, which is common in programming, networking, and data analysis.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Hex To Text completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Hex To Text is 100% free and requires no registration, login, or subscription. You can use it unlimited times without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large hexadecimal strings?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool can handle large hex strings, though performance may vary depending on your browser and device specifications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What format should my hex input be in?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Enter hex values as pairs of characters separated by spaces (48 65 6C 6C 6F) or on separate lines. The tool accepts both uppercase and lowercase hex characters.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use uppercase or lowercase hex characters interchangeably - the tool recognizes both formats equally well</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Separate hex pairs with spaces for clarity, making it easier to identify individual character codes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy and save your converted text immediately, as page refreshes will clear your results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Double-check your hex input for accuracy, as incorrect values will produce garbled or unexpected text output</li>
          </ul>
        </div>
      </div>
    </div>
  );
}