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
        <p className="text-neutral-500 text-center mb-8">Remove extra spaces and blank lines, or join lines into one</p>
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
        description={"Whitespace Remover cleans spacing in five ways. Remove All Extra collapses repeated spaces and tabs, trims every line, and turns each run of blank lines into one, dropping those at the very start and end. Remove Extra Spaces does the same inside lines but keeps every blank line. Remove Leading and Remove Trailing trim one side of each line only. Join Into One Line replaces every run of whitespace, line breaks included, with a single space; it is the only button that merges lines. All five run on your device, inside this page."}
        example={{
          caption: "Remove All Extra: spaces and the tab are collapsed, each line is trimmed, and three blank lines become one.",
          inputLabel: "Text",
          input: "  Dear   team,\t\n\n\n\nThe  report is   ready.  \nThanks,\n\n",
          outputLabel: "After \"Remove All Extra\"",
          output: "Dear team,\n\nThe report is ready.\nThanks,",
        }}
        howToTitle={"How to remove extra spaces from text"}
        howTo={[
          "Paste your text.",
          "Click \"Remove All Extra\", \"Remove Extra Spaces\", \"Remove Leading\" or \"Remove Trailing\" to clean spacing while keeping every line of text.",
          "Click \"Join Into One Line\" only to turn the whole text into a single line.",
          "Click \"Copy\", or save the cleaned text with \"Download\" (cleaned.txt)."
        ]}
        specs={[
          { label: "Spaces handled", value: "Spaces, tabs, non-breaking spaces and the other Unicode spaces JavaScript treats as whitespace" },
          { label: "Not removed", value: "Zero-width spaces (U+200B), which JavaScript does not treat as whitespace" },
          { label: "Line breaks", value: "Windows, Mac and Unix read; the result uses Unix line breaks" },
          { label: "Output", value: "Cleaned text shown under the buttons, which Download saves as cleaned.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"The five clean-ups are regular-expression replacements run by your browser on this page, so the text is not uploaded or stored anywhere. If the clipboard refuses a copy, the page shows Copy failed and sends the message \"Copy to the clipboard failed.\" with the tool name and browser version, without any of your text, to our error log."}
        faqs={[
          { q: "Will it merge my lines?", a: "No, unless you click \"Join Into One Line\". The four other buttons keep every line of text where it is; \"Remove All Extra\" only shortens runs of blank lines to one and drops blank lines at the start and end." },
          { q: "Does it clean non-breaking spaces from web or PDF text?", a: "Yes. Non-breaking spaces and the other Unicode spaces that JavaScript treats as whitespace are collapsed like ordinary spaces. Zero-width spaces are not whitespace for JavaScript, so they stay in the text." },
          { q: "Can I remove every space, even between words?", a: "No. Every button keeps at least one space between words, and \"Remove Leading\" and \"Remove Trailing\" leave the spacing inside lines untouched. To delete all spaces, use Find and Replace with a single space in Find and nothing in Replace with." },
          { q: "Can it fix a PDF paragraph broken into short lines?", a: "Yes. \"Join Into One Line\" puts it back on one line with single spaces. A word split by a hyphen at the end of a line keeps the hyphen and gains a space, as in hyph- enated, so check those afterwards." }
        ]}
        tips={[
          "Run \"Remove Trailing\" on code before sharing it: it strips spaces at line ends and touches nothing inside the lines."
        ]}
      />
    </div>
  );
}