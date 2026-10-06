'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { beautify } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function HtmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = async () => {
    try { setOutput(await beautify(input, 'html')); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.html" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"HTML Formatter"}
        description={"HTML Formatter re-indents a page or a fragment with js-beautify, the engine behind beautifier.io, in your browser. Nested elements get 2 spaces per level, and the content of <head> and <body> is indented too. Inline <script> and <style> blocks are formatted as JavaScript and CSS. Void elements such as <br> and <img> do not open a level, attributes are kept as written, and the content of <pre> and <textarea> is left exactly as typed, because whitespace there is visible. Long lines are not wrapped. It does not validate HTML: unclosed tags are formatted without a warning."}
        example={{
          caption: "A one-line snippet: the <pre> content keeps its spaces, the script is formatted.",
          inputLabel: "Input",
          input: "<div><p>Hello <b>world</b></p><pre>  a\n   b</pre><script>if(x){go()}</script></div>",
          outputLabel: "Output",
          output: "<div>\n  <p>Hello <b>world</b></p>\n  <pre>  a\n   b</pre>\n  <script>\n    if (x) {\n      go()\n    }\n  </script>\n</div>",
        }}
        howToTitle={"How to format HTML code"}
        howTo={[
          "Paste HTML, a full document or a snippet, into \"Input\".",
          "Click \"Format\".",
          "Review the indented markup in \"Output\".",
          "Click \"Copy\" or \"Download\" (\"formatted.html\").",
        ]}
        specs={[
          { label: "Input", value: "HTML document or fragment, as text" },
          { label: "Output", value: "Indented HTML, saved as formatted.html" },
          { label: "Indentation", value: "2 spaces per level; blank lines kept, at most one in a row; no line wrapping" },
          { label: "Left untouched", value: "Content of <pre> and <textarea>, attribute values" },
        ]}
        privacyTitle={"Where your HTML is processed"}
        privacy={"js-beautify is loaded into the page when you first click \"Format\" and works on your device, so your markup is not uploaded. If the page displays an error message, our error log receives that message, after quoted passages, long numbers and addresses have been stripped from it, plus the tool's name and your browser's name and version."}
        faqs={[
          { q: "Can formatting change how my page looks?", a: "No, in most pages. Inline elements such as <b> stay on their line, and text in <pre> and <textarea>, where every space shows, is copied as typed. Line breaks are added between block elements like <div> and <p>, where they are not rendered." },
          { q: "Does it format embedded CSS and JavaScript?", a: "Yes. Code inside <style> is formatted with the CSS rules and code inside <script> with the JavaScript rules, both indented one level deeper than their tag, as in the example above." },
          { q: "Does it fix broken HTML?", a: "No. It indents what you give it without checking it: a missing closing tag is not added and no error is shown, so the indentation after it may look off. That shift can help you spot the problem." },
        ]}
        tips={[
          "To shrink HTML instead of expanding it, use Code Minifier in HTML mode.",
        ]}
      />
    </div>
  );
}