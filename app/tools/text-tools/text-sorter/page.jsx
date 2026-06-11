'use client';
import { useState } from 'react';

export default function TextSorterPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const sortAZ = () => setResult(text.split('\n').sort().join('\n'));
  const sortZA = () => setResult(text.split('\n').sort().reverse().join('\n'));
  const sortByLength = () => setResult(text.split('\n').sort((a, b) => a.length - b.length).join('\n'));
  const shuffle = () => setResult(text.split('\n').sort(() => Math.random() - 0.5).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Sorter</h1>
        <p className="text-neutral-500 text-center mb-8">Sort lines alphabetically or by length</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={sortAZ} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sort A-Z</button>
            <button onClick={sortZA} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sort Z-A</button>
            <button onClick={sortByLength} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sort by Length</button>
            <button onClick={shuffle} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Shuffle</button>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Sorter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Sorter is a free online tool that instantly organizes and arranges text in multiple ways, including alphabetical order, reverse order, and custom sorting options. Perfect for students, professionals, and anyone needing to quickly organize lists, data, or content without any software installation required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Sorter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input box on the Text Sorter homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired sorting method from the available options such as alphabetical, reverse, or numerical order</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Sort button to instantly process and organize your text</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the sorted results to your clipboard or download the file for future use</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Sorter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Sorter is completely free with no hidden charges, registration requirements, or limitations on usage.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Text Sorter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Text Sorter works with plain text, CSV files, and line-separated data from any source you can copy and paste.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I sort text in languages other than English?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Sorter supports multiple languages and character sets for international text sorting.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using Text Sorter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">All sorting happens locally in your browser with no data transmitted to external servers, ensuring complete privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the case-sensitive option when sorting lists where uppercase and lowercase letters need different ordering</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove duplicate entries before sorting to get a cleaner, more organized final result</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of reverse sorting to quickly arrange lists in descending order without manual effort</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy multiple lists into Text Sorter separated by line breaks to sort complex datasets all at once</li>
          </ul>
        </div>
      </div>
    </div>
  );
}