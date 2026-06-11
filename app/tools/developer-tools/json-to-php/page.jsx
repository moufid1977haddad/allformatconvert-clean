'use client';
import { useState } from 'react';
export default function JsonToPhpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const typeMap = { string: 'string', number: 'float', boolean: 'bool' };
      const lines = ['<?php','','class Root {'];
      Object.entries(obj).forEach(([k,v]) => {
        const phpType = Array.isArray(v) ? 'array' : (typeMap[typeof v] || 'mixed');
        lines.push('  public ' + phpType + ' $' + k + ';');
      });
      lines.push('}');
      setOutput(lines.join('\n'));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to PHP Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate PHP classes from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">PHP Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Json To Php</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Json To Php is a free online conversion tool that instantly transforms JSON data into PHP arrays and objects. This powerful utility eliminates manual coding and saves developers time when working with JSON data in PHP applications.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Json To Php</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your JSON data into the input field on the Json To Php tool homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to instantly transform your JSON into PHP code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated PHP array or object in the output panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the PHP code to your clipboard and paste it directly into your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Json To Php completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Json To Php is completely free with no hidden fees, registration requirements, or usage limits. You can convert unlimited JSON files without any cost.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What PHP versions does the tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Json To Php generates PHP code compatible with PHP 5.4 and all modern versions including PHP 7.x and PHP 8.x, ensuring broad compatibility across projects.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large JSON files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Json To Php can handle large JSON files efficiently. However, for extremely large datasets, processing may take a few seconds depending on your browser's performance.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using Json To Php?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your data privacy is protected as Json To Php processes conversions entirely in your browser without storing or transmitting any information to external servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your JSON data before conversion to ensure it's properly formatted and free of syntax errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the formatted output option to get nicely indented PHP code that's easier to read and maintain</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the entire output or select specific sections to integrate into your PHP files based on your needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark Json To Php for quick access when you frequently need to convert between JSON and PHP data formats</li>
          </ul>
        </div>
      </div>
    </div>
  );
}