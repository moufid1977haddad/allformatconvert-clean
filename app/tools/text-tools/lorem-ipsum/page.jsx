'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { lorem } from '../../../lib/textTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function LoremIpsumPage() {
  const [count, setCount] = useState(1);
  const [type, setType] = useState('paragraphs');
  const [result, setResult] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [copyError, setCopyError] = useState(false);
  // P36: the reason is shown when no text can be made (empty, zero or negative amount), not a bare "Result is empty"
  const [message, setMessage] = useState('');
  const generate = () => {
    try { setResult(lorem(count, type)); setMessage(''); } catch (e) { reportShownMessage(e); setResult(''); setMessage(e?.message || 'No text could be generated.'); }
    setHasResult(true);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Lorem Ipsum Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate placeholder text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Amount</label>
              <input aria-label="Amount" type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select aria-label="Type" value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="paragraphs">Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition text-white">Generate</button>
          {hasResult && (result ? (
            <div className="space-y-2">
              <TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <TextDownload text={result} name="lorem-ipsum.txt" />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          ) : (
            <p role="alert" className="text-red-500 text-center text-sm bg-neutral-50 border border-neutral-200 rounded-xl py-4">{message || 'Result is empty'}</p>
          ))}
        </div>
      </div>
      <SeoContent
        title={"Lorem Ipsum Generator"}
        description={"Lorem Ipsum Generator writes Latin-like placeholder text for mockups, wireframes and layout tests. Choose Paragraphs, Sentences or Words and an amount: you get exactly that many words, sentences of 8 to 16 words, or paragraphs of five sentences separated by a blank line. The text is taken from the classic Lorem ipsum passage, repeated as often as needed, so any length is possible. It is deterministic, not random. It produces plain text only, with no HTML tags and no other languages, and it is generated in your browser."}
        example={{
          caption: "Amount 2, Type Sentences. The same request always gives this text.",
          inputLabel: "Settings",
          input: "Amount: 2\nType: Sentences",
          outputLabel: "Result",
          output: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud.",
        }}
        howToTitle={"How to generate Lorem ipsum text"}
        howTo={[
          "Choose Paragraphs, Sentences or Words in the \"Type\" dropdown.",
          "Enter a whole number in \"Amount\"; the arrows stop at 100, but you can type a larger number.",
          "Click \"Generate\", then \"Copy\" the text or \"Download\" it as lorem-ipsum.txt."
        ]}
        specs={[
          { label: "Types", value: "Paragraphs (five sentences, a blank line between them), Sentences (8 to 16 words), Words" },
          { label: "Amount", value: "Any whole number from 1; the field's arrows go up to 100" },
          { label: "Start", value: "Lorem ipsum dolor sit amet; in Words mode, only as many of those first words as you ask for" },
          { label: "Output", value: "Placeholder text with a blank line between paragraphs, to copy or download as lorem-ipsum.txt" }
        ]}
        privacyTitle={"Where the text is generated"}
        privacy={"The words come from a fixed list inside the code of this page and are assembled in your browser, so nothing you choose is sent anywhere. An empty, zero or negative amount sends the message \"Enter a whole number of 1 or more.\" to our error log with the tool name and your browser name and version, and no text is generated."}
        faqs={[
          { q: "Is the Lorem ipsum text random?", a: "No. It is deterministic: the same type and amount always produce the same text, opening with the first words of the classic passage (just Lorem when you ask for a single word). Each sentence takes consecutive words of the classic passage, so the result is identical on every visit and every device." },
          { q: "Can I generate more than 100 paragraphs?", a: "Yes. Type the number in \"Amount\" yourself: the arrows stop at 100, but the generator accepts any whole number from 1 and repeats the passage as often as needed. No upper limit is set in the code." },
          { q: "Are the word counts exact?", a: "Yes. Words gives exactly the number asked, ending with a period; Sentences gives that many sentences of 8 to 16 words; Paragraphs gives that many blocks of five sentences. That makes it useful for testing a layout with a known amount of text." },
          { q: "Does it generate HTML paragraphs?", a: "No. The output is plain text: paragraphs are separated by an empty line, with no p tags. Wrap them yourself, or paste them into an editor that turns blank lines into paragraphs." }
        ]}
        tips={[
          "Generate Words with a fixed amount, then check the length in Character Counter to test a field that limits characters."
        ]}
      />
    </div>
  );
}