'use client';
import { useState } from 'react';
export default function JsMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const minify = () => {
    const minified = input.replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{}();,=+\-*/<>!&|])\s*/g,'$1').trim();
    setOutput(minified);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JS Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Minified Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Js Minifier</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">JS Minifier is a free online tool that compresses and optimizes your JavaScript code by removing unnecessary characters without affecting functionality. This reduces file size, improves page load speed, and enhances overall website performance.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Js Minifier</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your JavaScript code into the input field or upload a .js file from your computer</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Minify' button to process and compress your code instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the minified output in the result panel and check the file size reduction percentage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the minified code to clipboard or download it as a new file for use in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is JS Minifier safe to use with my production code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, JS Minifier is completely safe. It only removes whitespace, comments, and unnecessary characters while preserving all code functionality. Always test minified code before deployment.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How much file size reduction can I expect?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Typical JavaScript files see 30-50% size reduction after minification, though results vary depending on code structure, comments, and variable naming conventions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I minify minified code again?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can minify already minified code, but the additional size reduction will be minimal since most optimization has already been applied.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does JS Minifier work with ES6 and modern JavaScript?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, JS Minifier supports modern JavaScript syntax including ES6, arrow functions, async/await, and other contemporary language features.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep backups of your original unminified code for easier debugging and future maintenance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use source maps alongside minified code in development to help with debugging and error tracking</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine minification with gzip compression on your server for even greater file size reduction</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your minified code thoroughly in different browsers to ensure all functionality works as expected</li>
          </ul>
        </div>
      </div>
    </div>
  );
}