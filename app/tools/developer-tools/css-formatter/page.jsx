'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { beautify, minifyCss } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function CssFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = async () => {
    try { setOutput(await beautify(input, 'css')); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  const minify = async () => {
    try { setOutput(await minifyCss(input)); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSS Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Beautify or minify CSS</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.css" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"CSS Formatter"}
        description={"CSS Formatter has two buttons for one stylesheet. Format runs js-beautify, the engine of beautifier.io: one declaration per line, 2-space indentation, at most one blank line kept between rules, and comments and url(data:…) values left intact. Minify runs CSSO: comments (except /*! license comments) and whitespace go, identical rules are merged (a and button with the same declarations become a,button), colors and zero values are shortened. js-beautify and CSSO both run in your browser. Neither one validates: invalid CSS is formatted as it is, and Minify can silently drop what it cannot parse."}
        example={{
          caption: "Minify: two rules with the same declarations are merged and #ff0000 becomes red.",
          inputLabel: "Input",
          input: "a{color:#ff0000;margin:0px 0px}\nbutton{color:#ff0000;margin:0px 0px}\n/* end */",
          outputLabel: "Output",
          output: "a,button{color:red;margin:0}",
        }}
        howToTitle={"How to format or minify CSS"}
        howTo={[
          "Paste a stylesheet into \"Input\".",
          "Click \"Format\" for indented CSS, or \"Minify\" for the compact version.",
          "Compare \"Output\" with your original before replacing it.",
          "Click \"Copy\", or \"Download\"; the file is named \"formatted.css\" after either button.",
        ]}
        specs={[
          { label: "Input", value: "CSS text, at-rules such as @media included" },
          { label: "Format", value: "js-beautify: 2-space indentation, at most one blank line in a row" },
          { label: "Minify", value: "CSSO: merges identical rules, shortens colors and zeros, removes whitespace and comments (not /*! ones)" },
          { label: "Validation", value: "None: syntax errors are not reported" },
        ]}
        privacyTitle={"Where your CSS is processed"}
        privacy={"Both engines are JavaScript libraries that your browser downloads on the first click; the CSS you paste is processed on your device and is not uploaded. Should an error be displayed, its text is sent to our error log with the tool name and your browser's name and version, after quoted passages, long numbers and addresses are removed."}
        faqs={[
          { q: "Can minifying break my CSS?", a: "No, for valid CSS: CSSO only applies changes that give the same result, such as merging identical rules. Invalid CSS is another matter, because CSSO may drop the part it cannot read without a warning, so check the output." },
          { q: "Does Format change my values?", a: "No. Format only changes whitespace: line breaks, 2-space indentation and the space after each colon. Strings, comments and url(data:…) values are kept character for character." },
          { q: "What does Minify remove?", a: "Comments other than /*! license comments, line breaks, spaces, the last semicolon of each rule and units on zero values; it also turns #ff0000 into red and joins rules that share the same declarations, as in the example above." },
        ]}
        tips={[
          "Format a minified third-party stylesheet first to find the rule you need, then edit your own source.",
          "For SCSS or LESS, use Code Formatter, which formats both with Prettier.",
        ]}
      />
    </div>
  );
}