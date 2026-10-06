'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sortLines, splitLines } from '../../../lib/textTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TextSorterPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const sortAZ = () => { setResult(sortLines(text, 'az')); setHasResult(true); };
  const sortZA = () => { setResult(sortLines(text, 'za')); setHasResult(true); };
  const sortByLength = () => { setResult(sortLines(text, 'length')); setHasResult(true); };
  const sortByNumber = (desc) => { setResult(sortLines(text, desc ? 'number-desc' : 'number')); setHasResult(true); };
  const shuffle = () => {
    const lines = splitLines(text);
    const rnd = new Uint32Array(lines.length);
    crypto.getRandomValues(rnd);
    for (let i = lines.length - 1; i > 0; i--) {
      const j = rnd[i] % (i + 1);
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    setResult(lines.join('\n'));
    setHasResult(true);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Sorter</h1>
        <p className="text-neutral-500 text-center mb-8">Sort lines alphabetically or by length</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={sortAZ} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Sort A-Z</button>
            <button onClick={sortZA} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Sort Z-A</button>
            <button onClick={sortByLength} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Sort by Length</button>
            <button onClick={shuffle} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Shuffle</button>
            <button onClick={() => sortByNumber(false)} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Sort by Number (0-9)</button>
            <button onClick={() => sortByNumber(true)} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Sort by Number (9-0)</button>
          </div>
          {hasResult && (result ? (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="sorted.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p className="text-neutral-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">Result is empty</p>
          ))}
        </div>
      </div>
      <SeoContent
        title={"Text Sorter"}
        description={"Text Sorter reorders the lines of a list. Sort A-Z and Sort Z-A follow dictionary order in the language of your browser: capitals and lower case sort together, accented letters sit next to their base letter in most languages, and numbers inside a line are compared by value. Sort by Length goes from shortest to longest. The two Sort by Number buttons read the number at the start of each line, decimals and minus signs included. Shuffle puts the lines in random order. It sorts whole lines, not words, in your browser."}
        example={{
          caption: "Sort A-Z: case is ignored, é sorts with e, and item 2 comes before item 10.",
          inputLabel: "Lines",
          input: "item 10\nBanana\nzebra\néclair\napple\nitem 2",
          outputLabel: "After \"Sort A-Z\"",
          output: "apple\nBanana\néclair\nitem 2\nitem 10\nzebra",
        }}
        howToTitle={"How to sort lines of text"}
        howTo={[
          "Paste the lines to reorder, for example names, file names or numbers.",
          "Click \"Sort A-Z\", \"Sort Z-A\", \"Sort by Length\", \"Shuffle\", \"Sort by Number (0-9)\" or \"Sort by Number (9-0)\".",
          "Take the sorted list with \"Copy\", or \"Download\" it as sorted.txt."
        ]}
        specs={[
          { label: "Alphabetical", value: "Case-insensitive, accents second, numbers by value, in your browser's language" },
          { label: "By number", value: "Number at the start of each line, with sign, decimals and exponent; other lines follow in A-Z order" },
          { label: "By length", value: "Characters as displayed, shortest first; equal lengths in A-Z order" },
          { label: "Output", value: "Sorted lines as one text block with Unix line breaks, copied or downloaded as sorted.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Sorting uses the collator built into your browser and, for Shuffle, its cryptographic random generator. The lines never leave the page and are not stored. Should a copy to the clipboard fail, our error log receives that error message with the tool name and browser version, never the lines themselves."}
        faqs={[
          { q: "Does item 10 sort after item 2?", a: "Yes. Sort A-Z compares runs of digits by value, as file managers do, so file2 comes before file10. For a list of plain numbers with decimals or minus signs, use \"Sort by Number (0-9)\": -10, -2, 1.25, 1.3, 1.5." },
          { q: "Is sorting case-sensitive?", a: "No. apple, Banana and cherry sort together, as in a dictionary. When two lines differ only by case or accents, a second comparison decides between them, so the result is the same every time." },
          { q: "Do accented letters sort next to their base letter?", a: "Yes, in English, French, German and most other languages: éclair comes before zebra. The order follows the language of your browser, so in Swedish or Danish å, ä, ö, æ and ø come after z, as in those alphabets." },
          { q: "Is Shuffle really random?", a: "Yes. It is a Fisher-Yates shuffle fed by crypto.getRandomValues, the cryptographic generator of the browser. Because each draw is a 32-bit number, a modulo bias remains, at most n in 4,294,967,296 for a list of n lines." }
        ]}
        tips={[
          "Remove repeated lines first with Duplicate Remover, then sort the shorter list here."
        ]}
      />
    </div>
  );
}