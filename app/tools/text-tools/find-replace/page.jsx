'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function FindReplacePage() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [result, setResult] = useState('');
  const [count, setCount] = useState(0);

  const doReplace = () => {
    if (!find) return;
    const regex = new RegExp(find, 'g');
    const matches = (text.match(regex) || []).length;
    setCount(matches);
    setResult(text.replace(regex, replace));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Find and Replace</h1>
        <p className="text-neutral-500 text-center mb-8">Find and replace text instantly</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Find</label>
              <input type="text" value={find} onChange={e => setFind(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Text to find..." />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Replace with</label>
              <input type="text" value={replace} onChange={e => setReplace(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Replace with..." />
            </div>
          </div>
          <button onClick={doReplace} disabled={!text || !find} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Replace All</button>
          {result && (
            <div className="space-y-2">
              <p className="text-green-400 text-sm text-center">{count} replacement(s) made</p>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Find and Replace"
        description="Find and Replace searches your text for every match of a pattern and swaps it with your replacement text, entirely in your browser. Note: the \"Find\" field is always interpreted as a regular expression, not plain literal text — special characters like . * + ( ) [ ] have regex meaning."
        howTo={[
          "Paste your text into the main text box.",
          "Enter your search pattern in the \"Find\" field and your replacement text in the \"Replace with\" field.",
          "Click \"Replace All\" to replace every match in one pass.",
          "Copy your updated text from the output field."
        ]}
        faqs={[
          { q: "Does this tool support regular expressions?", a: "It always uses them — the \"Find\" field is passed directly into a regular expression, so characters like . * + ( ) [ ] ^ $ have special meaning rather than matching themselves literally." },
          { q: "How do I search for a literal special character?", a: "Escape it with a backslash, e.g. use \"3\\.50\" to match the literal text \"3.50\" instead of \"3\" followed by any character followed by \"50\"." },
          { q: "Is matching case-sensitive?", a: "Yes, always — there's no case-insensitive option." },
          { q: "Is my data private?", a: "Yes, all text processing happens locally in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "If you just want to replace plain text and your search term contains ., *, +, (, ), [, or ], escape those characters with a backslash first.",
          "\"Replace All\" always replaces every match in one click — there's no separate single-replacement mode.",
          "Keep a copy of your original text before replacing, since there's no undo button.",
          "Use regex groups like (\\w+) with backreferences in your replacement text for more advanced find-and-replace patterns."
        ]}
      />
    </div>
  );
}