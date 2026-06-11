'use client';
import { useState } from 'react';
export default function UnicodeConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toUnicode = () => setOutput(input.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join(''));
  const fromUnicode = () => setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g,(_,code) => String.fromCharCode(parseInt(code,16))));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unicode Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to Unicode escapes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or unicode..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">To Unicode</button>
            <button onClick={fromUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">From Unicode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Unicode Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Unicode Converter is a free online tool that instantly converts text between different Unicode formats, character encodings, and scripts. Whether you need to convert characters to Unicode code points, hexadecimal values, or transform text between various writing systems, this tool handles all conversions quickly and accurately.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Unicode Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter or paste your text into the input field on the Unicode Converter homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the source format or character encoding you want to convert from using the dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your desired target Unicode format or encoding from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Convert button to instantly see your converted text in the output field</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What Unicode formats does this converter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The Unicode Converter supports multiple formats including UTF-8, UTF-16, UTF-32, Unicode code points, hexadecimal notation, HTML entities, and various other character encodings commonly used in web development and programming.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Unicode Converter free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Unicode Converter is completely free with no registration required. You can convert unlimited text without any hidden fees or limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert emoji and special characters?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely. The Unicode Converter handles emoji, special characters, accented letters, and symbols from all languages and scripts supported by Unicode standards.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all conversions are processed locally in your browser. Your text is never stored on servers, ensuring complete privacy and security while using the Unicode Converter.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy and paste large documents directly into the converter to batch process multiple characters at once instead of converting them individually</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the Unicode Converter to debug encoding issues in your code by converting between different formats to identify character encoding problems</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick reference when working with international text, emoji, or special characters in web development projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check the hexadecimal output to understand how characters are represented in different systems, which is useful for programming and technical documentation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}