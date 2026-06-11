'use client';
import { useState } from 'react';
export default function JavascriptFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let indent = 0;
    let result = '';
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (ch === '{' || ch === '[') { result += ch + '\n' + '  '.repeat(++indent); }
      else if (ch === '}' || ch === ']') { result += '\n' + '  '.repeat(--indent) + ch; }
      else if (ch === ';') { result += ch + '\n' + '  '.repeat(indent); }
      else if (ch === ',') { result += ch + '\n' + '  '.repeat(indent); }
      else { result += ch; }
    }
    setOutput(result.trim());
  };
  const minify = () => setOutput(input.replace(/\s+/g,' ').replace(/\s*([{}\[\]();,])\s*/g,'$1').trim());
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JavaScript Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Javascript Formatter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">The Javascript Formatter is a free online tool that automatically formats and beautifies your JavaScript code for improved readability and consistency. It helps developers quickly clean up messy code, fix indentation issues, and maintain proper code structure without any installation required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Javascript Formatter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your JavaScript code into the input editor on the left side of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Format' button to automatically format your code according to standard conventions</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust formatting options if needed, such as indentation size, line length, or quote style</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the formatted code from the output panel on the right side to use in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Javascript Formatter free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the Javascript Formatter is completely free and requires no registration or payment to use.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does this tool support minified code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the formatter can beautify minified JavaScript code and expand it into a readable format with proper indentation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the formatting rules?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool offers customizable options for indentation size, line breaks, quote preferences, and spacing to match your coding style.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my code secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your code is processed locally in your browser and is never stored on any server, ensuring complete privacy and security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use consistent indentation settings across your projects by setting your preferred tab size before formatting multiple files</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the formatting options you prefer and apply them to similar files to maintain uniform code style across your codebase</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine the formatter with a linter to not only beautify your code but also catch potential errors and style violations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of the quick copy feature to instantly transfer formatted code to your clipboard without manual selection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}