'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TextToListPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const toBullet = () => { setResult(text.split('\n').filter(l => l.trim()).map(l => '• ' + l.trim()).join('\n')); setHasResult(true); };
  const toNumbered = () => { setResult(text.split('\n').filter(l => l.trim()).map((l, i) => (i+1) + '. ' + l.trim()).join('\n')); setHasResult(true); };
  const toComma = () => { setResult(text.split('\n').filter(l => l.trim()).join(', ')); setHasResult(true); };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text to List</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to different list formats</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toBullet} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Bullet List</button>
            <button onClick={toNumbered} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Numbered List</button>
            <button onClick={toComma} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Comma List</button>
          </div>
          {hasResult && (result ? (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="list.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title="Text to List"
        description={"Text to List formats a column of items, one per line, in one of three ways: a bullet list with the • character, a numbered list (1., 2., 3.), or a single line with the items separated by a comma and a space. Blank lines are skipped. Bullet and numbered lists also trim the spaces around each item, while the comma list keeps them. Use it to tidy a list copied from a spreadsheet or an email. It outputs plain text, not a Word or HTML list, and runs in your browser."}
        example={{
          caption: "Numbered List: the blank line is skipped and the spaces around Sugar are trimmed.",
          inputLabel: "Items",
          input: "Flour\n\n  Sugar \nEggs",
          outputLabel: "After \"Numbered List\"",
          output: "1. Flour\n2. Sugar\n3. Eggs",
        }}
        howToTitle={"How to turn text into a list"}
        howTo={[
          "Paste your items, one per line.",
          "Click \"Bullet List\", \"Numbered List\" or \"Comma List\".",
          "Click \"Copy\" to paste the list elsewhere, or \"Download\" for list.txt."
        ]}
        specs={[
          { label: "Formats", value: "• item, 1. item, or item, item, item on one line" },
          { label: "Blank lines", value: "Skipped in all three formats" },
          { label: "Spaces", value: "Trimmed in Bullet List and Numbered List, kept in Comma List" },
          { label: "Output", value: "A single block of formatted text; the download is named list.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Splitting, numbering and joining are done by a few lines of JavaScript in your browser, so your list is not uploaded. If the clipboard refuses a copy, our error log receives \"Copy to the clipboard failed.\" with the tool name and your browser name and version, never the list. Neither the items nor the formatted result are stored after you close the page."}
        faqs={[
          { q: "Can I download the list?", a: "Yes. \"Download\" saves it as list.txt, plain text in UTF-8, and on an iPhone or iPad \"Save / Share\" appears too. There is no Word or PDF output: paste the text into your editor and apply its own list style." },
          { q: "Does it remove existing bullets or numbers?", a: "No. A line that already starts with a dash or with 1. keeps it, so you would get • - item. Find and Replace can strip a dash marker that every line shares (a dash and a space replaced with nothing); numbers must be removed in your editor." },
          { q: "Can I choose another separator or bullet?", a: "No. The bullet is always •, numbers are followed by a period and a space, and the comma list uses a comma and a space. For another separator, make a Comma List and replace the commas in Find and Replace." }
        ]}
        tips={[
          "Comma List turns a column of email addresses into one line you can paste into the To field of a mail app that accepts comma-separated addresses."
        ]}
      />
    </div>
  );
}