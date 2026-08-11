'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextComparatorPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState(null);

  const compare = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const diff = [];
    for (let i = 0; i < maxLines; i++) {
      const l1 = lines1[i] || '';
      const l2 = lines2[i] || '';
      diff.push({ l1, l2, same: l1 === l2 });
    }
    setResult(diff);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Comparator</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two texts side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 1</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste first text here..." value={text1} onChange={e => setText1(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 2</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste second text here..." value={text2} onChange={e => setText2(e.target.value)} />
            </div>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Compare</button>
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500 text-center">{result.filter(r => !r.same).length} difference(s) found</p>
              {result.map((r, i) => (
                <div key={i} className={`grid grid-cols-2 gap-2 p-2 rounded-lg ${r.same ? 'bg-neutral-800 text-neutral-100' : 'bg-red-900/30'}`}>
                  <div className="text-sm font-mono">{r.l1 || <span className="text-neutral-600">empty</span>}</div>
                  <div className="text-sm font-mono">{r.l2 || <span className="text-neutral-600">empty</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text Comparator"
        description="Text Comparator compares two texts line by line, highlighting which lines match exactly and which don't, entirely in your browser. Note: comparison is a whole-line exact match, not a character-level or word-level diff — a line with even one different character is simply marked as different, without showing exactly what changed within it."
        howTo={[
          "Paste your first text into the \"Text 1\" box.",
          "Paste your second text into the \"Text 2\" box.",
          "Click \"Compare\" to check both texts line by line.",
          "Review the results — matching lines and differing lines are shown side by side, with a count of differences found."
        ]}
        faqs={[
          { q: "Is Text Comparator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it highlight exactly which words or characters changed within a line?", a: "No — comparison works at the whole-line level. A line is marked as either identical or different; it doesn't pinpoint the specific word or character that changed." },
          { q: "Can I compare long documents?", a: "Yes, though very large texts are limited only by your browser's performance since everything runs locally." },
          { q: "Is my data private?", a: "Yes, comparison happens entirely in your browser — neither text is uploaded to a server." }
        ]}
        tips={[
          "Since comparison is line-by-line, make sure both texts use consistent line breaks for a meaningful comparison.",
          "For code or documents where you need to see exactly which words changed within a line, use a dedicated word-level diff tool instead.",
          "A shifted line (e.g., one extra blank line inserted early in one text) will cause every line after it to show as different — check for that if you see unexpectedly many differences.",
          "Manually copy the results if you need them elsewhere, since there's no built-in copy or export button for the comparison output."
        ]}
      />
    </div>
  );
}