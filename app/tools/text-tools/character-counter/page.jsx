'use client';
import { useState } from 'react';

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const chars = text.length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const numbers = (text.match(/[0-9]/g) || []).length;
  const spaces = (text.match(/\s/g) || []).length;
  const special = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Character Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count characters in real time</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{chars}</div><div className="text-neutral-400 text-sm mt-1">Total Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{letters}</div><div className="text-neutral-400 text-sm mt-1">Letters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{numbers}</div><div className="text-neutral-400 text-sm mt-1">Numbers</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{spaces}</div><div className="text-neutral-400 text-sm mt-1">Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{special}</div><div className="text-neutral-400 text-sm mt-1">Special</div></div>
          </div>
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Character Counter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Character Counter is a free online tool that instantly counts characters, words, sentences, and paragraphs in any text you paste or type. Perfect for writers, students, and professionals who need to monitor text length for essays, tweets, social media posts, and content optimization.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Character Counter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Character Counter tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type your text into the input box</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>View real-time character and word counts displayed instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Use the results to adjust your content to meet specific length requirements</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Character Counter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Character Counter is completely free with no hidden charges, registration required, or premium features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does the tool count spaces as characters?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, by default spaces are included in the character count, but you can toggle this option to exclude them if needed.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use this tool on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, Character Counter works on all devices including smartphones, tablets, and desktop computers with any modern browser.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum text length I can analyze?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">There is no practical limit to the text length you can analyze with our Character Counter tool.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Character Counter to ensure your social media posts fit within platform character limits like Twitter's 280-character restriction</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Monitor your essay or article length in real-time to stay within assignment requirements and word count guidelines</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Utilize the word count feature to estimate reading time and adjust content density for better audience engagement</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Toggle between different counting modes to exclude spaces or special characters when optimizing for specific content guidelines</li>
          </ul>
        </div>
      </div>
    </div>
  );
}