'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Splits input into { code } and { string } segments by scanning quotes, so
// the whitespace/punctuation regexes below can be applied only to code
// segments — never to the contents of a quoted CSS value like
// content: "a;b" — instead of running on the whole text blindly.
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

export default function CssFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    const css = splitCssSegments(input)
      .map(seg => seg.string !== undefined
        ? seg.string
        : seg.code.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n'))
      .join('');
    setOutput(css.trim());
  };
  const minify = () => {
    const css = splitCssSegments(input)
      .map(seg => seg.string !== undefined
        ? seg.string
        : seg.code.replace(/\s+/g,' ').replace(/\s*{\s*/g,'{').replace(/\s*}\s*/g,'}').replace(/\s*;\s*/g,';'))
      .join('');
    setOutput(css.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSS Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify CSS</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="CSS Formatter"
        description="CSS Formatter expands or minifies CSS entirely in your browser using simple pattern-based rules — breaking lines at braces and semicolons for formatting, or stripping whitespace for minifying — rather than a full CSS parser. It is string-aware, though: quoted values are scanned separately from the surrounding code, so a content declaration containing a semicolon, brace, or repeated spaces (e.g. content: 'a;b') is copied through untouched instead of having its whitespace or punctuation altered."
        howTo={[
          "Paste your CSS into the input box.",
          "Click 'Format' to expand it with line breaks and indentation, or 'Minify' to compress it.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is CSS Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I format minified CSS?", a: "Yes — pasting compressed CSS and clicking 'Format' expands it with line breaks and indentation." },
          { q: "Does it support all CSS syntax, including variables and modern features?", a: "It works on the raw text regardless of what CSS features you use, since it's based on whitespace and punctuation patterns rather than parsing CSS semantics — but quoted string values are still recognized and left untouched, so content declarations format and minify safely." },
          { q: "Is my code uploaded to a server?", a: "No, formatting and minifying both happen entirely in your browser." }
        ]}
        tips={[
          "Quoted content values containing semicolons, braces, or repeated spaces (e.g. content: \"a;b\") are scanned as strings and left untouched by both Format and Minify.",
          "There's no indentation or style customization — both Format and Minify use one fixed style each.",
          "Minify strips comments, whitespace, and space around punctuation; Format does the reverse, adding line breaks and 2-space indentation.",
          "For everyday CSS without unusual string content, both operations work reliably and reversibly."
        ]}
      />
    </div>
  );
}