'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Splits input into { code } and { string } segments by scanning quotes, so
// the whitespace/punctuation regexes below can be applied only to code
// segments — never to the contents of a quoted CSS value like
// content: "a;b" — instead of running on the whole text blindly. Same
// helper as css-formatter (this page is standalone, so it's copied rather
// than imported).
function splitCssSegments(input) {
  const segments = [];
  let i = 0;
  const n = input.length;
  let buf = '';
  while (i < n) {
    const c = input[i];
    if (c === '"' || c === "'") {
      if (buf) { segments.push({ code: buf }); buf = ''; }
      const quote = c;
      let str = c;
      i++;
      while (i < n) {
        if (input[i] === '\\') { str += input[i] + (input[i + 1] || ''); i += 2; continue; }
        if (input[i] === quote) { str += input[i]; i++; break; }
        str += input[i]; i++;
      }
      segments.push({ string: str });
      continue;
    }
    buf += c;
    i++;
  }
  if (buf) segments.push({ code: buf });
  return segments;
}

// Splits adjacent tags ('><') onto separate lines like a plain
// `replace(/></g, '>\n<')` would, but tracks whether the scan is inside a
// tag and inside a quoted attribute value, so a '>' or '<' appearing inside
// a quoted attribute (e.g. placeholder="a><b") is never mistaken for a real
// tag boundary. Same helper as html-formatter (copied for the same reason).
function splitTags(input) {
  let out = '';
  let insideTag = false;
  let quote = null;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    out += c;
    if (!insideTag) {
      if (c === '<') insideTag = true;
      continue;
    }
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '>') {
      insideTag = false;
      if (input[i + 1] === '<') out += '\n';
    }
  }
  return out;
}

export default function CodeFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('json');
  const format = () => {
    try {
      let result = input;
      if (lang === 'json') {
        result = JSON.stringify(JSON.parse(input), null, 2);
      } else if (lang === 'css') {
        result = splitCssSegments(input)
          .map(seg => seg.string !== undefined
            ? seg.string
            : seg.code.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n'))
          .join('')
          .trim();
      } else if (lang === 'html') {
        let i = 0;
        result = splitTags(input).split('\n').map(l => {
          if (l.match(/^<\//)) i = Math.max(0,i-1);
          const r = '  '.repeat(i) + l.trim();
          if (l.match(/^<[^/][^>]*>$/) && !l.match(/\//)) i++;
          return r;
        }).join('\n');
      }
      setOutput(result);
    } catch(e) { setOutput('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['json','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="Code Formatter"
        description="Code Formatter reformats JSON, CSS, or HTML entirely in your browser. JSON is parsed and re-serialized with 2-space indentation (invalid JSON shows a clear error), while CSS and HTML use simple pattern-based rules to add line breaks and indentation rather than a full parser. Only these three languages are supported — JavaScript, Python, Java, and others aren't available."
        howTo={[
          "Choose JSON, CSS, or HTML from the language buttons.",
          "Paste your code into the input box.",
          "Click 'Format' to reformat it.",
          "Click 'Copy' to copy the formatted result."
        ]}
        faqs={[
          { q: "What languages does Code Formatter support?", a: "Only JSON, CSS, and HTML — there's no JavaScript, Python, Java, C++, PHP, or SQL formatting." },
          { q: "Is Code Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it store my code?", a: "No, formatting happens entirely in your browser; nothing is uploaded to a server." },
          { q: "Can I customize indentation, bracket style, or other formatting rules?", a: "No — each language uses one fixed formatting style with no customization options." }
        ]}
        tips={[
          "JSON formatting uses a real parser, so invalid JSON shows a clear error instead of a best-effort guess.",
          "CSS and HTML formatting use simple pattern-based rules rather than a full parser, so unusual or deeply nested code may not indent perfectly — always review the result.",
          "There's no auto-detect language or dark mode toggle — pick the language manually each time.",
          "Copy the result right away, since there's no file download or save feature."
        ]}
      />
    </div>
  );
}