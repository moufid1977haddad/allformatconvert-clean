'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { truncate as truncateText } from '../../../lib/textTools';

export default function TextTruncatorPage() {
  const [text, setText] = useState('');
  const [limit, setLimit] = useState(100);
  const [type, setType] = useState('characters');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
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
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
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
          <button onClick={truncate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Truncate</button>
          {result && (
            <div className="space-y-2">
              <textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Text Truncator"}
        description={"Text Truncator shortens text to a number of characters or words, adding \"...\" when it cuts, entirely in your browser. Characters are counted as you see them, so an emoji or an accented letter is never cut in half; word mode keeps your original spacing and line breaks and cuts right after the last word kept. If the text is already within the limit, it is returned unchanged."}
        howTo={[
          "Paste your text.",
          "Enter the limit and choose Characters or Words.",
          "Click 'Truncate'.",
          "Copy the result."
        ]}
        faqs={[
          { q: "Is Text Truncator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is the ellipsis counted in the limit?", a: "No — the limit applies to your text; \"...\" is added after the part that is kept, and trailing spaces before it are removed." },
          { q: "Can it cut an emoji or accented letter in half?", a: "No — it counts user-perceived characters, so multi-part emoji and combining accents stay whole." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Use word mode for previews and excerpts so the text never stops mid-word.",
          "The limit must be a whole number; 0 keeps nothing but the ellipsis."
        ]}
      />
    </div>
  );
}