'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
  const [error, setError] = useToolError('');
  const format = async () => {
    try {
      // Invalid XML used to be "formatted" anyway, hiding the error (29/09):
      // validate first, as codebeautify and freeformatter do.
      const { XMLValidator } = await import('fast-xml-parser');
      const check = XMLValidator.validate(input.replace(/^\uFEFF/, ''));
      if (check !== true) {
        setOutput('');
        setError(`Invalid XML (line ${check.err.line}, column ${check.err.col}): ${check.err.msg}`);
        return;
      }
      let indent = 0;
      const formatted = splitXmlTags(input).split('\n').map(line => {
        if (line.match(/^<\//)) indent = Math.max(0, indent-1);
        const result = '  '.repeat(indent) + line.trim();
        // P24 review (03/10): one-letter tags (<a>, <b>, <p>) did not open a level while their closing tag removed one
        const t = line.trim();
        if (/^<[^/!?][^>]*>$/.test(t) && !t.endsWith('/>')) indent++;
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
        <p className="text-neutral-500 text-center mb-8">Check that XML is well-formed, then indent it</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.xml" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="XML Formatter"
        description={"XML Formatter first checks your XML with the validator of fast-xml-parser. If a tag is unclosed or mismatched, it shows Invalid XML with the line and column and produces nothing. Valid XML is then re-indented by 2 spaces per level: a line break is added only between a closing > and the next <, never inside CDATA sections, comments or quoted attribute values, and the XML declaration does not shift the indentation. It does not check a DTD or XSD schema, and the indentation cannot be changed. Validation and indentation both happen in your browser."}
        example={{
          caption: "A one-line catalog with a declaration and a self-closing tag.",
          inputLabel: "Input",
          input: "<?xml version=\"1.0\"?><catalog><book id=\"b1\"><title>XML Basics</title><tags/></book></catalog>",
          outputLabel: "Output",
          output: "<?xml version=\"1.0\"?>\n<catalog>\n  <book id=\"b1\">\n    <title>XML Basics</title>\n    <tags/>\n  </book>\n</catalog>",
        }}
        howToTitle={"How to format and validate XML"}
        howTo={[
          "Paste XML into \"Input\".",
          "Click \"Format\".",
          "If a red Invalid XML line appears, fix the tag at the line and column it gives and click \"Format\" again.",
          "Click \"Copy\", or \"Download\" to save \"formatted.xml\".",
        ]}
        specs={[
          { label: "Input", value: "XML text; the XML declaration and a DOCTYPE are accepted" },
          { label: "Output", value: "XML indented by 2 spaces per level, saved as formatted.xml" },
          { label: "Check", value: "Well-formedness only (tags, nesting, characters); several root elements pass; no DTD or XSD validation" },
          { label: "Known limits", value: "A start tag written over several lines, or an attribute value containing >, shifts the indentation of what follows; lines inside a multi-line CDATA section or comment are re-indented" },
        ]}
        privacyTitle={"Where your XML is processed"}
        privacy={"Validation and indentation both run in this page: fast-xml-parser is downloaded on your first click on \"Format\" and reads the XML on your device, which is not uploaded. An Invalid XML or Error formatting XML message shown on screen is reported to our error log, with quoted tag names, long numbers and addresses removed, plus the tool name and your browser's name and version."}
        faqs={[
          { q: "Does it check whether my XML is well-formed?", a: "Yes. Before formatting, the validator looks for unclosed or crossed tags, bad attribute syntax and text before the root element (text after it passes), and reports the first problem with its line and column. It does not compare the XML with a DTD or an XSD schema." },
          { q: "Can I change the indentation?", a: "No. Each nesting level is indented by 2 spaces and there is no setting to change it. Elements that hold only text, such as a title, stay on one line with their closing tag." },
          { q: "Are CDATA sections and comments kept?", a: "Yes, their content is never split and no line break is added inside them. One change remains: when a CDATA section or comment spans several lines, each of those lines loses its leading spaces and takes the current indentation." },
          { q: "Can a multi-line start tag break the indentation?", a: "Yes. When a start tag spans several lines, or one of its attribute values contains a > character, the formatter misses the opening level but still counts the closing tag. Put the tag on one line, or write > as &gt;, and format again." },
        ]}
      />
    </div>
  );
}