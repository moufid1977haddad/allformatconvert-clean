'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextSorterPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const sortAZ = () => { setResult(text.split('\n').sort().join('\n')); setHasResult(true); };
  const sortZA = () => { setResult(text.split('\n').sort().reverse().join('\n')); setHasResult(true); };
  const sortByLength = () => { setResult(text.split('\n').sort((a, b) => a.length - b.length).join('\n')); setHasResult(true); };
  const shuffle = () => {
    const lines = text.split('\n');
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setResult(lines.join('\n'));
    setHasResult(true);
  };
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
          {hasResult && (result ? (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title="Text Sorter"
        description="Text Sorter organizes lines of text alphabetically (A-Z or Z-A), by line length, or in random order, entirely in your browser."
        howTo={[
          "Paste your text into the input box, with one entry per line.",
          "Click \"Sort A-Z\", \"Sort Z-A\", \"Sort by Length\", or \"Shuffle\" to organize your lines.",
          "Review the result in the output box.",
          "Click \"Copy\" to copy the sorted text to your clipboard."
        ]}
        faqs={[
          { q: "Is Text Sorter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is sorting case-sensitive?", a: "Yes, always — alphabetical sorting uses standard character-code order, so uppercase letters sort before lowercase ones. There's no toggle to change this." },
          { q: "Can I sort numbers numerically?", a: "Not specifically — lines are sorted as text, so \"10\" would sort before \"9\" alphabetically. There's no dedicated numeric sort mode." },
          { q: "Is my data private?", a: "Yes, all sorting happens locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "If you need case-insensitive sorting, convert your text to one consistent case first with Case Converter.",
          "Use \"Sort by Length\" to quickly find your shortest or longest entries in a list.",
          "\"Shuffle\" randomizes line order — handy for randomizing quiz questions or picking a random item from a list.",
          "Remove duplicate lines with the Duplicate Remover tool before sorting for a cleaner final result."
        ]}
      />
    </div>
  );
}