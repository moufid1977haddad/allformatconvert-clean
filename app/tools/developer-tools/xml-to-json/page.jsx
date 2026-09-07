'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function XmlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
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
      });
      const parsed = parser.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
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
            <div><label className="block text-sm text-neutral-500 mb-1">XML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input || converting} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{converting ? 'Converting…' : 'Convert'}</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="XML to JSON"
        description="XML to JSON converts XML into JSON using the fast-xml-parser library, entirely in your browser — nothing is uploaded to a server. Malformed XML is correctly detected and reported as invalid. Repeated sibling elements become a JSON array automatically, element text content is stored under a '#text' key when it shares a node with attributes or other children, and — unlike a plain DOM-based conversion — XML attributes are preserved, each appearing as a JSON key prefixed with '@_' (e.g. id='5' becomes '@_id': '5')."
        howTo={[
          "Paste your XML into the input box.",
          "Click 'Convert' to parse it into JSON.",
          "Review the output — attributes appear as '@_'-prefixed keys alongside each element's other content.",
          "Click 'Copy' to copy the JSON result."
        ]}
        faqs={[
          { q: "Is XML to JSON free to use?", a: "Yes, completely free with no registration required." },
          { q: "Will invalid XML be detected?", a: "Yes — malformed XML is validated and reported as 'Invalid XML', with the underlying parser error when available." },
          { q: "Are XML attributes included in the JSON output?", a: "Yes — every attribute is preserved as a JSON key prefixed with '@_', for example id=\"5\" becomes \"@_id\": \"5\" on that same element's object." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser using the fast-xml-parser library, loaded on demand when you click Convert." }
        ]}
        tips={[
          "Attributes show up as '@_'-prefixed keys (e.g. '@_id') on the same object as that element's children or text.",
          "Repeated sibling elements with the same tag name are automatically grouped into a JSON array.",
          "Element text content appears under a '#text' key when the element also has attributes or child elements.",
          "Copy the result right after conversion, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}