'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { htmlEncode, htmlDecode, browserNamedEntity } from '../../../lib/textCodecs';
import { TextDownload } from '../../../components/FileDownload';
import TextArea from '@/app/components/TextArea';
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
        <p className="text-neutral-500 text-center mb-8">Turn HTML entities back into readable characters</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {output && <div className="space-y-2"><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="decoded.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"HTML Entity Decoder"}
        description={"HTML Entity Decoder reads text full of HTML entities, as found in RSS feeds, CMS exports, scraped pages or e-mail source, and writes the real characters. Named entities such as &eacute;, &mdash; or &nbsp; are looked up by your browser's HTML parser, so every name it knows works; numeric ones, decimal (&#8364;) or hex (&#x20AC;), are converted directly. Tags such as <b> are kept exactly, and each entity is decoded once per click. An Encode button is there too, for the opposite direction; both work inside this tab."}
        example={{
          caption: "A line copied from a feed's source, decoded with one click:",
          inputLabel: "Text with entities",
          input: "Price: &euro;5 &ndash; &copy; 2026 &#x1F600; <b>&amp;lt;b&amp;gt;</b>",
          outputLabel: "Decode",
          output: "Price: €5 – © 2026 😀 <b>&lt;b&gt;</b>",
        }}
        howToTitle={"How to decode HTML entities"}
        howTo={[
          "Paste the text that shows codes such as &amp; or &#39; instead of characters.",
          "Click \"Decode\" to replace every entity with its character; tags stay in place.",
          "If the result still shows codes like &lt;, the source was escaped twice: copy the result back into the input box and click \"Decode\" again.",
          "The clean text lands in the lower box, where \"Copy\" takes it and \"Download\" saves it as decoded.txt."
        ]}
        specs={[
          { label: "Named entities", value: "Every name known to your browser's HTML parser, written with its final semicolon (a few old names also work without it)" },
          { label: "Numeric entities", value: "Decimal and hex, up to U+10FFFF; zero, surrogates and larger codes give the replacement character" },
          { label: "Tags and other text", value: "Left exactly as written" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Decoding happens in this tab: numeric codes are converted by the page's own script, and each named entity is handed alone to your browser's DOMParser, which does not run scripts or fetch images. What you paste stays in this tab and disappears when it closes. A crash of this page, a blocked clipboard included, sends us an error report with the cleaned error message, this tool's name and your browser with its version; nothing you pasted is part of it."}
        faqs={[
          { q: "Why does my text still show &amp; after decoding?", a: "It was escaped twice, which some CMS and export scripts do: &amp;amp; decodes to &amp;. Each Decode removes exactly one layer and always reads the input box, so copy the result back into it and decode again to reach the plain character." },
          { q: "Are HTML tags removed?", a: "No. Only entities change; tags such as <b>, <p> or <a href> stay exactly as written in the output. That keeps the markup intact when you only want readable accents and symbols." },
          { q: "Is &nbsp; turned into an ordinary space?", a: "No. It becomes a non-breaking space (U+00A0), which looks the same on screen but is a different character, so a search or a comparison with a normal space will not match it." },
          { q: "Which numeric entities give a replacement character?", a: "Zero, the surrogate range &#xD800; to &#xDFFF; and anything above &#x10FFFF; give �. Codes 128 to 159 give invisible control characters here, whereas browsers display them as Windows-1252 symbols such as an en dash." }
        ]}
        tips={[
          "Paste the page source, not the rendered page: text copied from a displayed page has no entities left to decode.",
          "Need the reverse? \"Encode\" on this page escapes the ampersand, angle brackets and quotes."
        ]}
      />
    </div>
  );
}