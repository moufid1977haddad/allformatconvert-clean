'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { scssToCss } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';

export default function ScssToCssPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [style, setStyle] = useState('expanded');
  const convert = async () => {
    try { setOutput(await scssToCss(input, { style })); } catch (e) { setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SCSS to CSS</h1>
        <p className="text-neutral-500 text-center mb-8">Convert SCSS to CSS format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SCSS Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SCSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSS Output</label><textarea aria-label="CSS Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="styles.css" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={style} onChange={e => setStyle(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3" aria-label="Output style"><option value="expanded">Expanded</option><option value="compressed">Compressed</option></select>
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"SCSS to CSS"}
        description={"SCSS to CSS compiles SCSS with Dart Sass, the official Sass compiler, entirely in your browser. Everything Sass supports works: variables, nesting and the & parent selector, mixins with arguments, @extend, functions, control flow (@if, @each, @for), maps and built-in modules (sass:math, sass:color…). Output is expanded or compressed CSS; an undefined variable or a syntax error is reported with its line, as Sass reports it, instead of producing broken CSS."}
        howTo={[
          "Paste your SCSS into the input box.",
          "Choose expanded (readable) or compressed (minified) output.",
          "Click 'Convert'.",
          "Click 'Copy' to copy the CSS."
        ]}
        faqs={[
          { q: "Is SCSS to CSS free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Is it a real Sass compiler?", a: "Yes — it runs Dart Sass, the reference implementation maintained by the Sass team, compiled to JavaScript." },
          { q: "Does it support @use and @import of other files?", a: "Built-in modules (@use \"sass:math\") work; importing your own files isn't possible because only the pasted code is available." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "Use compressed output for production and expanded output to read the result.",
          "Errors show the line and column Sass reports — fix the SCSS and convert again."
        ]}
      />
    </div>
  );
}