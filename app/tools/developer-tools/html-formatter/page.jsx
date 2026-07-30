'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function HtmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let indent = 0;
    const lines = input.replace(/></g,'>\n<').split('\n');
    const formatted = lines.map(line => {
      if (line.match(/^<\//)) indent--;
      const result = '  '.repeat(Math.max(0,indent)) + line.trim();
      if (line.match(/^<[^/][^>]*[^/]>/) && !line.match(/^<(br|hr|img|input|link|meta)/i)) indent++;
      return result;
    });
    setOutput(formatted.join('\n'));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="HTML Formatter"
        description="HTML Formatter adds line breaks and indentation to HTML entirely in your browser using simple pattern-based rules — splitting on adjacent tags and tracking nesting depth — rather than a full HTML parser. It recognizes common self-closing tags (br, hr, img, input, link, meta) so they don't affect indentation depth, but it doesn't validate your markup or offer indentation customization."
        howTo={[
          "Paste your HTML into the input box.",
          "Click 'Format' to add line breaks and indent nested tags.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is HTML Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will it validate my HTML or flag errors?", a: "No — it only reformats indentation and line breaks; it doesn't check for invalid or malformed markup." },
          { q: "Can I customize indentation size or style?", a: "No, indentation is always 2 spaces per nesting level — there's no option to change it." },
          { q: "Is my code uploaded to a server?", a: "No, formatting happens entirely in your browser." }
        ]}
        tips={[
          "Works well for typical, well-formed HTML with standard tags; unusual or deeply nested markup may not indent perfectly since it's pattern-based, not a full parser.",
          "Self-closing tags like br, hr, img, input, link, and meta are recognized and won't throw off indentation — other void elements (like source or wbr) aren't specifically handled.",
          "Text content isn't specially protected, so a stray > < sequence inside text (rare, but possible) could affect line breaks.",
          "Copy the result right away, since there's no file download or save feature."
        ]}
      />
    </div>
  );
}