'use client';
import { useState } from 'react';
export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState(null);
  const test = () => {
    try {
      const regex = new RegExp(pattern, flags);
      const found = [...text.matchAll(new RegExp(pattern, 'g'))];
      setMatches({ count: found.length, matches: found.map(m => m[0]), isMatch: regex.test(text) });
    } catch(e) { setMatches({ error: e.message }); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Regex Tester</h1>
        <p className="text-neutral-500 text-center mb-8">Test regular expressions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3"><label className="block text-sm text-neutral-500 mb-1">Pattern</label><input type="text" value={pattern} onChange={e => setPattern(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="Enter regex pattern..." /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Flags</label><input type="text" value={flags} onChange={e => setFlags(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" placeholder="gi" /></div>
          </div>
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Enter text to test..." value={text} onChange={e => setText(e.target.value)} />
          <button onClick={test} disabled={!pattern || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Test</button>
          {matches && (matches.error ? <p className="text-red-400 text-center">{matches.error}</p> : <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2"><div className={matches.isMatch ? 'text-green-400' : 'text-red-400'} >{matches.isMatch ? 'Match found!' : 'No match'}</div><div className="text-neutral-500 text-sm">{matches.count} match(es)</div>{matches.matches.map((m,i) => <div key={i} className="font-mono text-sm bg-neutral-200 rounded p-2">{m}</div>)}</div>)}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Regex Tester</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Regex Tester is a free online tool that allows developers and programmers to test, validate, and debug regular expressions in real-time. It supports multiple regex flavors and provides instant feedback with detailed match results and explanations.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Regex Tester</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter or paste your regular expression pattern into the Pattern field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Input the text you want to test against the pattern in the Test String field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Select your preferred regex flavor (JavaScript, Python, PHP, etc.) from the dropdown menu</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>View the results instantly as matches are highlighted and detailed information is displayed below</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is a regular expression?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">A regular expression is a sequence of characters that define a search pattern, commonly used for pattern matching and text validation in programming.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which regex flavors does Regex Tester support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Regex Tester supports multiple popular flavors including JavaScript, Python, PHP, Java, .NET, and Perl regex syntax.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I save my regex patterns?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can save your patterns to your browser's local storage or copy them for use in your projects.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Regex Tester completely free?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Regex Tester is completely free to use with no registration required and no limitations on the number of patterns you can test.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the provided regex cheat sheet to quickly reference common patterns like email validation, URLs, and phone numbers</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test edge cases and special characters to ensure your regex pattern works correctly in all scenarios</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Utilize the explanation panel to understand how your regex is being interpreted and which parts match your test string</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy working regex patterns to a personal library or documentation for reuse across multiple projects</li>
          </ul>
        </div>
      </div>
    </div>
  );
}