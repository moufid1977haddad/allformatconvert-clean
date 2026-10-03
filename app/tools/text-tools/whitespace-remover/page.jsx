'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { removeExtraSpaces, removeAllExtraWhitespace, joinIntoOneLine, removeLeadingWhitespace, removeTrailingWhitespace } from '../../../lib/textTools';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function WhitespaceRemoverPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const run = (fn) => { setResult(fn(text)); setHasResult(true); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Whitespace Remover</h1>
        <p className="text-neutral-500 text-center mb-8">Remove extra spaces and blank lines without merging your lines</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => run(removeAllExtraWhitespace)} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Remove All Extra</button>
            <button onClick={() => run(removeExtraSpaces)} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Remove Extra Spaces</button>
            <button onClick={() => run(removeLeadingWhitespace)} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Remove Leading</button>
            <button onClick={() => run(removeTrailingWhitespace)} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Remove Trailing</button>
            <button onClick={() => run(joinIntoOneLine)} className="col-span-2 bg-white border border-indigo-600 text-indigo-700 hover:bg-indigo-50 rounded-xl py-2 font-semibold transition">Join Into One Line</button>
          </div>
          {hasResult && (result ? (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="cleaned.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title="Whitespace Remover"
        description={"Whitespace Remover cleans up spacing in your text five ways — remove all extra spaces and blank lines, collapse repeated spaces only, trim the start or the end of each line, or join everything into one line — entirely in your browser. Only \"Join Into One Line\" removes line breaks."}
        howTo={[
          "Paste your text into the input field.",
          "Click \"Remove All Extra\" to collapse repeated spaces and tabs, trim each line and turn runs of blank lines into a single blank line — every line of text is kept.",
          "\"Remove Extra Spaces\" collapses repeated spaces and tabs and trims each line but leaves blank lines alone; \"Remove Leading\" and \"Remove Trailing\" only trim the start or the end of each line.",
          "Click \"Join Into One Line\" only if you want every line break replaced by a space.",
          "Click \"Copy\" or \"Download\" to keep the cleaned text."
        ]}
        faqs={[
          { q: "Does it remove all spaces?", a: "No — it collapses extra or unwanted whitespace while keeping single spaces between words." },
          { q: "Will it merge my lines?", a: "Only if you click \"Join Into One Line\". The four other buttons keep every line of text where it is; \"Remove All Extra\" only removes extra blank lines (a run of blank lines becomes one, so paragraphs stay separated)." },
          { q: "Is Whitespace Remover free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What's the difference between the buttons?", a: "\"Remove All Extra\" collapses repeated spaces and tabs, trims each line and removes extra blank lines. \"Remove Extra Spaces\" does the same inside lines but keeps every blank line. \"Remove Leading\"/\"Remove Trailing\" trim whitespace from the start or end of each line without touching spacing inside the line. \"Join Into One Line\" replaces every run of whitespace, line breaks included, with one space." },
          { q: "Does it handle non-breaking spaces?", a: "Yes — non-breaking and other Unicode spaces, common in text copied from web pages and PDFs, are collapsed like ordinary spaces." },
          { q: "Is my data private?", a: "Yes, all processing happens locally in your browser — what you enter is never sent to a server." }
        ]}
        tips={[
          "Use \"Remove Extra Spaces\" instead of \"Remove All Extra\" when the number of blank lines matters (for example in code or a formatted list).",
          "\"Remove Leading\"/\"Remove Trailing\" are useful for cleaning up indentation copied from emails or PDFs without collapsing spacing within each line.",
          "Clean up code snippets with \"Remove Trailing\" to strip accidental trailing spaces before sharing them.",
          "Text copied from a PDF often breaks every line in the middle of a sentence: \"Join Into One Line\" puts it back into one paragraph."
        ]}
      />
    </div>
  );
}