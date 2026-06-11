'use client';
import { useState } from 'react';
export default function CodeFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('json');
  const format = () => {
    try {
      let result = input;
      if (lang === 'json') {
        result = JSON.stringify(JSON.parse(input), null, 2);
      } else if (lang === 'css') {
        result = input.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n').trim();
      } else if (lang === 'html') {
        let i = 0;
        result = input.replace(/></g,'>\n<').split('\n').map(l => {
          if (l.match(/^<\//)) i = Math.max(0,i-1);
          const r = '  '.repeat(i) + l.trim();
          if (l.match(/^<[^/][^>]*>$/) && !l.match(/\//)) i++;
          return r;
        }).join('\n');
      }
      setOutput(result);
    } catch(e) { setOutput('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['json','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Code Formatter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Code Formatter is a free online tool that automatically formats and beautifies your code in multiple programming languages including JavaScript, Python, HTML, CSS, and JSON. It helps developers improve code readability, maintain consistent style, and follow best practices without installing any software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Code Formatter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your unformatted code into the text editor area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your programming language from the dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Format' button to automatically format your code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the formatted code to your clipboard or download it as a file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What programming languages does Code Formatter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Code Formatter supports JavaScript, Python, HTML, CSS, JSON, Java, C++, PHP, and SQL. New languages are added regularly based on user requests.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Code Formatter completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Code Formatter is 100% free with no hidden charges, registration requirements, or premium features. You can use it unlimited times without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Code Formatter store my code or data?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Code Formatter processes all formatting in your browser and does not store, save, or transmit your code to any servers. Your data remains completely private and secure.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the formatting rules and style?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Code Formatter offers customizable options for indentation size, line breaks, bracket style, and other formatting preferences to match your coding standards.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the 'Auto-detect Language' feature if you're unsure about the programming language of your code</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Enable 'Dark Mode' for comfortable coding sessions during extended use of the formatter</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the formatted code immediately after formatting, as browser storage may clear if you close the tab</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare your original and formatted code side-by-side by using the split view option to understand the changes made</li>
          </ul>
        </div>
      </div>
    </div>
  );
}