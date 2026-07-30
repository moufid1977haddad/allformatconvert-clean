'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function XmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const format = () => {
    try {
      let indent = 0;
      const formatted = input.replace(/></g,'>\n<').split('\n').map(line => {
        if (line.match(/^<\//)) indent = Math.max(0, indent-1);
        const result = '  '.repeat(indent) + line.trim();
        if (line.match(/^<[^/!?][^>]*[^/]>$/)) indent++;
        return result;
      }).join('\n');
      setOutput(formatted);
      setError('');
    } catch(e) { setError('Error formatting XML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify XML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="XML Formatter"
        description="XML Formatter re-indents XML using line-based text processing, not a real XML parser, entirely in your browser — nothing is uploaded to a server. It correctly handles the XML declaration, comments, and self-closing tags without breaking indentation, but since it's text-based rather than a true parser, it doesn't validate whether the XML is well-formed, and any '><' pairs inside a CDATA section or comment will be split onto separate lines too, which can alter the content of that section."
        howTo={[
          "Paste your XML into the input box.",
          "Click 'Format' to re-indent it based on nesting depth.",
          "Review the output for proper structure.",
          "Click 'Copy' to copy the formatted XML."
        ]}
        faqs={[
          { q: "Is XML Formatter free to use?", a: "Yes, completely free with no registration required." },
          { q: "Does it validate whether my XML is well-formed?", a: "No — it's a text-based indenter, not a real XML parser, so it won't catch structural errors like unclosed or mismatched tags." },
          { q: "Does it handle the XML declaration (<?xml version=\"1.0\"?>) correctly?", a: "Yes — the declaration line is left alone and doesn't affect the indentation of the elements that follow it." },
          { q: "Is my XML uploaded to a server?", a: "No, formatting happens entirely in your browser." }
        ]}
        tips={[
          "For strict validation of whether your XML is well-formed, use a dedicated XML validator, not this formatter.",
          "Avoid formatting XML with CDATA sections or comments containing '><' sequences, since those can get split across lines.",
          "Indentation uses a fixed 2-space step per nesting level and isn't configurable.",
          "Copy the result right after formatting, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}