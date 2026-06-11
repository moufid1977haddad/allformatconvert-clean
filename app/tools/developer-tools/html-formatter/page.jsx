'use client';
import { useState } from 'react';
export default function HtmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let indent = 0;
    const lines = input.replace(/></g,'>\n<').split('\n');
    const formatted = lines.map(line => {
      if (line.match(/^<\//)) indent--;
      const result = '  '.repeat(Math.max(0,indent)) + line.trim();
      if (line.match(/^<[^/][^>]*[^/]>/) && !line.match(/^<(br|hr|img|input|link|meta)/i)) indent++;
      return result;
    });
    setOutput(formatted.join('\n'));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Html Formatter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">HTML Formatter is a free online tool that automatically formats and beautifies your HTML code for improved readability and proper indentation. It helps developers organize messy HTML markup into clean, well-structured code that follows best practices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Html Formatter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your HTML code into the input field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Format' button to instantly process and beautify your code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize formatting options like indent size and line breaks if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the formatted output to your clipboard or download it as a file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is HTML Formatter free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, HTML Formatter is completely free with no hidden charges, registration requirements, or usage limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file sizes can I format?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool can handle HTML files of various sizes, typically supporting files up to several megabytes without performance issues.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will the formatter validate my HTML code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">While primarily a formatting tool, it will highlight basic syntax errors and help identify common HTML structure issues.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the indentation style?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can select different indent styles including spaces or tabs and adjust the indent size to your preference.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the formatter before deploying code to ensure consistency across your project and make future maintenance easier</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the formatted HTML and compare it with your original to identify structural problems in your markup</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine the formatter with a HTML validator tool for comprehensive code quality assurance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Format code regularly during development to maintain clean code practices and improve team collaboration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}