'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function UnicodeConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toUnicode = () => setOutput(input.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join(''));
  const fromUnicode = () => setOutput(input.replace(/\\u([0-9a-fA-F]{4})/g,(_,code) => String.fromCharCode(parseInt(code,16))));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unicode Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to Unicode escapes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or unicode..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">To Unicode</button>
            <button onClick={fromUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">From Unicode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="Unicode Converter"
        description="Unicode Converter converts text to and from JavaScript-style \uXXXX escape sequences, entirely in your browser — nothing is uploaded to a server. There's no format selector: it supports exactly one format (4-hex-digit \uXXXX escapes), not UTF-8, UTF-16, UTF-32, HTML entities, or other encodings. Emoji and other characters outside the Basic Multilingual Plane still convert correctly, since they're represented as a pair of \uXXXX surrogate escapes, matching how JavaScript itself stores them."
        howTo={[
          "Paste text into the input box.",
          "Click 'To Unicode' to convert each character to a \\uXXXX escape sequence.",
          "Or paste \\uXXXX escape sequences and click 'From Unicode' to convert them back to text.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "What Unicode formats does this tool support?", a: "Only one: 4-hex-digit \\uXXXX escape sequences, the format JavaScript uses in string literals. It doesn't support UTF-8 byte sequences, UTF-32, or HTML entities." },
          { q: "Is it free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Can I convert emoji?", a: "Yes — emoji and other characters outside the Basic Multilingual Plane convert correctly as a pair of \\uXXXX surrogate escapes." },
          { q: "Is my text uploaded to a server?", a: "No, all conversion happens locally in your browser." }
        ]}
        tips={[
          "The \\uXXXX format is exactly what you'd paste into a JavaScript string literal to represent that character.",
          "When converting from Unicode, make sure each escape uses exactly 4 hex digits (\\u0041), since that's the only pattern recognized.",
          "For byte-level encodings like UTF-8, use a dedicated encoding tool instead — this converts characters, not bytes.",
          "Emoji round-trip correctly, but each will show up as two \\uXXXX escapes (a surrogate pair), not one."
        ]}
      />
    </div>
  );
}