'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { textToHex, hexToText } from '../../../lib/textCodecs';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function HexToTextPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toHex = () => setOutput(textToHex(input));
  const fromHex = () => {
    try { setOutput(hexToText(input)); } catch (e) { reportShownMessage(e); setOutput(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hex to Text</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between text and hexadecimal</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or hex..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Text to Hex</button>
            <button onClick={fromHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Hex to Text</button>
          </div>
          {output && <div className="space-y-2"><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="converted.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"Hex to Text"}
        description={"Hex to Text converts between text and its UTF-8 bytes written in hexadecimal, using your browser's own text encoder. Text to Hex writes each byte as two lowercase digits separated by spaces, so é gives c3 a9, ☕ three bytes and 😀 four. Hex to Text reads digit pairs with or without separators (spaces, commas, colons, semicolons, hyphens) and accepts the 0x48 and \\x48 notations. It refuses an odd number of digits, characters that are not hex, and bytes that are not valid UTF-8, instead of printing garbage. Latin-1, UTF-16 and other encodings are not decoded."}
        example={{
          caption: "A short text with an accent and an emoji turned into bytes, then C-style hex bytes turned back into text:",
          inputLabel: "Input",
          input: "Hi é😀\n\n0x48,0x69,0x20,0xc3,0xa9",
          outputLabel: "Result",
          output: "Text to Hex: 48 69 20 c3 a9 f0 9f 98 80\n\nHex to Text: Hi é",
        }}
        howToTitle={"How to convert hex to text"}
        howTo={[
          "Paste hex bytes, or the text you want to see as hex.",
          "Click \"Hex to Text\" to decode the bytes as UTF-8, or \"Text to Hex\" to get space-separated byte pairs.",
          "If the result box shows a message instead, it names the problem: an odd number of digits, a character that is not hex, or bytes that are not UTF-8.",
          "Take the bytes or the text with \"Copy\", or save them in converted.txt through \"Download\"."
        ]}
        specs={[
          { label: "Hex input", value: "Pairs of 0-9 and a-f in either case; spaces, commas, colons, semicolons and hyphens ignored; 0x48 and \\x48 forms accepted" },
          { label: "Hex output", value: "Lowercase byte pairs separated by single spaces" },
          { label: "Text encoding", value: "UTF-8 only, in both directions" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Both directions use your browser's TextEncoder and TextDecoder inside this page, so neither the hex nor the text leaves your computer. When the tool shows an error, such as an odd number of digits, or the browser refuses a copy, we receive that message, the tool's name and your browser's name and version, without what you pasted."}
        faqs={[
          { q: "Is é written as two bytes?", a: "Yes: c3 a9, because the tool writes UTF-8 bytes. e9 is the Latin-1 code for é; pasting e9 alone into Hex to Text gives an error, since that single byte is not valid UTF-8." },
          { q: "What hex formats can I paste?", a: "Any pairs of hex digits: 48656c6c6f, 48 65 6c 6c 6f, 48:65:6c, 0x48,0x65 or \\x48\\x65. Upper and lower case both work, and separators are removed before decoding, so mixing them is fine." },
          { q: "Can it decode Latin-1 or Windows-1252 bytes?", a: "No. The tool decodes UTF-8 only. Bytes saved in another encoding, or binary data, get the message that they are not valid UTF-8 text, rather than wrong characters." },
          { q: "How many bytes does one character take?", a: "One to four in UTF-8: plain Latin letters one, most accented Latin letters two, ☕ and most Chinese and Japanese characters three, and emoji such as 😀 four (f0 9f 98 80)." }
        ]}
        tips={[
          "To see the \\uXXXX escapes a JavaScript string uses instead of bytes, try Unicode Converter."
        ]}
      />
    </div>
  );
}