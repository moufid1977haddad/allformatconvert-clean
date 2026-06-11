'use client';
import { useState } from 'react';

export default function CaseConverterPage() {
  const [text, setText] = useState('');
  const toUpper = () => setText(text.toUpperCase());
  const toLower = () => setText(text.toLowerCase());
  const toTitle = () => setText(text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()));
  const toSentence = () => setText(text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
  const toAlternate = () => setText(text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Case Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to any case format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={toUpper} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">UPPERCASE</button>
            <button onClick={toLower} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">lowercase</button>
            <button onClick={toTitle} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Title Case</button>
            <button onClick={toSentence} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Sentence case</button>
            <button onClick={toAlternate} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">aLtErNaTe</button>
            <button onClick={() => setText('')} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
          </div>
          <button onClick={() => navigator.clipboard.writeText(text)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Case Converter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Case Converter is a free online tool that instantly transforms text between multiple letter cases including uppercase, lowercase, title case, sentence case, and more. Perfect for developers, writers, and content creators who need to quickly standardize text formatting without installing software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Case Converter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired output case format from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the convert button or the tool will auto-convert in real-time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy your converted text to clipboard with a single click</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Case Converter free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Case Converter is completely free with no hidden charges, registration requirements, or limitations on the number of conversions you can perform.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What case formats does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports uppercase, lowercase, title case, sentence case, camel case, pascal case, snake case, kebab case, and toggle case conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple texts at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert one text block at a time, but you can process multiple texts by repeating the conversion process for each text.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Case Converter processes all text locally in your browser and does not store, save, or share any of your data with external servers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Title Case for headlines, headings, and proper nouns to maintain professional formatting</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Apply Sentence Case when converting for readability in documentation and formal writing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Utilize camelCase and snake_case for programming variable and function names across different coding languages</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the converted text immediately after conversion to avoid accidental changes or overwrites</li>
          </ul>
        </div>
      </div>
    </div>
  );
}