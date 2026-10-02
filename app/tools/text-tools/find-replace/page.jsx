'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export default function FindReplacePage() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  // P24 (03/10): ignore case and whole words (textfixer, every editor's Find & Replace)
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [count, setCount] = useState(0);
  const [error, setError] = useState('');
  const [copyError, setCopyError] = useState(false);

  const doReplace = () => {
    if (!find) return;
    setError('');
    let regex;
    try {
      const core = useRegex ? find : escapeRegex(find);
      // whole word: not inside a longer word, letters of any script (Unicode), not only [A-Za-z0-9_]. Marks (\p{M})
      // count as part of a word: Hindi vowel signs, Arabic harakat, an accent typed as a separate character (P24 review)
      const flags = 'g' + (ignoreCase ? 'i' : '');
      if (!wholeWord) regex = new RegExp(core, flags);
      else {
        try { regex = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_])(?:${core})(?![\\p{L}\\p{M}\\p{N}_])`, flags + 'u'); }
        catch (err) {
          // a regex the u flag refuses (a\-b, \_id, x{ — valid without it): same boundary written as code-point
          // ranges, letters and marks of the common scripts, so whole word does not break a pattern that works
          if (!useRegex) throw err;
          // \p{…} and \u{…} only mean something with u: without it they would silently search for "p{L}" (review)
          if (/\\[pP]\{|\\u\{/.test(core)) throw new Error('\\p{…} and \\u{…} need the Unicode mode, which this pattern breaks elsewhere (escapes like \\- or \\_ outside brackets): remove those escapes.');
          const W = '0-9A-Z_a-z\\u00AA\\u00B5\\u00BA\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u036F\\u0370-\\u03FF\\u0400-\\u052F\\u0531-\\u0587\\u0591-\\u05C7\\u05D0-\\u05EA\\u0610-\\u061A\\u0620-\\u065F\\u066E-\\u06D3\\u06D5-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\u0900-\\u0963\\u0966-\\u0DFF\\u0E00-\\u0E4E\\u0E80-\\u0EFF\\u0F00-\\u0FFF\\u1000-\\u109F\\u10A0-\\u10FF\\u1100-\\u11FF\\u1200-\\u139F\\u1780-\\u17D3\\u1E00-\\u1FFF\\u2C60-\\u2C7F\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF\\uA720-\\uA7FF\\uAC00-\\uD7A3';
          regex = new RegExp(`(?<![${W}])(?:${core})(?![${W}])`, flags);
        }
      }
    } catch (e) {
      setError(e.message);
      setResult('');
      setHasResult(false);
      return;
    }
    const matches = (text.match(regex) || []).length;
    setCount(matches);
    // Plain-text mode: the replacement is literal too. String.replace would
    // read $&, $1 or $$ in it as regex patterns ("US$$" became "US$", 29/09).
    setResult(useRegex ? text.replace(regex, replace) : text.replace(regex, () => replace));
    setHasResult(true);
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
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
            <label className="flex items-center gap-2"><input id="fr-case" type="checkbox" checked={ignoreCase} onChange={(e) => setIgnoreCase(e.target.checked)} /> Ignore case</label>
            <label className="flex items-center gap-2"><input id="fr-word" type="checkbox" checked={wholeWord} onChange={(e) => setWholeWord(e.target.checked)} /> Whole words only</label>
          </div>
          <button onClick={doReplace} disabled={!text || !find} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Replace All</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {hasResult && (
            <div className="space-y-2">
              <p className="text-green-400 text-sm text-center">{count} replacement(s) made</p>
              {result ? (
                <>
                  <textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" value={result} readOnly />
                  <TextDownload text={result} name="replaced.txt" />
                  <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
                  {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
                </>
              ) : (
                <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
              )}
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