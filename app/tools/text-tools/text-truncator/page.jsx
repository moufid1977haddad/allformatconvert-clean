'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextTruncatorPage() {
  const [text, setText] = useState('');
  const [limit, setLimit] = useState(100);
  const [type, setType] = useState('characters');
  const [result, setResult] = useState('');

  const truncate = () => {
    if (type === 'characters') {
      setResult(text.length > limit ? text.slice(0, limit) + '...' : text);
    } else {
      const words = text.split(' ');
      setResult(words.length > limit ? words.slice(0, limit).join(' ') + '...' : text);
    }
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
              <input type="number" min="1" value={limit} onChange={e => setLimit(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="characters">Characters</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          <button onClick={truncate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Truncate</button>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text Truncator"
        description="Text Truncator shortens text to a character or word limit you set, adding \"...\" when it cuts the text short, entirely in your browser."
        howTo={[
          "Paste or type your text into the input field.",
          "Type your desired limit into the \"Limit\" field, and choose \"Characters\" or \"Words\" as the unit.",
          "Click \"Truncate\" to process your text.",
          "Copy the shortened text from the output field."
        ]}
        faqs={[
          { q: "Is Text Truncator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it cut off mid-word?", a: "In \"Characters\" mode, yes — it cuts at the exact character count, which can land mid-word. Use \"Words\" mode if you want to always keep whole words." },
          { q: "Does it add \"...\" every time?", a: "Only when the text actually exceeds your limit — if your text is already shorter, it's returned unchanged with no ellipsis added." },
          { q: "Is my data private?", a: "Yes, everything happens locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Use \"Words\" mode instead of \"Characters\" if you want to avoid cutting a sentence off mid-word.",
          "Leave a small buffer below a hard platform limit (e.g., truncate to 270 rather than exactly 280) to leave room for hashtags or mentions you add afterward.",
          "Always proofread the truncated result, since cutting at a fixed limit can occasionally land right before important context.",
          "The \"Limit\" field accepts any number you type — it's not a fixed dropdown of preset lengths."
        ]}
      />
    </div>
  );
}