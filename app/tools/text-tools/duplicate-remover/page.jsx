'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function DuplicateRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const removeDuplicates = () => {
    const lines = text.split('\n');
    const unique = [...new Set(lines)];
    setResult(unique.join('\n'));
    setHasResult(true);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Duplicate Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove duplicate lines from text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <button onClick={removeDuplicates} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Remove Duplicates</button>
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
        title="Duplicate Remover"
        description="Duplicate Remover strips out repeated lines from a block of text, keeping only the first occurrence of each line, entirely in your browser."
        howTo={[
          "Paste your text into the input field, with one entry per line.",
          "Click \"Remove Duplicates\" to process your content.",
          "Review the deduplicated result in the output box.",
          "Click \"Copy\" to copy the cleaned text to your clipboard."
        ]}
        faqs={[
          { q: "Is Duplicate Remover free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is duplicate detection case-sensitive?", a: "Yes, always — \"Apple\" and \"apple\" are treated as different lines. There's no toggle to make matching case-insensitive." },
          { q: "Can it handle large lists?", a: "Yes, though very large lists are limited only by your browser's performance since everything runs locally." },
          { q: "Is my data private?", a: "Yes, deduplication happens entirely in your browser — your text is never uploaded to a server." }
        ]}
        tips={[
          "Use Duplicate Remover before importing lists into spreadsheets to catch accidental repeat entries.",
          "Since matching is case-sensitive, normalize your text's capitalization first with Case Converter if you want \"Apple\" and \"apple\" treated as the same entry.",
          "Only the first occurrence of each line is kept — remaining copies are removed, not merged or counted.",
          "Copy your cleaned results right after processing, since the tool doesn't save your data between visits."
        ]}
      />
    </div>
  );
}