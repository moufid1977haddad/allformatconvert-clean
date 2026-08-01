'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextReverserPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);
  const reverseText = () => setResult(text.split('').reverse().join(''));
  const reverseWords = () => setResult(text.split(' ').reverse().join(' '));
  const reverseLines = () => setResult(text.split('\n').reverse().join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Reverser</h1>
        <p className="text-neutral-500 text-center mb-8">Reverse any text, words or lines</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={reverseText} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Text</button>
            <button onClick={reverseWords} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Words</button>
            <button onClick={reverseLines} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Reverse Lines</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text Reverser"
        description="Text Reverser flips your text three ways — character order, word order, or line order — entirely in your browser."
        howTo={[
          "Type or paste the text you want to reverse.",
          "Click \"Reverse Text\" to flip character order, \"Reverse Words\" to flip word order, or \"Reverse Lines\" to flip line order.",
          "Review the result in the output box below.",
          "Click \"Copy\" to copy the reversed text to your clipboard."
        ]}
        faqs={[
          { q: "Is Text Reverser free to use?", a: "Yes, it's completely free with no signup and no limits." },
          { q: "Does it work with numbers and punctuation?", a: "Yes, all characters are reversed exactly as they appear, whichever of the three modes you choose." },
          { q: "Is my data private?", a: "Yes, your text is processed locally and never sent to a server." },
          { q: "Does it work with any language?", a: "It reverses character order for any language's text, though note that character-by-character reversal can occasionally split multi-character emoji or certain accented characters oddly." }
        ]}
        tips={[
          "Use \"Reverse Text\" to check whether a word or phrase is a palindrome.",
          "\"Reverse Lines\" is handy for flipping the order of a pasted list without touching each line's content.",
          "\"Reverse Words\" keeps each word intact but flips their order in the sentence — useful for quick word-order experiments.",
          "Copy large blocks of text in to reverse whole paragraphs at once instead of doing it manually."
        ]}
      />
    </div>
  );
}