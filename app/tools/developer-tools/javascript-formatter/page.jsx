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
        <p className="text-neutral-500 text-center mb-8">Beautify or minify JavaScript code</p>
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
        description={"JavaScript Formatter does two opposite jobs on the same code. Format uses js-beautify: 2-space indentation, one statement per line, spaces around operators, at most one blank line kept in a row, and strings, template literals, regular expressions and comments left as written. Minify uses Terser, the same engine as JS Minifier: it parses the code, shortens local names and removes dead code and comments. Format never complains about invalid code; Minify stops and shows Terser's message, without a line number. js-beautify and Terser both work on your code inside the browser tab."}
        example={{
          caption: "Format: a one-line function laid out with 2-space indentation.",
          inputLabel: "Input",
          input: "function f(a,b){if(a){return b}else{return 0}}var x=f(1,2);",
          outputLabel: "Output",
          output: "function f(a, b) {\n  if (a) {\n    return b\n  } else {\n    return 0\n  }\n}\nvar x = f(1, 2);",
        }}
        howToTitle={"How to beautify or minify JavaScript"}
        howTo={[
          "Paste JavaScript into \"Input\".",
          "Click \"Format\" to make it readable, or \"Minify\" to make it small.",
          "Read \"Output\"; after Minify, an error shows there as Error: followed by Terser's message.",
          "Click \"Copy\", or \"Download\" to save \"formatted.js\" (the name stays the same after Minify).",
        ]}
        specs={[
          { label: "Input", value: "JavaScript, scripts or modules, as text" },
          { label: "Format", value: "js-beautify: 2-space indent, spaces around operators, at most one blank line in a row" },
          { label: "Minify", value: "Terser: compress and mangle, comments removed" },
          { label: "Errors", value: "Format reports none; Minify shows Terser's message without line or column" },
        ]}
        privacyTitle={"Where your code is processed"}
        privacy={"The formatter and the minifier are JavaScript libraries loaded into this page on first use; they read your code inside the browser, and your code is not uploaded. When a Minify error appears, its message is sent to our error log with quoted text, long numbers and addresses replaced, along with the tool name and the name and version of your browser."}
        faqs={[
          { q: "Does formatting change what my code does?", a: "No. Format only changes whitespace: indentation, line breaks and spaces around operators and keywords. Strings, template literals, regular expressions and comments are kept exactly as written." },
          { q: "Is minified code safe to use?", a: "Yes, when Terser accepts it: it parses the code first, so automatic semicolon insertion and expressions such as a - -b keep their meaning. Global names stay; only names local to a function are shortened." },
          { q: "Does the Minify error give a line number?", a: "No. The page shows only Terser's message, such as Name expected, and not the position Terser keeps separately. To locate the error, paste the code into Code Formatter, which reports syntax errors with line and column." },
        ]}
        tips={[
          "Format minified code from a website to read it; keep your own readable source and minify a copy for deployment.",
        ]}
      />
    </div>
  );
}