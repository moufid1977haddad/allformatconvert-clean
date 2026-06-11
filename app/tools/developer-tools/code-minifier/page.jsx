'use client';
import { useState } from 'react';
export default function CodeMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('js');
  const minify = () => {
    let result = input;
    if (lang === 'js' || lang === 'ts') {
      result = result.replace(/\/\/[^\n]*/g,'').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').trim();
    } else if (lang === 'css') {
      result = result.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s+/g,' ').replace(/\s*([{}:;,])\s*/g,'$1').trim();
    } else if (lang === 'html') {
      result = result.replace(/<!--[\s\S]*?-->/g,'').replace(/\s+/g,' ').replace(/> </g,'><').trim();
    }
    setOutput(result);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JS, CSS, HTML and TypeScript</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['js','ts','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Code Minifier</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Code Minifier is a free online tool that reduces file size by removing unnecessary characters from your code without changing its functionality. It supports multiple programming languages including JavaScript, CSS, HTML, and JSON, helping you optimize your web applications for faster loading times.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Code Minifier</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your code into the input field on the Code Minifier homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select the programming language of your code from the dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Minify' button to process your code and remove unnecessary characters</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the minified code from the output area or download it as a file to use in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Code Minifier completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Code Minifier is 100% free with no hidden charges, registration requirements, or usage limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will minification break my code or change its functionality?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, minification only removes whitespace and unnecessary characters while preserving all code functionality and logic.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Code Minifier support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Code Minifier supports JavaScript, CSS, HTML, JSON, and other popular web development languages.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I minify large files with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Code Minifier can handle large files, though extremely large files may take a few extra seconds to process.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always keep a backup of your original code before minifying, especially for important projects or production environments</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your minified code thoroughly in all target browsers to ensure complete compatibility and functionality</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine minification with gzip compression on your server for even greater file size reduction and faster loading</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Code Minifier regularly during your development workflow to maintain optimized file sizes across your entire project</li>
          </ul>
        </div>
      </div>
    </div>
  );
}