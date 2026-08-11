'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function UrlEncoderDevPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => { try { setOutput(encodeURIComponent(input)); } catch(e) { setOutput('Error'); } };
  const decode = () => { try { setOutput(decodeURIComponent(input)); } catch(e) { setOutput('Invalid URL encoding'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode URLs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste URL here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="URL Encoder"
        description="URL Encoder encodes and decodes text using JavaScript's encodeURIComponent and decodeURIComponent, entirely in your browser — nothing is uploaded to a server. It's built for encoding a single value (like a query parameter), not a whole URL: running a full URL like https://example.com/path?a=1&b=2 through it will over-encode structural characters such as /, :, ?, &, and =, breaking it as a usable link. A working 'Decode' button is included alongside 'Encode'."
        howTo={[
          "Paste the value you want to encode (a query parameter, path segment, etc., not a full URL) into the input box.",
          "Click 'Encode' to percent-encode special characters and spaces.",
          "To reverse it, paste percent-encoded text and click 'Decode'.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "What is URL encoding?", a: "It converts characters that aren't safe in a URL (spaces, &, =, and others) into a %XX percent-encoded format." },
          { q: "Can I encode a whole URL with this tool?", a: "Not safely — encoding a full URL will also encode its structural characters (like / and :), breaking it. Encode individual values (e.g. a query parameter) instead, then build the full URL around them." },
          { q: "Can I decode with this tool?", a: "Yes — there's a 'Decode' button next to 'Encode' that reverses percent-encoding back to the original text." },
          { q: "Is my data uploaded to a server?", a: "No, encoding and decoding happen entirely in your browser." }
        ]}
        tips={[
          "Encode individual query parameter values, not the full URL string, to avoid breaking the URL's structure.",
          "If decoding fails with an error, the input likely contains a malformed percent-encoding sequence.",
          "Spaces are encoded as %20, matching standard percent-encoding (not + as some legacy form-encoding tools do).",
          "Use this before inserting user-provided text into a query string, so special characters don't break the URL."
        ]}
      />
    </div>
  );
}