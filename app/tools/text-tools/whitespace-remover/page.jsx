'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function WhitespaceRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const removeAll = () => { setResult(text.replace(/\s+/g, ' ').trim()); setHasResult(true); };
  const removeExtra = () => { setResult(text.replace(/[ \t]+/g, ' ').trim()); setHasResult(true); };
  const removeLeading = () => { setResult(text.split('\n').map(l => l.trimStart()).join('\n')); setHasResult(true); };
  const removeTrailing = () => { setResult(text.split('\n').map(l => l.trimEnd()).join('\n')); setHasResult(true); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Whitespace Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove extra spaces from text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={removeAll} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove All Extra</button>
            <button onClick={removeExtra} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Extra Spaces</button>
            <button onClick={removeLeading} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Leading</button>
            <button onClick={removeTrailing} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition">Remove Trailing</button>
          </div>
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
        title="Whitespace Remover"
        description="Whitespace Remover offers four ways to clean up spacing in your text — collapse all whitespace, collapse only spaces and tabs, trim leading spaces per line, or trim trailing spaces per line — entirely in your browser."
        howTo={[
          "Paste your text into the input field.",
          "Click \"Remove All Extra\" to collapse every run of whitespace (including line breaks) to a single space, or pick a more targeted option.",
          "\"Remove Extra Spaces\" collapses repeated spaces/tabs but keeps your line breaks; \"Remove Leading\" and \"Remove Trailing\" trim each line individually.",
          "Click \"Copy\" to copy the cleaned text to your clipboard."
        ]}
        faqs={[
          { q: "Does it remove all spaces?", a: "No — it collapses extra or unwanted whitespace while keeping single spaces between words." },
          { q: "Is Whitespace Remover free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What's the difference between the four buttons?", a: "\"Remove All Extra\" collapses everything including line breaks into single spaces. \"Remove Extra Spaces\" keeps line breaks but collapses repeated spaces/tabs. \"Remove Leading\"/\"Remove Trailing\" trim whitespace from the start or end of each line without touching spacing inside the line." },
          { q: "Is my data private?", a: "Yes, all processing happens locally in your browser — nothing is sent to a server." }
        ]}
        tips={[
          "Use \"Remove Extra Spaces\" instead of \"Remove All Extra\" when you need to keep your paragraph or line breaks intact.",
          "\"Remove Leading\"/\"Remove Trailing\" are useful for cleaning up indentation copied from emails or PDFs without collapsing spacing within each line.",
          "Clean up code snippets with \"Remove Trailing\" to strip accidental trailing spaces before sharing them.",
          "Run \"Remove All Extra\" on data copied from PDFs or web pages, which often carries inconsistent spacing and line breaks."
        ]}
      />
    </div>
  );
}