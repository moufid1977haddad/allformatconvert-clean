'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reverseCharacters, reverseWords as reverseWordOrder, reverseLines as reverseLineOrder } from '../../../lib/textSegments';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TextReverserPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);
  // Characters as the reader sees them: emoji, flags and accented letters are never split in two.
  const reverseText = () => setResult(reverseCharacters(text));
  const reverseWords = () => setResult(reverseWordOrder(text));
  const reverseLines = () => setResult(reverseLineOrder(text));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Reverser</h1>
        <p className="text-neutral-500 text-center mb-8">Reverse any text, words or lines</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <button onClick={reverseText} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Reverse Text</button>
            <button onClick={reverseWords} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Reverse Words</button>
            <button onClick={reverseLines} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Reverse Lines</button>
          </div>
          {result && (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" value={result} readOnly />
              <TextDownload text={result} name="reversed.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Text Reverser"
        description={"Text Reverser has three buttons. Reverse Text writes the whole text backwards, character by character, keeping emoji, flags and accented letters whole. Reverse Words reverses the order of the words on each line, with punctuation staying attached to its word and line breaks staying in place. Reverse Lines reverses the order of the lines and leaves each line unchanged. Use it for word games, backwards messages or flipping a list from oldest to newest. It does not turn letters upside down, and it runs in your browser."}
        example={{
          caption: "Reverse Words: each line is reversed on its own, punctuation stays with its word, and the double space keeps its place.",
          inputLabel: "Text",
          input: "Hello, big world!\nOne two  three",
          outputLabel: "After \"Reverse Words\"",
          output: "world! big Hello,\nthree two  One",
        }}
        howToTitle={"How to reverse text"}
        howTo={[
          "Type or paste your text.",
          "Click \"Reverse Text\", \"Reverse Words\" or \"Reverse Lines\".",
          "Copy the reversed text with \"Copy\", or save it with \"Download\" as reversed.txt."
        ]}
        specs={[
          { label: "Reverse Text", value: "Characters as displayed: 👍🏽, 👨‍👩‍👧, 🇫🇷 and é typed as e plus an accent stay whole" },
          { label: "Reverse Words", value: "Word order on each line; spacing pattern and punctuation kept" },
          { label: "Reverse Lines", value: "Line order only; empty lines move like the others" },
          { label: "Output", value: "The flipped text in a result box below the buttons, plus a reversed.txt download" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"All three reversals are array operations done by your browser on the text of this page; none of it is uploaded, and closing the tab discards it. A failed copy to the clipboard is reported to our error log as \"Copy to the clipboard failed.\" with the tool name and your browser name and version, and none of your text."}
        faqs={[
          { q: "Does Reverse Words move punctuation?", a: "No. Words are the runs of characters between spaces, so a comma or an exclamation mark stays glued to the word it follows: Hello, big world! becomes world! big Hello,. Each line is processed on its own." },
          { q: "Can I check a palindrome with it?", a: "Yes, for single words typed in one case, such as level. For phrases every character counts, so capitals, spaces and punctuation must mirror too: A man, a plan becomes nalp a ,nam A. Remove spaces and use lower case first." },
          { q: "Do emoji and accented letters survive Reverse Text?", a: "Yes, in current browsers: emoji with skin tones, family emoji, flags and accents typed as separate marks are kept whole. Firefox before version 125 has no Intl.Segmenter, so such emoji and accents can come apart there." }
        ]}
        tips={[
          "Reverse Lines turns a log or a list written oldest-first into newest-first without sorting anything."
        ]}
      />
    </div>
  );
}