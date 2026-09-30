'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { diffLines } from '../../../lib/codeTools';

export default function TextComparatorPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState(null);
  // Myers line diff, then removed/added runs paired side by side. The old
  // version compared line N with line N: one inserted line marked every line
  // after it as different (29/09).
  const compare = async () => {
    const d = await diffLines(text1, text2);
    const rows = [];
    for (let i = 0; i < d.length;) {
      if (d[i].type === 'same') { rows.push({ l1: d[i].line, l2: d[i].line, same: true }); i++; continue; }
      const rem = [], add = [];
      while (i < d.length && d[i].type === 'removed') rem.push(d[i++].line);
      while (i < d.length && d[i].type === 'added') add.push(d[i++].line);
      for (let k = 0; k < Math.max(rem.length, add.length); k++) rows.push({ l1: rem[k] ?? '', l2: add[k] ?? '', same: false });
    }
    setResult(rows);
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
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Compare</button>
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
        title={"Text Comparator"}
        description={"Text Comparator compares two texts line by line and shows them side by side, entirely in your browser. It uses the Myers diff algorithm (the one git and diffchecker use), so an added or deleted line is shown as just that line — the lines after it are still matched with their counterparts instead of all being marked as different. Changed lines are paired across the two columns; Windows and Unix line endings compare as equal."}
        howTo={[
          "Paste the first text on the left and the second on the right.",
          "Click 'Compare'.",
          "Matching lines are grey, differing lines are highlighted, with the number of differences above.",
          "Edit and compare again as needed."
        ]}
        faqs={[
          { q: "Is Text Comparator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What if a line was inserted in the middle?", a: "Only that line is shown as a difference; the rest of the text stays aligned." },
          { q: "Does it compare words within a line?", a: "It compares whole lines; a changed line is shown next to its new version so you can spot the edit." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "For code, the Diff Viewer shows line numbers and can ignore whitespace.",
          "Trailing spaces count as a difference; remove them first with the Whitespace Remover if they don't matter."
        ]}
      />
    </div>
  );
}