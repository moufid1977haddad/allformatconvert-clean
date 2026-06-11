'use client';
import { useState } from 'react';

export default function DuplicateRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const removeDuplicates = () => {
    const lines = text.split('\n');
    const unique = [...new Set(lines)];
    setResult(unique.join('\n'));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Duplicate Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove duplicate lines from text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <button onClick={removeDuplicates} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Remove Duplicates</button>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Duplicate Remover</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Duplicate Remover is a free online tool that instantly identifies and eliminates duplicate entries from your text, lists, and data without requiring any software installation. Simply paste your content and let our efficient algorithm clean up redundant items, saving you time and improving data quality.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Duplicate Remover</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Duplicate Remover website and locate the text input area on the main page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste your text, list, or data containing duplicate entries into the designated input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Remove Duplicates' button to process your content and identify all redundant items</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the cleaned results from the output field and use your duplicate-free data wherever needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Duplicate Remover truly free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Duplicate Remover is completely free with no hidden charges, registration requirements, or premium versions needed to access full functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can Duplicate Remover handle large files or lists?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Duplicate Remover can process large amounts of text efficiently, though extremely large files may take a few additional seconds to process depending on your internet connection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my data be saved or shared when using Duplicate Remover?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your data is processed locally and never stored on our servers, ensuring complete privacy and security for your sensitive information.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Duplicate Remover work on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Duplicate Remover is fully responsive and works seamlessly on smartphones, tablets, and desktop computers through any modern web browser.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Duplicate Remover before importing data into spreadsheets or databases to ensure clean, accurate records</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try the 'Case Sensitive' option if you need to preserve capitalization differences when identifying duplicates</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy and paste your results into a document immediately to avoid losing your cleaned data</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Duplicate Remover regularly when managing email lists, inventory data, or customer databases for optimal data quality</li>
          </ul>
        </div>
      </div>
    </div>
  );
}