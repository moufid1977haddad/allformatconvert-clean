'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { base64Encode, base64Decode } from '../../../lib/textCodecs';
export default function Base64EncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const encode = () => setOutput(base64Encode(input, { urlSafe }));
  const decode = () => {
    try {
      const { text, bytes } = base64Decode(input);
      setOutput(text !== null ? text : `This Base64 decodes to ${bytes.length} bytes of binary data, not UTF-8 text (for example an image or a compressed file), so it can't be shown as text.`);
    } catch(e) { setOutput(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Base64 Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode Base64</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste text here..." value={input} onChange={e => setInput(e.target.value)} />
          <label className="flex items-center justify-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={urlSafe} onChange={e => setUrlSafe(e.target.checked)} /> URL-safe Base64 when encoding (- and _ instead of + and /, no = padding — as in JWT and URLs)</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"Base64 Encoder"}
        description={"Base64 Encoder converts text to and from Base64 entirely in your browser — nothing is uploaded to a server. Text is encoded as UTF-8, the encoding every API, email system and programming language uses, so accented letters, non-Latin scripts and emoji round-trip exactly. Decoding accepts standard and URL-safe Base64 (- and _), missing = padding, and line breaks from wrapped MIME or PEM data; invalid input is reported with the reason, and Base64 that holds binary data rather than text is identified as such instead of being shown as garbled characters."}
        howTo={[
          "Paste or type text (to encode) or Base64 (to decode) into the input box.",
          "Tick 'URL-safe' if the result goes into a URL or a JWT.",
          "Click 'Encode' or 'Decode'.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "Is Base64 Encoder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What is Base64 encoding used for?", a: "Converting binary or text data into an ASCII string, making it safe to transmit across email, APIs, and web protocols that may not handle raw binary data well." },
          { q: "Is this tool secure and private?", a: "Yes — encoding and decoding happen entirely in your browser; nothing is sent to a server." },
          { q: "Can I encode any text, including emoji or non-Latin characters?", a: "Yes — text is converted to UTF-8 bytes first, so café, 日本語 or 😀 encode and decode back exactly, and the result matches what other tools and programming languages produce (for example Python's base64.b64encode(text.encode()))." },
          { q: "Does it decode URL-safe Base64 and Base64 without padding?", a: "Yes — - and _ are accepted in place of + and /, the = padding may be missing, and spaces or line breaks are ignored." },
          { q: "Can I encode large files?", a: "No — this tool works on pasted text; it doesn't take file uploads." }
        ]}
        tips={[
          "If decoding says the data is binary, the Base64 holds a file (an image, a PDF, a ZIP), not text.",
          "Use URL-safe encoding for values placed in URLs, file names or JWTs.",
          "Invalid Base64 is reported with the reason (a character outside the alphabet, or an impossible length) rather than decoded to garbage.",
          "Copy the result right away, since nothing is saved after you leave the page."
        ]}
      />
    </div>
  );
}