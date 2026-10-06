'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { scssToCss } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function ScssToCssPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [style, setStyle] = useState('expanded');
  const convert = async () => {
    try { setOutput(await scssToCss(input, { style })); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SCSS to CSS</h1>
        <p className="text-neutral-500 text-center mb-8">Compile SCSS to CSS with Dart Sass</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SCSS Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SCSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSS Output</label><TextArea aria-label="CSS Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"SCSS to CSS compiles SCSS with Dart Sass, the reference Sass compiler, inside your browser. Variables, nesting with &, mixins, functions, @extend, @if, @each and @for, maps and the built-in modules loaded with @use, such as sass:math or sass:color, all work. Choose expanded CSS to read or compressed CSS to ship. A Sass error, such as an undefined variable, replaces the output with Sass's own message, which shows the line and column. Only the pasted code is compiled: imports of other files fail, and the indented .sass syntax is not accepted."}
        example={{
          caption: "Expanded output; math.div comes from the sass:math module.",
          inputLabel: "SCSS Input",
          input: "@use \"sass:math\";\n$gap: 12px;\n.card {\n  padding: math.div($gap, 2);\n  .title { font-weight: 600; }\n  &:hover { padding: $gap; }\n}",
          outputLabel: "CSS Output",
          output: ".card {\n  padding: 6px;\n}\n.card .title {\n  font-weight: 600;\n}\n.card:hover {\n  padding: 12px;\n}",
        }}
        howToTitle={"How to compile SCSS to CSS"}
        howTo={[
          "Paste your SCSS into \"SCSS Input\".",
          "Pick \"Expanded\" for readable CSS or \"Compressed\" for a single line.",
          "Click \"Convert\"; the CSS, or Sass's error message, appears in \"CSS Output\".",
          "Click \"Copy\", or \"Download\" to save \"styles.css\".",
        ]}
        specs={[
          { label: "Input", value: "SCSS syntax as text (not the indented SASS syntax)" },
          { label: "Output", value: "CSS, expanded or compressed, saved as styles.css" },
          { label: "Compiler", value: "Dart Sass, sass package 1.105.0" },
          { label: "Modules", value: "Built-in ones only (sass:math, sass:color…); @import or @use of your own files stops with Can't find stylesheet to import" },
        ]}
        privacyTitle={"Where your code is processed"}
        privacy={"Dart Sass, compiled to JavaScript, runs in your browser once you click \"Convert\", so the stylesheet you paste stays on your device. Error reports are the exception: when compilation fails, Sass's error message is sent, trimmed, to our error log with the tool name and your browser's name and version, and that message can quote the line of SCSS where the error is. An unexpected failure of the page is also reported, with the same details."}
        faqs={[
          { q: "Is it a real Sass compiler?", a: "Yes. It runs Dart Sass, the implementation maintained by the Sass team, compiled to JavaScript, so variables, mixins, @extend, control flow and built-in modules behave as in the sass command-line tool." },
          { q: "Can I use @import or @use with my own partials?", a: "No. Only the pasted code exists here, so importing a partial stops with Can't find stylesheet to import. Built-in modules such as sass:math do load. Paste the content of your partials above your code instead." },
          { q: "Does it accept the indented .sass syntax?", a: "No. The compiler is called with SCSS syntax only, so code written without braces and semicolons is reported as an error. Convert indented Sass to SCSS before pasting it." },
        ]}
        tips={[
          "Errors point to line:column in your input: fix the SCSS there and click \"Convert\" again.",
          "Use Compressed for files you deploy and Expanded when you want to review the generated selectors.",
        ]}
      />
    </div>
  );
}