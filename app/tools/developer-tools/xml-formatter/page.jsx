'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Splits adjacent tags ('><') onto separate lines like a plain
// `replace(/></g, '>\n<')` would, but scans <!--...--> comments and
// <![CDATA[...]]> sections as opaque blocks — copied through untouched,
// with no line break inserted inside them — and tracks quoted attribute
// values within a tag. So a '><' sequence that's actually literal content
// inside CDATA, a comment, or an attribute value is never mistaken for a
// real tag boundary and split apart.
function splitXmlTags(input) {
  let out = '';
  let i = 0;
  const n = input.length;

  const closeAndMaybeBreak = (end) => {
    out += input.slice(i, end);
    i = end;
    if (i < n && input[i] === '<') out += '\n';
  };

  while (i < n) {
    if (input[i] !== '<') {
      out += input[i];
      i++;
      continue;
    }

    if (input.startsWith('<![CDATA[', i)) {
      const close = input.indexOf(']]>', i + 9);
      closeAndMaybeBreak(close === -1 ? n : close + 3);
      continue;
    }

    if (input.startsWith('<!--', i)) {
      const close = input.indexOf('-->', i + 4);
      closeAndMaybeBreak(close === -1 ? n : close + 3);
      continue;
    }

    // A regular tag (opening, closing, declaration, or processing
    // instruction): scan to its own unquoted '>' so a quoted attribute
    // value can contain '<', '>', or '><' without being mistaken for a tag
    // boundary.
    let j = i + 1;
    let quote = null;
    while (j < n) {
      const ch = input[j];
      if (quote) {
        if (ch === quote) quote = null;
        j++;
        continue;
      }
      if (ch === '"' || ch === "'") { quote = ch; j++; continue; }
      if (ch === '>') { j++; break; }
      j++;
    }
    closeAndMaybeBreak(j);
  }

  return out;
}

export default function XmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const format = () => {
    try {
      let indent = 0;
      const formatted = splitXmlTags(input).split('\n').map(line => {
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
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="XML Formatter"
        description="XML Formatter re-indents XML using line-based text processing, not a real XML parser, entirely in your browser — nothing is uploaded to a server. It correctly handles the XML declaration and self-closing tags without breaking indentation, and it's scanner-based rather than a plain-text regex: <![CDATA[...]]> sections, <!--...--> comments, and quoted attribute values are recognized as opaque and copied through untouched, so a '><' sequence inside any of them is never mistaken for a real tag boundary. It still doesn't validate whether the XML is well-formed, since it's a text-based indenter, not a true parser."
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
          "CDATA sections, XML comments, and quoted attribute values are scanned as protected content, so a '><' sequence inside any of them won't get split across lines.",
          "Indentation uses a fixed 2-space step per nesting level and isn't configurable.",
          "Copy the result right after formatting, since there's no download button or saved history."
        ]}
      />
    </div>
  );
}