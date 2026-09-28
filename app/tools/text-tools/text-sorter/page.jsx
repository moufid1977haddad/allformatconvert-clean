'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sortLines, splitLines } from '../../../lib/textTools';

export default function TextSorterPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const sortAZ = () => { setResult(sortLines(text, 'az')); setHasResult(true); };
  const sortZA = () => { setResult(sortLines(text, 'za')); setHasResult(true); };
  const sortByLength = () => { setResult(sortLines(text, 'length')); setHasResult(true); };
  const shuffle = () => {
    const lines = splitLines(text);
    const rnd = new Uint32Array(lines.length);
    crypto.getRandomValues(rnd);
    for (let i = lines.length - 1; i > 0; i--) {
      const j = rnd[i] % (i + 1);
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
        title={"Text Sorter"}
        description={"Text Sorter sorts lines alphabetically (A-Z or Z-A), by length, or in random order, entirely in your browser. Alphabetical order is the one people expect, not raw character codes: upper and lower case sort together (apple, Banana, cherry), accented letters sit next to their base letter (éclair before zebra), and numbers inside lines are compared by value (item 2 before item 10). Windows line endings are handled, and length counts characters as you see them."}
        howTo={[
          "Paste the lines to sort.",
          "Click A-Z, Z-A, By Length or Shuffle.",
          "Review the result.",
          "Copy it."
        ]}
        faqs={[
          { q: "Is Text Sorter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is sorting case-sensitive?", a: "No — Apple and apple sort together, as in a dictionary; when two lines differ only by case or accents, the order is still stable and predictable." },
          { q: "How are numbers sorted?", a: "By value when they appear at the same place in the line: file2 comes before file10." },
          { q: "Is the shuffle really random?", a: "Yes — it uses the browser's cryptographic random generator with an unbiased Fisher-Yates shuffle." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Remove duplicates first with the Duplicate Remover if needed.",
          "Sort by length orders from shortest to longest; lines of the same length are alphabetical."
        ]}
      />
    </div>
  );
}