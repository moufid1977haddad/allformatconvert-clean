'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { minifyJs } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function JsMinifierPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const minify = async () => {
    try { setOutput(await minifyJs(input)); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JS Minifier</h1>
        <p className="text-neutral-500 text-center mb-8">Minify JavaScript code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JavaScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Minified Output</label><TextArea aria-label="Minified Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="minified.js" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
          {output && <p className="text-neutral-500 text-sm text-center">Saved {input.length - output.length} characters</p>}
        </div>
      </div>
      <SeoContent
        title={"JS Minifier"}
        description={"JS Minifier compresses JavaScript with Terser in your browser. Terser parses the code first, so the result behaves like the original: code written without semicolons, a return followed by a line break, regular expressions and expressions such as a - -b are handled. Names local to functions are shortened, global names and object properties are kept, unreachable code such as an if (false) block is removed, and every comment is dropped. Modern syntax is accepted, including classes, async functions, optional chaining and BigInt, and so are import and export lines. TypeScript is not: convert it first."}
        example={{
          caption: "No semicolons in the input; Terser adds them, puts everything on one line and renames the locals.",
          inputLabel: "Input",
          input: "function total(prices) {\n  let sum = 0\n  for (const price of prices) sum += price\n  return sum\n}\nconsole.log(total([1, 2]))",
          outputLabel: "Minified Output",
          output: "function total(o){let t=0;for(const l of o)t+=l;return t}console.log(total([1,2]));",
        }}
        howToTitle={"How to minify JavaScript"}
        howTo={[
          "Paste your script into \"Input\".",
          "Click \"Minify\".",
          "Read \"Minified Output\" and the characters-saved line; if the code does not parse, Error: and Terser's message appear instead.",
          "Click \"Copy\", or \"Download\" to keep \"minified.js\".",
        ]}
        specs={[
          { label: "Input", value: "JavaScript, scripts or ES modules" },
          { label: "Output", value: "Minified JavaScript on one line, saved as minified.js" },
          { label: "Settings", value: "Compress and mangle on, comments off, top-level names kept" },
          { label: "Errors", value: "Terser's message, without line or column" },
        ]}
        privacyTitle={"Where your script is processed"}
        privacy={"Terser is downloaded once, on your first click on \"Minify\", and then works on your device: the script is not uploaded. A failed minification is the exception, since the error message shown, with quoted strings, long numbers and addresses replaced, is reported to our error log with the tool's name and your browser's name and version; an unexpected failure of the page is reported the same way."}
        faqs={[
          { q: "Will minified code behave the same?", a: "Yes. Terser only applies transformations that keep the behaviour of code it could parse, including code written without semicolons; a return followed by a line break still returns nothing, as in the original." },
          { q: "Does it rename variables?", a: "Yes, but only local ones: variables and parameters inside functions get one-letter names, as total(prices) becoming total(o) in the example. Top-level names and object properties are kept, so other scripts can still call them." },
          { q: "Can it minify TypeScript?", a: "No. Type annotations are a syntax error for Terser. Use Code Minifier in TS mode, which removes the types and minifies in one step, or run TypeScript to JavaScript first and paste its output here." },
          { q: "Does it show where a syntax error is?", a: "No. Only Terser's message is shown, for example Name expected, without its line and column. Paste the code into Code Formatter to see the position of the first syntax error." },
        ]}
      />
    </div>
  );
}