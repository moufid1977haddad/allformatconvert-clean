'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { removeDuplicateLines } from '../../../lib/textTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="flex flex-wrap gap-4 justify-center text-sm text-neutral-600">
            <label className="flex items-center gap-2"><input type="checkbox" checked={ignoreCase} onChange={e => setIgnoreCase(e.target.checked)} /> Ignore case</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={trim} onChange={e => setTrim(e.target.checked)} /> Ignore surrounding spaces</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={removeEmpty} onChange={e => setRemoveEmpty(e.target.checked)} /> Remove empty lines</label>
          </div>
          {hasResult && <p className="text-sm text-neutral-500 text-center">{removed} line{removed === 1 ? '' : 's'} removed</p>}
          <button onClick={removeDuplicates} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Remove Duplicates</button>
          {hasResult && (result ? (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="deduplicated.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title={"Duplicate Remover"}
        description={"Duplicate Remover deletes the lines that appear more than once in a list or text and keeps the first copy of each, in the original order. It suits mailing lists, keyword lists and log extracts pasted one item per line. Three options change the comparison: ignore upper and lower case, ignore spaces around a line, and remove empty lines. Lines are compared after Unicode normalization, so é typed as one character or as e plus an accent match. It compares whole lines, not words, and runs in your browser."}
        example={{
          caption: "With \"Ignore case\" and \"Ignore surrounding spaces\" ticked; the page then shows 3 lines removed.",
          inputLabel: "List",
          input: "apple\nBanana\napple\nApple\n  banana\ncherry",
          outputLabel: "Result",
          output: "apple\nBanana\ncherry",
        }}
        howToTitle={"How to remove duplicate lines"}
        howTo={[
          "Paste your list into the box, one item per line.",
          "Tick \"Ignore case\" when Apple and apple are the same item, \"Ignore surrounding spaces\" for stray spaces, and \"Remove empty lines\" to drop blank lines.",
          "Click \"Remove Duplicates\"; the number of lines removed appears above the button.",
          "Copy the cleaned list with \"Copy\", or keep it as a file with \"Download\" (deduplicated.txt)."
        ]}
        specs={[
          { label: "Input", value: "Pasted text; Windows, old Mac and Unix line breaks are all read" },
          { label: "Kept line", value: "The first occurrence, exactly as written, with its own spaces and case" },
          { label: "Empty lines", value: "Compared like other lines, so only the first one stays; Remove empty lines drops them all" },
          { label: "Output", value: "Kept lines in their original order with Unix line breaks, ready to copy or to save as deduplicated.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"The comparison runs in JavaScript within this page, using a list of seen lines held in memory. Your lines never leave the browser and are forgotten when you close the tab. If copying the result fails, the page shows Copy failed and our error log receives the message \"Copy to the clipboard failed.\" with the tool name and browser version, but no line of your list."}
        faqs={[
          { q: "Are Apple and apple counted as duplicates?", a: "No, unless you tick \"Ignore case\". With \"Ignore surrounding spaces\" ticked, a line with spaces before or after it also matches the same line without them. In every case the line kept is the first one, as you typed it." },
          { q: "Does it keep the blank lines between paragraphs?", a: "No. Empty lines are compared like any other line, so only the first one survives and later paragraph breaks are removed as duplicates. Tick \"Remove empty lines\" to drop them all; the removed count then includes them." },
          { q: "Can it remove duplicate words inside a line?", a: "No. It compares whole lines only. Two lines holding the same words in another order, or with different punctuation, are both kept. To see how two versions differ word by word, use Text Comparator instead." },
          { q: "Does it work with lists copied from Excel or Windows?", a: "Yes. Windows (CRLF), old Mac (CR) and Unix (LF) line endings are all recognized, so the last line of a pasted column matches its copy elsewhere. The result is written with Unix line breaks." }
        ]}
        tips={[
          "Sort the cleaned list afterwards with Text Sorter, whose A-Z order puts item 2 before item 10."
        ]}
      />
    </div>
  );
}