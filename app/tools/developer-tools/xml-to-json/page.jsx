'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function XmlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(input, 'text/xml');
      if (xml.querySelector('parsererror')) throw new Error('Invalid XML');
      const xmlToObj = (node) => {
        if (node.nodeType === 3) return node.nodeValue.trim();
        const obj = {};
        for (const child of node.childNodes) {
          const val = xmlToObj(child);
          if (val === '') continue;
          if (obj[child.nodeName]) {
            if (!Array.isArray(obj[child.nodeName])) obj[child.nodeName] = [obj[child.nodeName]];
            obj[child.nodeName].push(val);
          } else obj[child.nodeName] = val;
        }
        return obj;
      };
      setOutput(JSON.stringify(xmlToObj(xml.documentElement), null, 2));
      setError('');
    } catch(e) { setError('Invalid XML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert XML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">XML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="XML to JSON"
        description="XML to JSON converts XML into JSON using the browser's built-in XML parser (DOMParser), entirely in your browser — nothing is uploaded to a server. Malformed XML is correctly detected and reported as invalid. Repeated sibling elements become a JSON array automatically, and text content is stored under a '#text' key — but XML attributes are not captured at all; only element names and text content make it into the JSON output."
        howTo={[
          "Paste your XML into the input box.",
          "Click 'Convert' to parse it into JSON.",
          "Review the output, keeping in mind that attributes are dropped.",
          "Click 'Copy' to copy the JSON result."
        ]}
        faqs={[
          { q: "Is XML to JSON free to use?", a: "Yes, completely free with no registration required." },
          { q: "Will invalid XML be detected?", a: "Yes — malformed XML is parsed with the browser's real XML parser and reported as 'Invalid XML'." },
          { q: "Are XML attributes included in the JSON output?", a: "No — only element names and text content are converted; attributes (like id=\"5\") are silently dropped." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser using the native DOMParser." }
        ]}
        tips={[
          "If your XML relies on attributes for important data, that data won't appear in the JSON output — restructure it as child elements first if you need it preserved.",
          "Repeated sibling elements with the same tag name are automatically grouped into a JSON array.",
          "Element text content appears under a '#text' key in the resulting object.",
          "Copy the result right after conversion, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}