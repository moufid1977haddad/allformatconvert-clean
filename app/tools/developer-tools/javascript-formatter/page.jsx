'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { beautify, minifyJs } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function JavascriptFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = async () => {
    try { setOutput(await beautify(input, 'js')); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  const minify = async () => {
    try { setOutput(await minifyJs(input)); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JavaScript Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.js" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JavaScript Formatter"}
        description={"JavaScript Formatter beautifies JavaScript with js-beautify, the engine of beautifier.io, and minifies it with Terser, entirely in your browser. Formatting only changes indentation and line breaks (2 spaces, blank lines kept, at most two in a row). Minifying parses the code first, so code written without semicolons, return statements followed by a line break, regular expressions and template literals keep exactly their behaviour; a syntax error is reported instead of producing broken output."}
        howTo={[
          "Paste your JavaScript into the input box.",
          "Click 'Format' for readable, indented code, or 'Minify' for the smallest equivalent code.",
          "Review the result.",
          "Click 'Copy' to copy it."
        ]}
        faqs={[
          { q: "Is JavaScript Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does formatting change what my code does?", a: "No — it only changes whitespace and line breaks; strings, template literals, comments and regular expressions are kept as written." },
          { q: "Is minified code safe to use?", a: "Yes — Terser keeps the behaviour of the code, including automatic semicolon insertion, which simple whitespace-stripping minifiers get wrong." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "Format minified code from a website to read it; minify your own code before publishing.",
          "A syntax error in minify mode shows its position in the output box."
        ]}
      />
    </div>
  );
}