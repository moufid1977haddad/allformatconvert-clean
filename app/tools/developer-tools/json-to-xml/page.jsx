'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JsonToXmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const toXml = (obj, root = 'root') => {
        if (typeof obj !== 'object') return `<${root}>${obj}</${root}>`;
        const inner = Object.entries(obj).map(([k,v]) => toXml(v, k)).join('');
        return `<${root}>${inner}</${root}>`;
      };
      setOutput('<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(obj));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to XML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to XML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">XML Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to XML"
        description="JSON to XML recursively converts JSON into nested XML tags — each key becomes a tag name, with objects nesting naturally — entirely in your browser. Two real gaps to know about: text values are inserted directly without XML-escaping, so a value containing an ampersand or a less-than sign produces invalid XML, and array items become numbered tags like <0> and <1>, which aren't valid XML tag names."
        howTo={[
          "Paste your JSON into the input box.",
          "Click 'Convert' to generate nested XML tags.",
          "Review the output, especially for arrays or text containing & or <.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Is JSON to XML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it handle nested JSON objects?", a: "Yes — unlike some of our other JSON code-generator tools, this one recursively converts nested objects into properly nested XML tags at any depth." },
          { q: "Does it escape special characters like & and <?", a: "No — text values are inserted as-is, so a value containing an ampersand or a less-than sign produces invalid, non-well-formed XML. Replace those characters with &amp; and &lt; yourself, or avoid them in your data." },
          { q: "Does it convert JSON arrays correctly?", a: "No — array items become numbered tags like <0> and <1>, which are not valid XML tag names since tags can't start with a digit." }
        ]}
        tips={[
          "Manually replace & with &amp; and < with &lt; in any text values before converting, since the tool doesn't escape them automatically.",
          "Avoid JSON arrays in your input, or restructure them as objects with named keys, since array items don't convert to valid XML tags.",
          "Nested objects convert cleanly at any depth — this tool's main strength over some of the similar converters here.",
          "Validate the output with an XML parser before using it in a real system, especially if your data includes free-form text."
        ]}
      />
    </div>
  );
}