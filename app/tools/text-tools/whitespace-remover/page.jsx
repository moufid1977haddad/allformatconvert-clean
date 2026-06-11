'use client';
import { useState } from 'react';

export default function WhitespaceRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const removeAll = () => setResult(text.replace(/\s+/g, ' ').trim());
  const removeExtra = () => setResult(text.replace(/[ \t]+/g, ' ').trim());
  const removeLeading = () => setResult(text.split('\n').map(l => l.trimStart()).join('\n'));
  const removeTrailing = () => setResult(text.split('\n').map(l => l.trimEnd()).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Whitespace Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove extra spaces from text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={removeAll} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove All Extra</button>
            <button onClick={removeExtra} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Extra Spaces</button>
            <button onClick={removeLeading} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Leading</button>
            <button onClick={removeTrailing} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Trailing</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Whitespace Remover</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Whitespace Remover is a free online tool that eliminates extra spaces, tabs, and line breaks from your text instantly. Perfect for cleaning up code, formatting documents, and preparing text for processing without any downloads or sign-ups required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Whitespace Remover</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field on the Whitespace Remover page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Remove Whitespace' button to process your text automatically</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the cleaned text in the output field, which removes all unnecessary spaces and line breaks</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the result to your clipboard using the 'Copy' button and paste it wherever needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Whitespace Remover remove all spaces from my text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, it removes only extra and unnecessary whitespace while preserving single spaces between words for readability and proper formatting.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all processing happens directly in your browser and no data is stored on our servers or sent anywhere else.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Whitespace Remover on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, the tool is fully responsive and works seamlessly on smartphones, tablets, and desktop computers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What types of whitespace does this tool remove?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">It removes extra spaces, tabs, multiple line breaks, and leading/trailing whitespace while maintaining the structure of your content.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Whitespace Remover before pasting code into documentation or forums to ensure clean, properly formatted snippets</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove excess whitespace from CSV or data files to improve compatibility with spreadsheet applications and databases</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Clean up text copied from PDFs or web pages that often contain unnecessary formatting and extra spaces</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Process multiple pieces of text sequentially by clearing the fields and repeating the process for different content blocks</li>
          </ul>
        </div>
      </div>
    </div>
  );
}