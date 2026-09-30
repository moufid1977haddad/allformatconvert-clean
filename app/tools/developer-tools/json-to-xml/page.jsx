'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseJsonLossless, losslessToText } from '../../../lib/jsonLossless';
import { TextDownload } from '../../../components/FileDownload';
// XML 1.0 element names: a letter or _ first, then letters, digits, _ . - (and
// : for a namespace prefix). Keys starting with @_ become attributes and #text
// is element text (fast-xml-parser's conventions), so they are allowed.
const XML_NAME = /^[\p{L}_][\p{L}\p{N}_.:-]*$/u;
function findInvalidXmlName(v, path) {
  if (Array.isArray(v)) {
    for (let i = 0; i < v.length; i++) { const r = findInvalidXmlName(v[i], `${path}[${i}]`); if (r) return r; }
  } else if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      const name = k.startsWith('@_') ? k.slice(2) : k;
      if (k !== '#text' && !XML_NAME.test(name)) {
        return `The key "${k}"${path ? ' (in ' + path + ')' : ''} can't be an XML ${k.startsWith('@_') ? 'attribute' : 'element'} name: names start with a letter or _ and contain no spaces or symbols other than _ . - :. Rename it and convert again.`;
      }
      const r = findInvalidXmlName(v[k], path ? `${path}.${k}` : k);
      if (r) return r;
    }
  }
  return null;
}

export default function JsonToXmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = async () => {
    try {
      // Numbers keep their exact text (12345678901234567890 was written as
      // 12345678901234567000, 1.10 as 1.1), and a key that cannot be an XML
      // element name ("first name", "1st") is reported: it used to produce a
      // document no XML parser accepts, without a word (29/09).
      const obj = losslessToText(parseJsonLossless(input));
      const badName = findInvalidXmlName(obj, '');
      if (badName) { setOutput(''); setError(badName); return; }
      // fast-xml-parser is loaded on demand -- it's only needed once the
      // visitor actually clicks Convert, so it doesn't add to the page's
      // initial JS payload.
      const { XMLBuilder } = await import('fast-xml-parser');
      const builder = new XMLBuilder({ format: true, indentBy: '  ', ignoreAttributes: false });
      // A top-level JSON array has no single tag name of its own, so it's
      // wrapped under a generic <item> element -- repeated once per array
      // entry -- to keep the document to one root element, the way any
      // other top-level array would need a wrapper to be valid XML.
      const payload = Array.isArray(obj) ? { item: obj } : obj;
      const xml = builder.build({ root: payload });
      setOutput('<?xml version="1.0" encoding="UTF-8"?>\n' + xml);
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to XML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to XML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">XML Output</label><textarea aria-label="XML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.xml" /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to XML"
        description="JSON to XML recursively converts JSON into nested XML tags using the fast-xml-parser library, entirely in your browser. Each key becomes a tag name, objects nest naturally, text is escaped automatically (so an ampersand or a less-than sign in a value doesn't break the output), and array items become repeated sibling tags with the same name — the standard, valid way to represent a list in XML."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate nested XML tags.",
          "Arrays and special characters are handled automatically — no manual cleanup needed.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to XML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it handle nested JSON objects?", a: "Yes — nested objects convert into properly nested XML tags at any depth." },
          { q: "Does it escape special characters like & and <?", a: "Yes — text values are escaped automatically (& becomes &amp;, < becomes &lt;, and so on), so the output is well-formed XML." },
          { q: "Does it convert JSON arrays correctly?", a: "Yes — array items become repeated sibling tags under the same name (e.g. three tags named tag for a 3-item array), which is valid XML and the conventional way array-like data is represented." }
        ]}
        tips={[
          "A top-level JSON array is wrapped in a generic <item> element per entry, since XML documents need exactly one root element.",
          "Nested objects convert cleanly at any depth.",
          "Special characters in text values no longer need manual escaping — the converter handles it.",
          "Validate the output with an XML parser before using it in a real system, especially for very unusual key names (XML tag names have their own rules, e.g. they can't start with a digit)."
        ]}
      />
    </div>
  );
}
