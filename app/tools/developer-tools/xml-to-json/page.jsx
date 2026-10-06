'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function XmlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const [note, setNote] = useState('');
  const [converting, setConverting] = useState(false);
  const convert = async () => {
    setConverting(true);
    setError('');
    try {
      // fast-xml-parser is loaded on demand -- it's only needed once the
      // visitor actually clicks Convert, so it doesn't add to the page's
      // initial JS payload.
      const { XMLParser, XMLValidator } = await import('fast-xml-parser');
      const validation = XMLValidator.validate(input);
      if (validation !== true) {
        throw new Error(validation?.err?.msg || 'Invalid XML');
      }
      const parser = new XMLParser({
        ignoreAttributes: false, // keep attributes -- previously silently dropped
        attributeNamePrefix: '@_',
        textNodeName: '#text', // matches the '#text' convention this tool already documented
        ignoreDeclaration: true, // drop the <?xml ...?> prolog from the output, as before
        // Keep element text exactly as written. fast-xml-parser's default turns numeric-looking
        // text into numbers, which silently dropped leading zeros (measured 2026-09-22: phone
        // 0612345678 -> 612345678, zip 01234 -> 1234) and would turn version 1.10 into 1.1.
        parseTagValue: false,
      });
      const parsed = parser.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
      // P24 review (03/10): text mixed with tags (<p>Hello <b>world</b> again</p>) has no JSON form: its text parts are
      // joined ("Helloagain") and their place among the tags is lost. Said, with the elements concerned.
      const mixed = new Set();
      const walk = (v, name) => { if (Array.isArray(v)) return v.forEach((x) => walk(x, name)); if (!v || typeof v !== 'object') return; const keys = Object.keys(v); if (keys.includes('#text') && keys.some((k) => k !== '#text' && !k.startsWith('@_'))) mixed.add(name); for (const k of keys) if (!k.startsWith('@_') && k !== '#text') walk(v[k], k); };
      walk(parsed, '(root)');
      setNote(mixed.size ? `<${[...mixed].slice(0, 3).join('>, <')}>${mixed.size > 3 ? ', …' : ''} mix${mixed.size > 1 ? '' : 'es'} text and tags: JSON keeps the text parts joined in "#text", without their place among the tags (and without the spaces around them).` : '');
    } catch (e) {
      setError('Invalid XML' + (e?.message ? `: ${e.message}` : ''));
      setOutput('');
    }
    setConverting(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert XML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">XML Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><TextArea aria-label="JSON Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.json" /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {note && !error && <p className="text-amber-700 text-sm" data-xml-note>{note}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input || converting} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{converting ? 'Converting…' : 'Convert'}</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="XML to JSON"
        description={"XML to JSON checks pasted XML and converts it with the fast-xml-parser library. Each element becomes a key; repeated sibling elements become an array; attributes become keys prefixed with @_; text that shares an element with attributes or children goes under #text. Every value stays a string exactly as written, so leading zeros and trailing decimals survive. The XML declaration is dropped. Malformed XML is reported with the parser's message, which gives the position for a mismatched closing tag, instead of a partial result. fast-xml-parser does the parsing inside your browser tab."}
        example={{"caption":"Two person elements with an id attribute and phone numbers starting with 0, and the JSON the tool returns:","inputLabel":"XML","input":"<?xml version=\"1.0\"?>\n<contacts>\n  <person id=\"1\"><name>Ann</name><phone>0612345678</phone></person>\n  <person id=\"2\"><name>Bo</name><phone>0698765432</phone></person>\n</contacts>","outputLabel":"JSON","output":"{\n  \"contacts\": {\n    \"person\": [\n      {\n        \"name\": \"Ann\",\n        \"phone\": \"0612345678\",\n        \"@_id\": \"1\"\n      },\n      {\n        \"name\": \"Bo\",\n        \"phone\": \"0698765432\",\n        \"@_id\": \"2\"\n      }\n    ]\n  }\n}"}}
        howToTitle="How to convert XML to JSON"
        howTo={[
          "Paste XML into \"XML Input\".",
          "Click \"Convert\"; the button reads \"Converting…\" while the parser loads.",
          "Read the JSON in \"JSON Output\", with a note if some elements mix text and tags.",
          "Click \"Copy\", or \"Download\" to keep the JSON as data.json.",
        ]}
        specs={[
          { label: "Input", value: "XML text" },
          { label: "Output", value: "indented JSON in data.json" },
          { label: "Attributes", value: "keys prefixed with @_" },
          { label: "Values", value: "always strings, never turned into numbers" },
        ]}
        privacy={"fast-xml-parser is downloaded into the page when you first click \"Convert\" and does all the work in your browser; your XML is not uploaded. A validation error or any other failure is reported to us as text, quoted names and values masked, with the tool name and your browser name and version."}
        faqs={[
          { q: "Are XML attributes kept?", a: "Yes. Each attribute becomes a key prefixed with @_ on the element's object, next to its children, so a person element with id 1 gets @_id holding the string 1." },
          { q: "Are numbers converted to JSON numbers?", a: "No. Every value stays text exactly as written, so the phone number 0612345678 keeps its zero and a version 1.10 is not shortened. Convert the values you need in your own code." },
          { q: "Is text mixed with tags kept in place?", a: "No. In <p>Hello <b>world</b> again</p>, the text parts are joined under #text without their position among the tags, and the page shows a note naming such elements. The tool suits data files better than documents." },
          { q: "Will invalid XML be detected?", a: "Yes. The XML is validated first; a mismatched tag gives a message such as Expected closing tag 'b' (opened in line 1, col 4) instead of closing tag 'a'." },
        ]}
        tips={[
          "To write JSON as XML, with @_ keys turned into attributes, use JSON to XML.",
        ]}
      />
    </div>
  );
}