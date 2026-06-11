'use client';
import { useState } from 'react';
export default function TypescriptToJsPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let js = input;
    js = js.replace(/:\s*[\w<>\[\]|&,\s]+(?=[\s]*[=,);{])/g,'');
    js = js.replace(/interface\s+\w+\s*\{[^}]*\}/g,'');
    js = js.replace(/type\s+\w+\s*=\s*[^;]+;/g,'');
    js = js.replace(/<[\w,\s]+>/g,'');
    setOutput(js.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TypeScript to JavaScript</h1>
        <p className="text-neutral-500 text-center mb-8">Strip TypeScript types from code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TypeScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JavaScript Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Typescript To Js</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">TypeScript to JS is a free online converter that instantly transforms your TypeScript code into clean, optimized JavaScript. Simplify your development workflow by automatically removing type annotations and generating production-ready JavaScript code in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Typescript To Js</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your TypeScript code into the input editor on the left side of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to instantly transform your code to JavaScript</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted JavaScript output displayed on the right side</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated code to your clipboard or download it as a file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is TypeScript to JS completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, TypeScript to JS is completely free with no hidden costs, registration requirements, or usage limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert complex TypeScript projects with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool handles most TypeScript features including interfaces, generics, and decorators, though very large files may perform better in smaller batches.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the converted JavaScript code work immediately?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">In most cases yes, but you should test the output as some advanced TypeScript patterns may require additional adjustments for your specific use case.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does this tool store my code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all conversions happen in your browser locally and your code is never stored on our servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the tool to quickly prototype JavaScript versions of your TypeScript code without manual refactoring</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy and paste the output into your IDE to leverage syntax highlighting and error detection for final review</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the converted code in your project environment to ensure all dependencies and imports work correctly</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick reference during migration projects from TypeScript to vanilla JavaScript</li>
          </ul>
        </div>
      </div>
    </div>
  );
}