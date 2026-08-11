'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function HexToTextPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toHex = () => setOutput(input.split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' '));
  const fromHex = () => {
    const cleaned = input.replace(/\s/g,'');
    if (!/^([0-9a-fA-F]{2})+$/.test(cleaned)) { setOutput('Invalid hex'); return; }
    setOutput(cleaned.match(/.{2}/g).map(h => String.fromCharCode(parseInt(h,16))).join(''));
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
        title="Hex to Text"
        description="Hex to Text converts between plain text and hexadecimal character codes entirely in your browser using JavaScript's built-in character-code functions — nothing is uploaded to a server. It reliably round-trips Latin1 text (character codes 0-255); characters outside that range (emoji, most non-Latin scripts) produce hex codes wider than the standard 2-digit pairs, which won't convert back correctly since the reverse direction always splits the hex into fixed 2-character chunks."
        howTo={[
          "Paste or type text or hex into the input box.",
          "Click 'Text to Hex' to convert text into space-free hex character codes, or 'Hex to Text' to convert hex back into text.",
          "Read the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is Hex to Text free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What hex format does it expect?", a: "Two-character hex pairs, with or without spaces between them (e.g. 48656c6c6f or 48 65 6c 6c 6f). Both uppercase and lowercase are accepted." },
          { q: "Does it work with any Unicode text, like emoji?", a: "Not reliably — it works cleanly for Latin1 text (character codes 0-255). Characters outside that range produce hex wider than 2 digits, which the hex-to-text direction can't correctly reconstruct since it always reads fixed 2-character chunks." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Stick to Latin1 text (standard Latin letters, digits, and common punctuation) for reliable round-trip conversion.",
          "If Hex to Text shows 'Invalid hex', check for an odd number of hex digits or stray non-hex characters in your input.",
          "For text with accented or non-Latin characters, expect the hex output to not cleanly convert back — that's a limitation of this simple character-code approach.",
          "Copy your result right away, since it isn't saved after you leave the page."
        ]}
      />
    </div>
  );
}