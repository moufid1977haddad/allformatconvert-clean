'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { lorem } from '../../../lib/textTools';
import { TextDownload } from '../../../components/FileDownload';

export default function LoremIpsumPage() {
  const [count, setCount] = useState(1);
  const [type, setType] = useState('paragraphs');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const generate = () => {
    try { setResult(lorem(count, type)); } catch (e) { setResult(''); }
    setHasResult(true);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Lorem Ipsum Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate placeholder text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Amount</label>
              <input aria-label="Amount" type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select aria-label="Type" value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="paragraphs">Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Generate</button>
          {hasResult && (result ? (
            <div className="space-y-2">
              <textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="lorem-ipsum.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title={"Lorem Ipsum Generator"}
        description={"Lorem Ipsum Generator produces placeholder text for mockups and prototypes, entirely in your browser, as paragraphs, sentences or words. You get exactly what you ask for: N words (any number, not capped at the length of the source passage), N real sentences of 8 to 16 words, or N paragraphs of five sentences, starting with the classic \"Lorem ipsum dolor sit amet\"."}
        howTo={[
          "Choose paragraphs, sentences or words.",
          "Enter how many you need (1 to 100).",
          "Click 'Generate'.",
          "Copy the text."
        ]}
        faqs={[
          { q: "Is Lorem Ipsum Generator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is the text random?", a: "No — it is deterministic: the same request always gives the same text, starting with the classic Lorem ipsum passage." },
          { q: "Can I get more words than the classic passage has?", a: "Yes — the passage continues from the start, so 500 words gives 500 words." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Use sentences for short labels and paragraphs for body text.",
          "Word counts are exact, which helps test layouts with a known text length."
        ]}
      />
    </div>
  );
}