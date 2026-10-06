'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { htmlEncode, htmlDecode, browserNamedEntity } from '../../../lib/textCodecs';
import { TextDownload } from '../../../components/FileDownload';
import TextArea from '@/app/components/TextArea';
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
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Decode</button>
          </div>
          {output && <div className="space-y-2"><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="encoded.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"HTML Encoder"}
        description={"HTML Encoder escapes the five characters that HTML reads as markup: & becomes &amp;, < becomes &lt;, > becomes &gt;, the double quote becomes &quot; and the apostrophe becomes &#39;. Use it before you put user text, a code sample or an attribute value into a page, so that it shows as text instead of being read as tags. All other characters, accents and emoji included, are left as they are. The Decode button does the reverse for named and numeric entities, in a single pass. Both buttons are handled by this page's own script."}
        example={{
          caption: "A link with a quoted title and a comparison, escaped with Encode:",
          inputLabel: "Text",
          input: "<a title=\"Tom's\">5 > 3 & 2 < 4</a>",
          outputLabel: "Encode",
          output: "&lt;a title=&quot;Tom&#39;s&quot;&gt;5 &gt; 3 &amp; 2 &lt; 4&lt;/a&gt;",
        }}
        howToTitle={"How to escape text for HTML"}
        howTo={[
          "Paste the text or code sample you want to show on a web page.",
          "Click \"Encode\" to replace the ampersand, the angle brackets and both kinds of quotes with entities.",
          "To undo it, paste escaped text and click \"Decode\".",
          "Click \"Copy\" and paste the escaped result into your HTML, or keep it with \"Download\" (the file is encoded.txt, even after a decode)."
        ]}
        specs={[
          { label: "Escaped by Encode", value: "& < > and both quote marks, written &amp; &lt; &gt; &quot; &#39;" },
          { label: "Read by Decode", value: "Every named entity your browser knows, plus decimal and hex numeric entities" },
          { label: "Passes", value: "One: &amp;lt; becomes &lt;, never <" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Escaping is a plain text replacement done by this page's script, and named entities are looked up with your browser's own HTML parser, which runs no script and loads nothing. Nothing you paste leaves the page or is stored. When something fails, such as a copy the browser refuses, we get that error with the tool's name and your browser's name and version, not your text."}
        faqs={[
          { q: "Is escaping these five characters enough to make text safe in HTML?", a: "Yes for text between tags and for attribute values inside quotes. No for an unquoted attribute, a link address (a javascript: address stays harmful once escaped), or code placed inside script or style elements: those need other escaping or validation." },
          { q: "Does Decode read both &#39; and &apos;?", a: "Yes. Encode writes the apostrophe as &#39;, and Decode turns both &#39; and &apos; back into an apostrophe, so text escaped either way reads the same after decoding." },
          { q: "Does it encode accented letters or emoji?", a: "No. Only the five markup characters are replaced; é, ü or 😀 stay as they are, which suits any page saved as UTF-8. Decode still reads entities such as &eacute; or &#x1F600; if you paste them." },
          { q: "Will Encode then Decode give my text back?", a: "Yes. Decode reads each entity once, so the &amp; written by Encode turns back into & without touching what follows it, and text that already contained entities comes back unchanged." }
        ]}
        tips={[
          "Escape a code sample once only: encoding it twice makes the page show &amp;lt; instead of <."
        ]}
      />
    </div>
  );
}