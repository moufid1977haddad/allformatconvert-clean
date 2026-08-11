'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextRepeaterPage() {
  const [text, setText] = useState('');
  const [count, setCount] = useState(3);
  const [separator, setSeparator] = useState('newline');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const repeat = () => {
    const sep = separator === 'newline' ? '\n' : separator === 'comma' ? ', ' : separator === 'space' ? ' ' : '';
    setResult(Array.from({length: count}, () => text).join(sep));
    setHasResult(true);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Repeater</h1>
        <p className="text-neutral-500 text-center mb-8">Repeat text multiple times</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Repeat count</label>
              <input type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Separator</label>
              <select value={separator} onChange={e => setSeparator(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="newline">New Line</option>
                <option value="space">Space</option>
                <option value="comma">Comma</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
          <button onClick={repeat} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Repeat</button>
          {hasResult && (result ? (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title="Text Repeater"
        description="Text Repeater duplicates any text a set number of times with your choice of separator, entirely in your browser."
        howTo={[
          "Enter or paste your text into the input field.",
          "Set how many times to repeat it (1–100) using the number input.",
          "Choose a separator: New Line, Space, Comma, or None.",
          "Click \"Repeat\" and copy your result from the output box."
        ]}
        faqs={[
          { q: "Is Text Repeater free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How many times can I repeat text?", a: "From 1 up to 100 repetitions." },
          { q: "Can I use a custom separator?", a: "Not currently — choose from New Line, Space, Comma, or None; there's no field for a custom delimiter." },
          { q: "Is my data private?", a: "Yes, everything is processed locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Use Text Repeater to quickly generate repetitive test data for development or QA work.",
          "Combine the Comma separator with short text to build a quick comma-separated list.",
          "Copy the output directly into spreadsheets or code editors for seamless integration.",
          "For a custom separator beyond the four presets, generate with \"None\" and then find-and-replace in your destination editor."
        ]}
      />
    </div>
  );
}