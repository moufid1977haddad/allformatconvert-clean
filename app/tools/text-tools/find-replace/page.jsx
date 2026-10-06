'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
  const [error, setError] = useToolError('');
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
        <p className="text-neutral-500 text-center mb-8">Replace every match, as plain text or a regular expression</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
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
                  <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" value={result} readOnly />
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
        description={"Find and Replace swaps every occurrence of a search term in your text for a replacement in one pass, shows the result in a separate box and says how many replacements were made. By default the search and the replacement are plain text, so characters such as . ( ) and $1 mean themselves. Tick Use regular expression for JavaScript patterns with capture groups, Ignore case to match any case, and Whole words only to skip matches inside longer words, in any alphabet except for a regex that the Unicode mode refuses, where only the common scripts count. Your original text is not changed, and your text never leaves your device."}
        example={{
          caption: "Plain text with \"Ignore case\" and \"Whole words only\" ticked: USDT is left alone and the $ is inserted as typed. The page shows 2 replacement(s) made.",
          inputLabel: "Text (Find: USD, Replace with: US$)",
          input: "Total: 5 USD. Tax: 1 usd. USDT is not a match.",
          outputLabel: "Result",
          output: "Total: 5 US$. Tax: 1 US$. USDT is not a match.",
        }}
        howToTitle={"How to find and replace text"}
        howTo={[
          "Paste your text into the first box.",
          "Fill in \"Find\" and \"Replace with\"; leave \"Replace with\" empty to delete every match.",
          "Tick \"Use regular expression\", \"Ignore case\" or \"Whole words only\" if needed.",
          "Click \"Replace All\", check the count, then click \"Copy\" or \"Download\" to keep replaced.txt."
        ]}
        specs={[
          { label: "Search modes", value: "Plain text (default) or JavaScript regular expression" },
          { label: "Options", value: "Ignore case; Whole words only (letters, digits and marks of any script)" },
          { label: "Regex flags", value: "g always; i with Ignore case; u with Whole words only, except for a pattern the u flag refuses, which then runs without it; never m or s" },
          { label: "Output", value: "A separate Result box with the count; Copy, or Download as replaced.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Matching and replacing use your browser's own regular-expression engine; your text is never uploaded. When a regular expression is invalid, the error shown on the page is reported to our error log with the tool name and browser version, and that error can contain part of your pattern."}
        faqs={[
          { q: "Is the search case-sensitive?", a: "Yes, by default: USD does not match usd. Tick \"Ignore case\" to match both. In plain-text mode the replacement is still inserted exactly as you typed it, whatever the case of the match." },
          { q: "Can I use capture groups like $1?", a: "Yes, with \"Use regular expression\" ticked: $1 inserts the first captured group and $& the whole match, as in JavaScript. Without regex mode, $1 and $& are inserted literally, so a price written as US$ stays intact." },
          { q: "Do ^ and $ match the start of each line?", a: "No. The pattern runs without the multiline flag, so ^ matches only the very start of the text and $ only its end. To act on each line, match the line break itself, written \\n in regex mode. The replacement field cannot insert a line break." },
          { q: "Does Whole words only work with accented and non-Latin words?", a: "Yes. A match is skipped when a letter, digit, combining mark or underscore of any script touches it, so café is not found inside cafés. One exception: a regex the Unicode mode refuses, such as a\\-b, falls back to the letters of the common scripts only." },
          { q: "Can I undo a replacement?", a: "Yes, in effect: your original text stays unchanged in the first box and the result goes to a separate box. Change the options and click \"Replace All\" again for a new result." }
        ]}
        tips={[
          "Build and test a complex pattern in Regex Tester first, then paste it into the Find field here."
        ]}
      />
    </div>
  );
}