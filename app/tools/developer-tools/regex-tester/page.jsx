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
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Regex Tester</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Regex Tester tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
  );
}