'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

const LOREM = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum';

export default function LoremIpsumPage() {
  const [count, setCount] = useState(1);
  const [type, setType] = useState('paragraphs');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);

  const generate = () => {
    const words = LOREM.split(' ');
    if (type === 'words') {
      setResult(words.slice(0, count).join(' '));
    } else if (type === 'sentences') {
      setResult(Array.from({length: count}, (_, i) => LOREM).join('. '));
    } else {
      setResult(Array.from({length: count}, () => LOREM).join('\n\n'));
    }
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
              <input type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="paragraphs">Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate</button>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Lorem Ipsum Generator"
        description={"Lorem Ipsum Generator produces placeholder text for mockups and prototypes, entirely in your browser, in paragraphs, sentences, or words. Note: \"Sentences\" mode currently repeats the full ~69-word source passage rather than producing short individual sentences, and \"Words\" mode can't exceed the ~69 words available in the source text."}
        howTo={[
          "Choose a type: Paragraphs, Sentences, or Words.",
          "Set the amount you want (1–100).",
          "Click \"Generate\" to create your placeholder text.",
          "Click \"Copy\" to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is Lorem Ipsum Generator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does \"Sentences\" mode give me short individual sentences?", a: "Not currently — each \"sentence\" is actually the full ~69-word Lorem Ipsum passage, repeated and joined by periods. Use \"Paragraphs\" mode if you want that same repeating behavior with clearer spacing." },
          { q: "Can I generate more than about 69 words?", a: "Not in \"Words\" mode — it draws from a single fixed source passage of about 69 words, so requesting more than that returns only the words available rather than repeating them." },
          { q: "Is my data private?", a: "Yes, text is generated entirely in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Use \"Paragraphs\" mode for the most predictable results — each paragraph is the same full passage, repeated as many times as you specify.",
          "For a short one-line placeholder, use \"Words\" mode with a small count instead of \"Sentences\" mode.",
          "If you need more than ~69 words in \"Words\" mode, generate multiple times and combine the results manually.",
          "Copy the generated text right after creating it, since it isn't saved between visits."
        ]}
      />
    </div>
  );
}