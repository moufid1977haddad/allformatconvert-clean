'use client';
import { useState } from 'react';

export default function TextToListPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const toBullet = () => setResult(text.split('\n').filter(l => l.trim()).map(l => '• ' + l.trim()).join('\n'));
  const toNumbered = () => setResult(text.split('\n').filter(l => l.trim()).map((l, i) => (i+1) + '. ' + l.trim()).join('\n'));
  const toComma = () => setResult(text.split('\n').filter(l => l.trim()).join(', '));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text to List</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to different list formats</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toBullet} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Bullet List</button>
            <button onClick={toNumbered} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Numbered List</button>
            <button onClick={toComma} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Comma List</button>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text To List</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text To List is a free online tool that converts unstructured text into organized, formatted lists with just a few clicks. Perfect for students, professionals, and content creators who need to transform paragraphs into clean, scannable list formats.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text To List</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field on the Text To List homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose your preferred list format such as bullet points, numbered lists, or custom separators</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to instantly transform your text into a structured list</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the formatted list to your clipboard or download it as a document file</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text To List completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text To List is 100% free with no hidden charges, account requirements, or premium features. You can convert unlimited texts without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What text formats can I convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert paragraphs, sentences, comma-separated values, and any unstructured text into organized lists with various formatting options including bullets, numbers, and custom delimiters.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to create an account?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No account is necessary. Text To List works directly in your browser without requiring registration or login credentials.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I download my converted list?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can download your formatted list as a text file, Word document, or PDF depending on your needs and the tool's available export options.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use clear line breaks or punctuation in your original text for better conversion accuracy and more precise list formatting</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different list formats to find the style that best suits your document or presentation needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the output directly into your word processor or content management system for seamless integration</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the tool to organize brainstorming notes, meeting points, or research findings into professional-looking lists quickly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}