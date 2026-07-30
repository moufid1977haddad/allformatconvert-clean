'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
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
        result = input.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n').trim();
      } else if (lang === 'html') {
        let i = 0;
        result = input.replace(/></g,'>\n<').split('\n').map(l => {
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