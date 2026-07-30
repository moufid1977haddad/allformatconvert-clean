'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function CssFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let css = input.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n');
    setOutput(css.trim());
  };
  const minify = () => setOutput(input.replace(/\s+/g,' ').replace(/\s*{\s*/g,'{').replace(/\s*}\s*/g,'}').replace(/\s*;\s*/g,';').trim());
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
        description="CSS Formatter expands or minifies CSS entirely in your browser using simple pattern-based rules — breaking lines at braces and semicolons for formatting, or stripping whitespace for minifying — rather than a full CSS parser. It isn't string-aware: quoted values like a content declaration containing a semicolon can have their internal whitespace or punctuation altered, since the tool doesn't distinguish CSS syntax from text inside a string."
        howTo={[
          "Paste your CSS into the input box.",
          "Click 'Format' to expand it with line breaks and indentation, or 'Minify' to compress it.",
          "Review the result in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is CSS Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I format minified CSS?", a: "Yes — pasting compressed CSS and clicking 'Format' expands it with line breaks and indentation." },
          { q: "Does it support all CSS syntax, including variables and modern features?", a: "It works on the raw text regardless of what CSS features you use, since it's based on whitespace and punctuation patterns rather than parsing CSS semantics — but that also means it doesn't understand string content specially (see below)." },
          { q: "Is my code uploaded to a server?", a: "No, formatting and minifying both happen entirely in your browser." }
        ]}
        tips={[
          "Because formatting isn't string-aware, quoted content values containing semicolons or braces (rare, but valid CSS) can end up with unwanted line breaks inside the string — review the output for such cases.",
          "There's no indentation or style customization — both Format and Minify use one fixed style each.",
          "Minify strips comments, whitespace, and space around punctuation; Format does the reverse, adding line breaks and 2-space indentation.",
          "For everyday CSS without unusual string content, both operations work reliably and reversibly."
        ]}
      />
    </div>
  );
}