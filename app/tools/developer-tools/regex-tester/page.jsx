'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function RegexTesterPage() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState(null);
  const test = () => {
    try {
      const regex = new RegExp(pattern, flags);
      const globalFlags = flags.includes('g') ? flags : flags + 'g';
      const found = [...text.matchAll(new RegExp(pattern, globalFlags))];
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
          <button onClick={test} disabled={!pattern || !text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Test</button>
          {matches && (matches.error ? <p className="text-red-400 text-center">{matches.error}</p> : <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 space-y-2"><div className={matches.isMatch ? 'text-green-400' : 'text-red-400'} >{matches.isMatch ? 'Match found!' : 'No match'}</div><div className="text-neutral-500 text-sm">{matches.count} match(es)</div>{matches.matches.map((m,i) => <div key={i} className="font-mono text-sm bg-neutral-200 rounded p-2">{m}</div>)}</div>)}
        </div>
      </div>
      <SeoContent
        title="Regex Tester"
        description="Regex Tester runs your pattern against JavaScript's native RegExp engine, entirely in your browser — nothing is uploaded to a server. It only tests JavaScript regex syntax; there's no flavor selector for Python, PHP, Java, or other engines, no match highlighting within the text, no explanation panel, and no saved pattern library — just a match count and a list of matched substrings."
        howTo={[
          "Type or paste your regex pattern into the Pattern field.",
          "Set flags (e.g. gi for global, case-insensitive) in the Flags field.",
          "Paste the text you want to test into the text area.",
          "Click 'Test' to see whether it matches, how many matches were found, and each matched substring."
        ]}
        faqs={[
          { q: "What is a regular expression?", a: "A pattern-matching syntax used to search, validate, or extract text based on rules rather than exact strings." },
          { q: "Which regex flavors does it support?", a: "Only JavaScript's native regex syntax — there's no flavor selector for Python, PHP, Java, .NET, or Perl." },
          { q: "Does it highlight matches within my text?", a: "No — matched substrings are listed separately below the result, not highlighted inline within the test text." },
          { q: "Can I save my regex patterns?", a: "No, there's no save feature or pattern library — copy patterns elsewhere if you want to keep them." }
        ]}
        tips={[
          "Use the g flag to see every match rather than stopping at the first one.",
          "If your pattern throws an error, check for unescaped special characters or unbalanced parentheses/brackets.",
          "Since only JavaScript regex syntax is supported, patterns relying on features specific to other languages (like Python's named groups syntax) may behave differently or fail.",
          "Test with a range of inputs, including edge cases and empty strings, to confirm your pattern behaves as expected."
        ]}
      />
    </div>
  );
}