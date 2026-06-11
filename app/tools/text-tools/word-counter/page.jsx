'use client';
import { useState } from 'react';

export default function WordCounterPage() {
  const [text, setText] = useState('');
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n+/).filter(p => p.trim()).length;
  const readingTime = Math.ceil(words / 200);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Word Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count words, characters and sentences</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{words}</div><div className="text-neutral-400 text-sm mt-1">Words</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{characters}</div><div className="text-neutral-400 text-sm mt-1">Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{charactersNoSpaces}</div><div className="text-neutral-400 text-sm mt-1">No Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{sentences}</div><div className="text-neutral-400 text-sm mt-1">Sentences</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{paragraphs}</div><div className="text-neutral-400 text-sm mt-1">Paragraphs</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{readingTime}</div><div className="text-neutral-400 text-sm mt-1">Min Read</div></div>
          </div>
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Word Counter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Word Counter is a free online tool that instantly analyzes your text to count words, characters, sentences, and paragraphs. Perfect for writers, students, and professionals who need quick text statistics without any sign-up or installation required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Word Counter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the main text box on the Word Counter homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically calculates and displays word count, character count, and other metrics in real-time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>View detailed statistics including sentences, paragraphs, reading time, and character breakdown</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy your results or clear the text to analyze another piece of content</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Word Counter really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Word Counter is completely free with no hidden charges, registration required, or premium features. You can use it unlimited times.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does Word Counter save my text data?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Word Counter processes your text only in your browser and does not save or store any of your content on our servers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use Word Counter for academic essays?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely, Word Counter is ideal for academic work and helps you meet essay word count requirements for assignments and applications.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What text statistics does Word Counter provide?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Word Counter provides word count, character count with and without spaces, sentence count, paragraph count, reading time, and keyword density analysis.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Word Counter to track your writing progress and set daily word count goals for your projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy and paste from Google Docs, Microsoft Word, or any text editor to instantly analyze your document statistics</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check character count when posting on social media platforms that have character limits like Twitter or Instagram</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the reading time estimate feature to understand how long it takes for your audience to read your content</li>
          </ul>
        </div>
      </div>
    </div>
  );
}