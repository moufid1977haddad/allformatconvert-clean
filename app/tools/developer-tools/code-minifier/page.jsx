'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { minifyJs, minifyCss, typescriptToJs } from '../../../lib/codeTools';
import { minify as minifyHtmlDoc } from '../../../lib/htmlMinify';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function CodeMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('js');
  const minify = async () => {
    try {
      let result;
      if (lang === 'js') result = await minifyJs(input);
      else if (lang === 'ts') result = await minifyJs(await typescriptToJs(input));
      else if (lang === 'css') result = await minifyCss(input);
      else result = minifyHtmlDoc(input);
      setOutput(result);
    } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JS, CSS, HTML and TypeScript</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['js','ts','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name={'minified.' + lang} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
      <SeoContent
        title={"Code Minifier"}
        description={"Code Minifier compresses JavaScript, TypeScript, CSS and HTML entirely in your browser. JavaScript is minified by Terser (the engine behind webpack and Vite), so code without semicolons, return statements and regular expressions keep exactly their behaviour; TypeScript has its types removed first and is then minified the same way; CSS is minified by CSSO, which keeps strings and data: URLs intact; HTML loses comments and the whitespace between tags, while <pre>, <textarea>, <script> and <style> contents are left untouched. Code that doesn't parse is reported instead of producing a broken file."}
        howTo={[
          "Choose the language: JS, TS, CSS or HTML.",
          "Paste your code into the input box.",
          "Click 'Minify'.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "Is Code Minifier free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Will minified JavaScript behave the same?", a: "Yes — Terser parses the code before compressing it, so automatic semicolon insertion and every operator keep their meaning." },
          { q: "What does TypeScript minification produce?", a: "JavaScript: the type annotations are removed (as the TypeScript compiler does), then the code is minified." },
          { q: "Is my code uploaded?", a: "No — everything runs in your browser; each engine is downloaded once when you first use it." }
        ]}
        tips={[
          "Keep your original source: minified code is meant for production, not for editing.",
          "In HTML mode, inline scripts and styles are kept as they are; minify them separately in JS or CSS mode if needed."
        ]}
      />
    </div>
  );
}