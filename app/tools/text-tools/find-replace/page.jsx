'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function FindReplacePage() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [result, setResult] = useState('');
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [copyError, setCopyError] = useState(false);

  const doReplace = () => {
    if (!find) return;
    setError('');
    let regex;
    try {
      regex = new RegExp(useRegex ? find : escapeRegex(find), 'g');
    } catch (e) {
      setError(e.message);
      setResult('');
      return;
    }
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
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input type="checkbox" checked={useRegex} onChange={e => setUseRegex(e.target.checked)} />
            Use regular expression
          </label>
          <button onClick={doReplace} disabled={!text || !find} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Replace All</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-2">
              <p className="text-green-400 text-sm text-center">{count} replacement(s) made</p>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Find and Replace"
        description={"Find and Replace searches your text for every match of your \"Find\" term and swaps it with your replacement text, entirely in your browser. By default, \"Find\" is treated as plain literal text — characters like . * + ( ) [ ] match themselves, not regex syntax. Check \"Use regular expression\" to opt into full regex matching, including capture groups and backreferences in the replacement."}
        howTo={[
          "Paste your text into the main text box.",
          "Enter your search text in the \"Find\" field and your replacement text in the \"Replace with\" field.",
          "Check \"Use regular expression\" only if you want regex matching — leave it unchecked for plain literal text.",
          "Click \"Replace All\" to replace every match in one pass, then copy your updated text from the output field."
        ]}
        faqs={[
          { q: "Does this tool support regular expressions?", a: "Yes, as an opt-in — check \"Use regular expression\" to have the \"Find\" field interpreted as a regex, with special characters like . * + ( ) [ ] ^ $ taking on their regex meaning. Leave it unchecked for plain literal matching." },
          { q: "Do I need to escape special characters by default?", a: "No — with \"Use regular expression\" unchecked (the default), your search text is matched literally, so characters like . and ( match themselves." },
          { q: "Is matching case-sensitive?", a: "Yes, always — there's no case-insensitive option." },
          { q: "Is my data private?", a: "Yes, all text processing happens locally in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "Leave \"Use regular expression\" unchecked for straightforward text replacement — no need to escape special characters.",
          "Enable regex mode for advanced patterns, like using groups such as (\\w+) with backreferences in your replacement text.",
          "\"Replace All\" always replaces every match in one click — there's no separate single-replacement mode.",
          "Keep a copy of your original text before replacing, since there's no undo button."
        ]}
      />
    </div>
  );
}