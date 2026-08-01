'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function UrlEncoderPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);
  const encode = () => setResult(encodeURIComponent(text));
  const decode = () => {
    try {
      setResult(decodeURIComponent(text));
    } catch(e) {
      setResult('Invalid URL encoding');
    }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode URLs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your URL or text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="URL Encoder"
        description="URL Encoder converts special characters and spaces into percent-encoded format (and back again), using the browser's built-in encodeURIComponent/decodeURIComponent, entirely in your browser."
        howTo={[
          "Paste your URL or text into the input field.",
          "Click \"Encode\" to convert special characters to percent-encoded format, or \"Decode\" to reverse a percent-encoded string.",
          "Review the result in the output field.",
          "Click \"Copy\" to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What is URL encoding and why do I need it?", a: "URL encoding converts special characters into a format safe for transmission in URLs. Characters like spaces, ampersands, and slashes are replaced with percent signs followed by hexadecimal values." },
          { q: "Is URL Encoder free to use?", a: "Yes, it's completely free with no signup and no limits." },
          { q: "Can I decode URLs too?", a: "Yes, the \"Decode\" button converts percent-encoded text back to its readable form; invalid encoded input shows an error message instead of crashing." },
          { q: "Which characters get encoded?", a: "Spaces, accented letters, symbols, and reserved characters like &, ?, #, and / are encoded. Letters, numbers, hyphens, underscores, periods, and tildes are left unchanged, matching the standard encodeURIComponent behavior." }
        ]}
        tips={[
          "Encode query parameter values individually before building a URL, so characters like & or = inside a value don't break the URL structure.",
          "If \"Decode\" shows \"Invalid URL encoding,\" the input contains a malformed percent sequence — double check it was copied completely.",
          "Test your encoded URL in a browser address bar to confirm it resolves to the correct destination.",
          "Keep the original, unencoded text handy for reference before re-encoding after edits."
        ]}
      />
    </div>
  );
}