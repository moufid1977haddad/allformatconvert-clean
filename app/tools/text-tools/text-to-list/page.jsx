'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function TextToListPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const toBullet = () => setResult(text.split('\n').filter(l => l.trim()).map(l => '• ' + l.trim()).join('\n'));
  const toNumbered = () => setResult(text.split('\n').filter(l => l.trim()).map((l, i) => (i+1) + '. ' + l.trim()).join('\n'));
  const toComma = () => setResult(text.split('\n').filter(l => l.trim()).join(', '));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text to List</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to different list formats</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toBullet} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Bullet List</button>
            <button onClick={toNumbered} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Numbered List</button>
            <button onClick={toComma} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Comma List</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text to List"
        description="Text to List turns lines of pasted text into a bullet list, numbered list, or comma-separated list, entirely in your browser."
        howTo={[
          "Paste your text into the input field, with one item per line.",
          "Click \"Bullet List\", \"Numbered List\", or \"Comma List\" to choose your format.",
          "Empty lines are automatically skipped in the result.",
          "Click \"Copy\" to copy the formatted list to your clipboard."
        ]}
        faqs={[
          { q: "Is Text to List free to use?", a: "Yes, it's completely free with no signup and no limits." },
          { q: "Can I use custom separators?", a: "Not currently — the three available formats are bullet points (•), numbered lines, and a comma-separated list." },
          { q: "Can I download the result as a Word document or PDF?", a: "Not currently — the only output option is copying the formatted text to your clipboard." },
          { q: "Is my data private?", a: "Yes, everything happens locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Put one item per line before pasting for the cleanest conversion — the tool splits on line breaks.",
          "Blank lines in your input are automatically skipped, so you don't need to clean those up first.",
          "Use \"Comma List\" to quickly turn a column of items into an inline, comma-separated sentence.",
          "Paste the copied output directly into a word processor, which will typically auto-format bullet and numbered lists further."
        ]}
      />
    </div>
  );
}