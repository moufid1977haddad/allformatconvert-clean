'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { htmlEncode, htmlDecode, browserNamedEntity } from '../../../lib/textCodecs';
export default function HtmlEncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => setOutput(htmlEncode(input));
  const decode = () => setOutput(htmlDecode(input, browserNamedEntity));
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
        title={"HTML Encoder"}
        description={"HTML Encoder converts the five characters that matter for safe HTML output — &, <, >, quote, and apostrophe — into their HTML entities, entirely in your browser. Decoding turns every HTML entity back into its character in a single pass — the five above, all named entities such as &nbsp; or &copy; (resolved by the browser's own HTML parser) and numeric ones such as &#8364; or &#x1F600; — so already-escaped text like &amp;lt; correctly decodes to &lt;, not <."}
        howTo={[
          "Paste or type text into the input box.",
          "Click 'Encode' to convert & < > \" ' into HTML entities, or 'Decode' to convert entities back into characters.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is HTML Encoder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which characters does it encode?", a: "Ampersand, less-than, greater-than, double quote, and apostrophe — the characters that matter for safely embedding text in HTML." },
          { q: "Does Decode handle entities like &nbsp; or &copy;?", a: "Yes — every named HTML entity and every numeric entity (decimal or hex) is decoded; tags and other text are left exactly as they are." },
          { q: "Does it decode twice?", a: "No — each entity is decoded once, so &amp;lt; becomes &lt; (the text of an entity), exactly as a browser would display it." }
        ]}
        tips={[
          "Encoding these five characters is exactly what's needed to safely place untrusted text inside HTML markup, preventing it from being interpreted as tags or breaking out of an attribute.",
          "Encode text before inserting it into an HTML attribute value to avoid breaking the surrounding quotes.",
          "Encode then Decode always gives back your original text."
        ]}
      />
    </div>
  );
}