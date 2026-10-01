'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { htmlEncode, htmlDecode, browserNamedEntity } from '../../../lib/textCodecs';
import { TextDownload } from '../../../components/FileDownload';
export default function HtmlEntityDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  // Entities are decoded one at a time; named ones are resolved by the
  // browser's own parser (DOMParser never runs scripts or loads resources).
  // Tags in the input are kept: the previous whole-document parse silently
  // dropped them ("<b>x</b>" became "x").
  const decode = () => setOutput(htmlDecode(input, browserNamedEntity));
  const encode = () => setOutput(htmlEncode(input));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Entity Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode HTML entities</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="decoded.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"HTML Entity Decoder"}
        description={"HTML Entity Decoder decodes HTML entities — named ones like &nbsp;, &copy; and &euro;, and numeric ones like &#8364; or &#x1F600; — back into characters, entirely in your browser. Named entities are resolved by the browser's own HTML parser (DOMParser, which never runs scripts or loads resources), one entity at a time: everything else in your text, including any HTML tags, is left exactly as written, and each entity is decoded once (&amp;lt; gives &lt;)."}
        howTo={[
          "Paste or type text into the input box.",
          "Click 'Decode' to convert entities (named or numeric) into characters, or 'Encode' to escape & < > \" ' into entities.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is HTML Entity Decoder free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What are HTML entities?", a: "Codes that represent characters with special meaning in HTML, such as &amp; for an ampersand, &lt; for a less-than sign, or &nbsp; for a non-breaking space." },
          { q: "Which entities does Decode understand?", a: "Every named HTML5 entity (like &nbsp;, &copy;, &euro;) and every numeric one, decimal (&#8364;) or hexadecimal (&#x20AC;), including emoji code points." },
          { q: "Are HTML tags in my text removed?", a: "No — only entities are decoded; tags such as <b> stay in the output exactly as written." },
          { q: "Does it store or upload my data?", a: "No, encoding and decoding both happen entirely in your browser; what you enter is never sent to a server." }
        ]}
        tips={[
          "Encode then Decode round-trips back to your original text exactly.",
          "An invalid numeric entity (such as &#0;) is shown as the replacement character �, as browsers do.",
          "Copy your result right away, since it isn't saved after you leave the page."
        ]}
      />
    </div>
  );
}