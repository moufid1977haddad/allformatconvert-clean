'use client';
import { useState } from 'react';

export default function TextReverserPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const reverseText = () => setResult(text.split('').reverse().join(''));
  const reverseWords = () => setResult(text.split(' ').reverse().join(' '));
  const reverseLines = () => setResult(text.split('\n').reverse().join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Reverser</h1>
        <p className="text-neutral-500 text-center mb-8">Reverse any text, words or lines</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={reverseText} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Text</button>
            <button onClick={reverseWords} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Words</button>
            <button onClick={reverseLines} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Lines</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Reverser</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Reverser is a free online tool that instantly reverses any text you input, flipping the order of characters from end to beginning. Perfect for creating palindromes, obfuscating text, or simply having fun with word manipulation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Reverser</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Text Reverser tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type the text you want to reverse in the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Reverse' button to instantly transform your text</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the reversed text from the output field and use it wherever needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Reverser completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Reverser is 100% free with no hidden charges, registration requirements, or premium features. You can reverse unlimited text without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Text Reverser work with special characters and numbers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely. Text Reverser handles all characters including letters, numbers, spaces, punctuation marks, and special symbols, reversing them exactly as they appear.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my text data stored or shared when I use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your privacy is protected. Text Reverser processes your input locally and does not store, log, or share any of your data with third parties.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I reverse text in different languages?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Reverser works with any language including English, Spanish, French, Chinese, Arabic, and more. It reverses the character order regardless of the language.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Text Reverser to create palindromes and test whether words or phrases read the same forwards and backwards</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Reverse text for fun social media posts, email signatures, or creative writing projects to catch your audience's attention</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine Text Reverser with other tools to obfuscate sensitive information or create simple ciphers for word games and puzzles</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy and paste large blocks of text into the tool to quickly reverse entire paragraphs, poetry, or code snippets without manual effort</li>
          </ul>
        </div>
      </div>
    </div>
  );
}