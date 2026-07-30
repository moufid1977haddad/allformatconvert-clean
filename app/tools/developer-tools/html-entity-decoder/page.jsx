'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function HtmlEntityDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  // DOMParser-parsed documents never fetch resources or run scripts/event handlers
  // (unlike setting innerHTML on a div, even a detached one), so this can't execute
  // payloads like <img src=x onerror="..."> the way the previous implementation could.
  const decode = () => { const doc = new DOMParser().parseFromString(input, 'text/html'); setOutput(doc.documentElement.textContent || ''); };
  const encode = () => setOutput(input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Entity Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode HTML entities</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title="HTML Entity Decoder"
        description="HTML Entity Decoder decodes HTML entities — named ones like nbsp, copy, and euro, and numeric ones — back into plain text using the browser's own DOMParser, entirely in your browser. Unlike parsing untrusted HTML by setting innerHTML on an element, DOMParser-parsed documents never fetch resources or run scripts or event handlers, so pasted content can't execute anything. Encode escapes the five characters that matter for safe HTML output: ampersand, less-than, greater-than, double quote, and apostrophe."
        howTo={[
          "Paste or type text into the input box.",
          "Click 'Encode' to escape & < > \" ' into HTML entities, or 'Decode' to convert entities (named or numeric) back into text.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "What are HTML entities?", a: "Codes that represent characters with special meaning in HTML, such as &amp; for an ampersand, &lt; for a less-than sign, or &nbsp; for a non-breaking space." },
          { q: "Which entities does Decode understand?", a: "A broad range — both named entities (like &nbsp;, &copy;, &euro;) and numeric ones (like &#39; or &#8364;) — since decoding is delegated to the browser's own HTML parser rather than a fixed lookup list." },
          { q: "Is this tool free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it store or upload my data?", a: "No, encoding and decoding both happen entirely in your browser using DOMParser; nothing is sent to a server." }
        ]}
        tips={[
          "Decode handles far more entities than Encode produces — it recognizes the full range of standard named and numeric HTML entities, not just the five Encode escapes.",
          "Encoding is a straight text replacement of & < > \" ', so it works reliably regardless of the rest of your content.",
          "Encode then Decode round-trips back to your original text exactly, since decoding uses the browser's real HTML-parsing rules.",
          "Copy your result right away, since it isn't saved after you leave the page."
        ]}
      />
    </div>
  );
}