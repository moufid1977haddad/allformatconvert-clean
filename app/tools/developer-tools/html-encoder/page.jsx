'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function HtmlEncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => setOutput(input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'));
  const decode = () => setOutput(input.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode HTML entities</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="HTML Encoder"
        description="HTML Encoder converts the five characters that matter for safe HTML output — &, <, >, quote, and apostrophe — into their HTML entities, entirely in your browser using simple text replacement. Decoding reverses exactly those same five entities; other named entities like a non-breaking space or copyright symbol aren't produced or recognized by this tool."
        howTo={[
          "Paste or type text into the input box.",
          "Click 'Encode' to convert & < > \" ' into HTML entities, or 'Decode' to convert those five entities back.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Which characters does it encode?", a: "Ampersand, less-than, greater-than, double quote, and apostrophe — the characters that matter for safely embedding text in HTML." },
          { q: "Is HTML Encoder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does Decode handle entities like &nbsp; or &copy;?", a: "No — it only reverses the same five entities this tool's own Encode produces. Named entities beyond those five aren't recognized." },
          { q: "Is my data uploaded to a server?", a: "No, encoding and decoding both happen entirely in your browser." }
        ]}
        tips={[
          "Encoding these five characters is exactly what's needed to safely place untrusted text inside HTML markup, preventing it from being interpreted as tags or breaking out of an attribute.",
          "For decoding a broader range of named or numeric HTML entities (like &nbsp; or &#8364;), you'll need a more complete decoder than this tool's Decode button.",
          "Encode text before inserting it into an HTML attribute value to avoid breaking the surrounding quotes.",
          "Keep a copy of your original text, since encoding and decoding overwrite the output box each time."
        ]}
      />
    </div>
  );
}