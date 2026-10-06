'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { truncate as truncateText } from '../../../lib/textTools';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TextTruncatorPage() {
  const [text, setText] = useState('');
  const [limit, setLimit] = useState(100);
  const [type, setType] = useState('characters');
  const [result, setResult] = useState('');
  const [error, setError] = useToolError('');
  const [copyError, setCopyError] = useState(false);
  const truncate = () => {
    try { setResult(truncateText(text, limit, type)); setError(''); }
    catch (e) { setResult(''); setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Truncator</h1>
        <p className="text-neutral-500 text-center mb-8">Truncate text to specific length</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Limit</label>
              <input aria-label="Limit" type="number" min="1" value={limit} onChange={e => setLimit(e.target.value === '' ? NaN : Number(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select aria-label="Type" value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="characters">Characters</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button onClick={truncate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Truncate</button>
          {result && (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="truncated.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Text Truncator"}
        description={"Text Truncator shortens a text to a limit you set, counted in characters or in words, for previews, excerpts, captions or form fields. When it cuts, it adds three dots after the kept part, and the dots are not counted in the limit. Characters are counted as they appear, so an emoji or an accented letter is never cut in half. In word mode the original spacing and line breaks are kept up to the last word. A text already within the limit comes back unchanged. The cut is made on your device."}
        example={{
          caption: "Limit 4, Type Words: the cut falls right after the fourth word.",
          inputLabel: "Text",
          input: "The quick brown fox jumps over the lazy dog.",
          outputLabel: "Result",
          output: "The quick brown fox...",
        }}
        howToTitle={"How to truncate text"}
        howTo={[
          "Paste your text.",
          "Enter the \"Limit\", which starts at 100, and choose Characters or Words in the \"Type\" dropdown.",
          "Click \"Truncate\".",
          "Click \"Copy\" for the shortened text, or \"Download\" for truncated.txt."
        ]}
        specs={[
          { label: "Units", value: "Characters as displayed, or Words (runs of non-space characters)" },
          { label: "Limit", value: "Any whole number, 0 included; 0 gives the three dots alone" },
          { label: "Ellipsis", value: "Three ASCII periods, added only when the text is cut, not counted in the limit" },
          { label: "Output", value: "The shortened text in a result box; Download saves it as truncated.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"The text is measured and cut by JavaScript in this tab, so it never travels over the network. An invalid limit shows an error message, and that message, with the tool name and browser version but without your text, is recorded in our error log. The shortened text is kept only in the result box until you leave."}
        faqs={[
          { q: "Is the ellipsis counted in the limit?", a: "No. The limit applies to your text only and the three dots are added after the kept part, so the result can be three characters longer than the limit. In character mode, spaces just before the cut are removed first." },
          { q: "Can it cut an emoji or accented letter in half?", a: "No, in current browsers: it counts what you see, so 👍🏽, flags and accents typed as separate marks stay whole. Firefox before version 125 lacks the segmenter used here and counts code points instead, which can split such characters." },
          { q: "Does word mode stop in the middle of a word?", a: "No. A word is any run of characters between spaces or line breaks, and the cut falls right after the last word kept, with your original spaces and line breaks before it. Punctuation attached to that word stays." },
          { q: "Can I get the single … character instead of three dots?", a: "No. The tool always adds three ASCII periods, never the single ellipsis character. If your style guide needs it, replace the three dots afterwards with Find and Replace in its default plain-text mode." }
        ]}
      />
    </div>
  );
}