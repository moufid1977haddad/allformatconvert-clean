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
        description={"Code Minifier shrinks four kinds of code in your browser, chosen with the JS, TS, CSS and HTML buttons. JavaScript goes through Terser, which renames local variables and drops dead code; TypeScript is first stripped of its types by Sucrase, then minified the same way, so the result is JavaScript. CSS goes through CSSO, which merges identical rules and shortens values. HTML loses its comments, each run of whitespace becomes one space, and the contents of <pre>, <textarea>, <script> and <style> stay as written. Only JavaScript and TypeScript are parsed strictly: broken CSS or HTML is not reported."}
        example={{
          caption: "HTML mode: the comment goes, spaces shrink to one, <pre> keeps its spacing.",
          inputLabel: "Input",
          input: "<ul>\n  <!-- main menu -->\n  <li><a href=\"/\">Home</a></li>\n  <li>   About   us </li>\n</ul>\n<pre>  keep   this</pre>",
          outputLabel: "Output",
          output: "<ul> <li><a href=\"/\">Home</a></li> <li> About us </li> </ul> <pre>  keep   this</pre>",
        }}
        howToTitle={"How to minify JavaScript, CSS or HTML"}
        howTo={[
          "Click \"JS\", \"TS\", \"CSS\" or \"HTML\" to choose the language.",
          "Paste the code into \"Input\".",
          "Click \"Minify\"; the result fills \"Output\" and the line below it gives the characters saved.",
          "Click \"Copy\", or \"Download\" to save minified.js, minified.ts, minified.css or minified.html, depending on the mode.",
        ]}
        specs={[
          { label: "Input languages", value: "JavaScript, TypeScript without JSX, CSS, HTML" },
          { label: "Engines", value: "Terser (JavaScript and TypeScript), Sucrase (TypeScript types), CSSO (CSS), the site's own minifier (HTML)" },
          { label: "Errors", value: "JavaScript and TypeScript syntax errors are shown as Error: plus the engine's message; CSS and HTML are never rejected" },
          { label: "File name", value: "minified plus the mode: .js, .css or .html; in TS mode the file is named .ts although it holds JavaScript" },
        ]}
        privacyTitle={"Where your code is processed"}
        privacy={"All four minifiers run on your device; Terser, Sucrase or CSSO is downloaded the first time its mode is used, and the code you paste is not uploaded. If a JavaScript or TypeScript error is displayed, its message, cleaned of quoted text, long numbers and addresses, is reported to our error log together with the tool name and your browser's name and version."}
        faqs={[
          { q: "Will minified JavaScript behave the same?", a: "Yes. Terser parses the code before compressing it, so code without semicolons, a return followed by a line break and expressions like a - -b keep their meaning. Code that does not parse gets an error instead of a broken file." },
          { q: "Does TS mode handle TSX or namespaces?", a: "No. TS mode strips types without JSX support, so TSX fails with a syntax error, and a namespace is removed with everything inside it. Move namespace code out first, and minify TSX in your own build." },
          { q: "Does HTML mode delete all spaces between tags?", a: "No. A space between inline elements can be visible: two bold words separated only by a line break would run together without it. So each run of spaces and line breaks becomes one space instead of disappearing." },
          { q: "Does CSS mode check my CSS?", a: "No. CSSO repairs or skips what it cannot read without a message: a missing closing brace is added, and text that is not CSS can disappear from the output. Check the result of a stylesheet you are unsure about." },
        ]}
        tips={[
          "The characters-saved line also appears after an error, so trust it only when the output is real code.",
        ]}
      />
    </div>
  );
}