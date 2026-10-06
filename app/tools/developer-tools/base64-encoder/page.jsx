'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { base64Encode, base64Decode } from '../../../lib/textCodecs';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function Base64EncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const encode = () => setOutput(base64Encode(input, { urlSafe }));
  const decode = () => {
    try {
      const { text, bytes } = base64Decode(input);
      setOutput(text !== null ? text : `This Base64 decodes to ${bytes.length} bytes of binary data, not UTF-8 text (for example an image or a compressed file), so it can't be shown as text.`);
    } catch (e) { reportShownMessage(e); setOutput(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Base64 Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode Base64</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste text here..." value={input} onChange={e => setInput(e.target.value)} />
          <label className="flex items-center justify-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={urlSafe} onChange={e => setUrlSafe(e.target.checked)} /> URL-safe Base64 when encoding (- and _ instead of + and /, no = padding — as in JWT and URLs)</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {output && <div className="space-y-2"><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="base64.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"Base64 Encoder"}
        description={"Base64 Encoder turns text into Base64 and Base64 back into text. Your text is first written as UTF-8 bytes, so accented letters, other scripts and emoji come back exactly as typed, and the result matches what Python's base64 module or Node.js Buffer produce for the same text. Tick the URL-safe option to get the - and _ alphabet without = padding used in JWTs and URL parameters. Decode reads both alphabets, missing padding and wrapped lines. When the decoded bytes are not UTF-8 text, the tool gives their count instead of garbled characters. Your browser's TextEncoder, btoa and atob do the work. It takes pasted text only; to encode a file, use File to Base64."}
        example={{
          caption: "The text below encoded twice: once as is, once with the URL-safe box ticked. Decode turns either result back into the same text.",
          inputLabel: "Text",
          input: "Café ☕ 1>0?",
          outputLabel: "Encode",
          output: "Q2Fmw6kg4piVIDE+MD8=\n\nURL-safe ticked:\nQ2Fmw6kg4piVIDE-MD8",
        }}
        howToTitle={"How to encode or decode Base64 text"}
        howTo={[
          "Paste the text to encode, or the Base64 to decode, into the box.",
          "For a URL, a file name or a JWT, tick \"URL-safe Base64 when encoding\" before encoding.",
          "Click \"Encode\" or \"Decode\"; invalid Base64 gets a message that names the problem.",
          "Copy the Base64 or the decoded text with \"Copy\"; \"Download\" writes base64.txt, a name it keeps even for decoded text."
        ]}
        specs={[
          { label: "Input", value: "Any text for Encode; for Decode, standard or URL-safe Base64, with or without = padding, spaces and line breaks ignored" },
          { label: "Output", value: "Standard Base64, URL-safe Base64 without padding, or the decoded UTF-8 text; download as base64.txt" },
          { label: "Text length", value: "The tool sets no length cap. Above 1,000,000 characters the input box shows only the beginning, and the tool still works on all of it" },
          { label: "Not handled", value: "Files (see File to Base64) and binary results, which are reported as a byte count" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Encoding and decoding run in this page with your browser's TextEncoder, btoa and atob, so the text you paste is not sent anywhere and nothing is stored. If an error message appears or the browser refuses a copy, we receive that error, the tool's name and your browser's name and version, never the text you pasted, so that we can fix problems."}
        faqs={[
          { q: "Is Base64 encryption?", a: "No. Base64 only rewrites bytes with 64 printable characters, and anyone can decode it with this page or one line of code. Do not use it to hide passwords, keys or personal data; use real encryption for that." },
          { q: "How much longer is Base64 than my text?", a: "About a third longer than the UTF-8 bytes it encodes, since every three bytes become four characters. Most accented letters take two bytes and most emoji four, so text outside plain English grows more than its letter count suggests." },
          { q: "What does URL-safe Base64 change?", a: "It writes - and _ instead of + and /, and drops the = padding, which is the form JWTs and URL parameters use. The box only affects Encode; Decode reads both alphabets, with or without padding, without any setting." },
          { q: "Can Decode show an image or a ZIP stored in Base64?", a: "No. When the decoded bytes are not valid UTF-8 text, as with an image, a PDF or a ZIP, the tool gives their size in bytes instead of printing unreadable characters. It does not rebuild the file." },
          { q: "Can I encode a file or an image?", a: "No, this page encodes text. File to Base64 reads any file and gives a data URL or raw Base64, and Image to Base64 can also write an HTML img tag or a CSS background-image line for a picture." }
        ]}
        tips={[
          "To read one part of a JWT, paste it here and click \"Decode\": URL-safe input without padding is accepted as it is.",
          "A message saying the length is impossible usually means a character was lost when the Base64 was copied."
        ]}
      />
    </div>
  );
}