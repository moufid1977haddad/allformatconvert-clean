'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { parseJsonLossless, losslessToText } from '../../../lib/jsonLossless';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
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
  const [error, setError] = useToolError('');
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
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">XML Output</label><TextArea aria-label="XML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"JSON to XML writes pasted JSON as an indented XML document that starts with an XML declaration and wraps everything in a root element. Each key becomes a tag; an array becomes the same tag repeated, and a top-level array becomes item elements. Keys that start with @_ become attributes and a #text key becomes the text of its element, following the fast-xml-parser conventions. Text is escaped, numbers are kept as written, and a key that cannot be an XML name is reported instead of producing broken XML."}
        example={{"caption":"A book object with an @_id key, an array and an ampersand, and the XML the tool returns:","inputLabel":"JSON","input":"{\n  \"book\": {\n    \"@_id\": \"7\",\n    \"title\": \"Tom & Jerry\",\n    \"tags\": [\"kids\", \"cartoon\"],\n    \"price\": 12.50\n  }\n}","outputLabel":"XML","output":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>\n  <book id=\"7\">\n    <title>Tom &amp; Jerry</title>\n    <tags>kids</tags>\n    <tags>cartoon</tags>\n    <price>12.50</price>\n  </book>\n</root>\n"}}
        howToTitle="How to convert JSON to XML"
        howTo={[
          "Paste JSON into \"JSON Input\"; put @_ before any key you want as an attribute.",
          "Click \"Convert\".",
          "Read the XML in \"XML Output\", or the message naming a key that is not a valid XML name.",
          "Use \"Copy\", or \"Download\" for a data.xml file.",
        ]}
        specs={[
          { label: "Input", value: "JSON text" },
          { label: "Output", value: "XML with a declaration, a root element and two-space indentation; file data.xml" },
          { label: "Element names", value: "a letter or _ first, then letters, digits, _ . - or :" },
        ]}
        privacy={"The XML is built in your browser by the fast-xml-parser library, loaded when you first click \"Convert\"; your JSON is not uploaded. When a conversion fails, a report reaches us with the error text, quoted parts masked, the tool name and your browser name and version."}
        faqs={[
          { q: "Can I create XML attributes?", a: "Yes. Prefix the key with @_: a book object holding @_id with the value 7 gives <book id=\"7\">. A #text key next to it becomes the element's text, so one element can carry both attributes and content." },
          { q: "Does the output have a single root element?", a: "Yes. An XML document needs exactly one, so the result is always wrapped in <root>; a JSON array at the top level gives one <item> per entry inside it. Rename root afterwards if your system expects another name." },
          { q: "Are special characters escaped?", a: "Yes. & becomes &amp; and < becomes &lt; in text, as the example shows, so the document stays well-formed. A key with a space, or one that starts with a digit, is refused with a message, because no escaping can turn it into a valid tag name." },
          { q: "Are numbers written exactly as in the JSON?", a: "Yes. The JSON is read without turning numbers into floating point, so a price of 12.50 gives <price>12.50</price> and a 20-digit ID keeps every digit in its element. A null value becomes an empty element." },
        ]}
        tips={[
          "To read XML back into JSON, with attributes as @_ keys, use XML to JSON.",
        ]}
      />
    </div>
  );
}
