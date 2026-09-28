'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { removeDuplicateLines } from '../../../lib/textTools';

export default function DuplicateRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [trim, setTrim] = useState(false);
  const [removeEmpty, setRemoveEmpty] = useState(false);
  const [removed, setRemoved] = useState(0);
  const removeDuplicates = () => {
    const r = removeDuplicateLines(text, { caseSensitive: !ignoreCase, trim, removeEmpty });
    setResult(r.text);
    setRemoved(r.removed);
    setHasResult(true);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Duplicate Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove duplicate lines from text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="flex flex-wrap gap-4 justify-center text-sm text-neutral-600">
            <label className="flex items-center gap-2"><input type="checkbox" checked={ignoreCase} onChange={e => setIgnoreCase(e.target.checked)} /> Ignore case</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={trim} onChange={e => setTrim(e.target.checked)} /> Ignore surrounding spaces</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={removeEmpty} onChange={e => setRemoveEmpty(e.target.checked)} /> Remove empty lines</label>
          </div>
          {hasResult && <p className="text-sm text-neutral-500 text-center">{removed} line{removed === 1 ? '' : 's'} removed</p>}
          <button onClick={removeDuplicates} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Remove Duplicates</button>
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
        title={"Duplicate Remover"}
        description={"Duplicate Remover deletes repeated lines from a block of text, keeping the first occurrence of each line in its original order, entirely in your browser. Windows (CRLF), Mac and Unix line endings are all recognised, so a line is never kept twice just because one copy ends differently. Options make the comparison ignore upper/lower case or surrounding spaces, and remove empty lines; the number of lines removed is shown."}
        howTo={[
          "Paste your list or text, one item per line.",
          "Tick 'Ignore case', 'Ignore surrounding spaces' or 'Remove empty lines' if needed.",
          "Click 'Remove Duplicates'.",
          "Copy the result."
        ]}
        faqs={[
          { q: "Is Duplicate Remover free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which occurrence is kept?", a: "The first one; the order of the remaining lines doesn't change." },
          { q: "Are \"Apple\" and \"apple\" duplicates?", a: "Only if you tick 'Ignore case'. With 'Ignore surrounding spaces', \" apple \" and \"apple\" are duplicates too." },
          { q: "Does it work with text copied from Excel or Windows?", a: "Yes — CRLF line endings are handled, so the last line is compared like the others." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Sort the result afterwards with the Text Sorter if you need it alphabetical.",
          "The count of removed lines tells you at a glance how many duplicates there were."
        ]}
      />
    </div>
  );
}