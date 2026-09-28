'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { textToHex, hexToText } from '../../../lib/textCodecs';
export default function HexToTextPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toHex = () => setOutput(textToHex(input));
  const fromHex = () => {
    try { setOutput(hexToText(input)); } catch(e) { setOutput(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Hex to Text</h1>
        <p className="text-neutral-500 text-center mb-8">Convert between text and hexadecimal</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or hex..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Text to Hex</button>
            <button onClick={fromHex} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Hex to Text</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"Hex to Text"}
        description={"Hex to Text converts between plain text and hexadecimal bytes entirely in your browser — nothing is uploaded to a server. Text is encoded as UTF-8, like every hex editor and programming language, so é becomes c3 a9 and emoji or non-Latin scripts round-trip exactly. Hex input may use spaces, commas, colons, 0x prefixes or \\x escapes between bytes; an odd number of digits, a non-hex character, or bytes that aren't valid UTF-8 text are reported instead of producing garbled output."}
        howTo={[
          "Paste or type text or hex into the input box.",
          "Click 'Text to Hex' to get the UTF-8 bytes as space-separated hex pairs, or 'Hex to Text' to decode hex back into text.",
          "Read the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is Hex to Text free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What hex format does it expect?", a: "Two hex digits per byte, upper- or lowercase, with or without separators: 48656c6c6f, 48 65 6c 6c 6f, 0x48,0x65 and \\x48\\x65 all work." },
          { q: "Does it work with any Unicode text, like emoji?", a: "Yes — text is converted to UTF-8 bytes (é is c3 a9, 😀 is f0 9f 98 80), and hex is decoded as UTF-8, so any text round-trips exactly." },
          { q: "What if the hex isn't text?", a: "If the bytes aren't valid UTF-8 (binary data, or text in another encoding), the tool says so instead of showing garbled characters." }
        ]}
        tips={[
          "Hex output is the UTF-8 encoding, the same bytes Python's text.encode().hex() or a hex editor shows.",
          "An odd number of hex digits means a byte is incomplete — the tool points it out.",
          "Copy your result right away, since it isn't saved after you leave the page."
        ]}
      />
    </div>
  );
}