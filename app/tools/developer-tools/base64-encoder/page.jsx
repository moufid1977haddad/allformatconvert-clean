'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function Base64EncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => { try { setOutput(btoa(input)); } catch(e) { setOutput('Error encoding'); } };
  const decode = () => { try { setOutput(atob(input)); } catch(e) { setOutput('Invalid Base64'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Base64 Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode Base64</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste text here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Base64 Encoder"
        description="Base64 Encoder converts text to and from Base64 directly in your browser using the built-in btoa()/atob() functions — nothing is uploaded to a server. It only handles Latin1 text (basic Latin letters, digits, and common punctuation); text containing emoji, most non-Latin scripts, or other characters outside that range will fail to encode, and decoding Base64 built from UTF-8 text with such characters will often produce garbled output rather than the original."
        howTo={[
          "Paste or type text into the input box.",
          "Click 'Encode' to convert it to Base64, or 'Decode' to convert Base64 back to text.",
          "Read the result in the output box below.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What is Base64 encoding used for?", a: "Converting binary or text data into an ASCII string, making it safe to transmit across email, APIs, and web protocols that may not handle raw binary data well." },
          { q: "Is this tool secure and private?", a: "Yes — encoding and decoding happen entirely in your browser; nothing is sent to a server." },
          { q: "Can I encode any text, including emoji or non-Latin characters?", a: "Not reliably. The underlying browser function only supports Latin1 text, so text with emoji or many non-Latin scripts will fail with \"Error encoding,\" and decoding Base64 representing such characters often produces garbled text instead of the original." },
          { q: "Can I encode large files?", a: "No — this tool only accepts pasted text, not file uploads, so it isn't meant for encoding files." }
        ]}
        tips={[
          "Stick to plain ASCII/Latin1 text for reliable round-trip encoding and decoding.",
          "If decoding produces garbled characters, the original text likely included non-Latin1 characters this simple browser-based method can't reconstruct.",
          "Invalid Base64 input shows \"Invalid Base64\" during decoding rather than garbled text.",
          "Copy the result right away, since nothing is saved after you leave the page."
        ]}
      />
    </div>
  );
}