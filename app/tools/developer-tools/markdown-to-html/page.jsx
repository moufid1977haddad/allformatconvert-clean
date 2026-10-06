'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { markdownToHtml } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = async () => {
    try {
      const html = await markdownToHtml(input);
      setOutput('<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body>\n' + html + '</body>\n</html>');
    } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown to HTML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Markdown to HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste Markdown here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">HTML Output</label><TextArea aria-label="HTML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="document.html" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"Markdown to HTML"}
        description={"Markdown to HTML turns Markdown into a ready-to-save HTML5 file. The text is parsed by marked with GitHub Flavored Markdown on, and the result is placed inside a doctype, an html element, a head that declares UTF-8 and a body. Code blocks keep their language as a class (language-js) and characters such as < inside code are escaped. Raw HTML in your Markdown is copied through unchanged, scripts included, because nothing is sanitized here. The document has no title, styles or lang attribute; add them if you publish it. This page shows the code, not a rendered preview."}
        example={{
          caption: "Output of the page’s own conversion code for a heading, inline code and a fenced JavaScript block.",
          inputLabel: "Markdown",
          input: "# Notes\n\nUse `a < b` in **code**.\n\n```js\nif (a < b) run();\n```",
          outputLabel: "HTML Output",
          output: "<!DOCTYPE html>\n<html>\n<head><meta charset=\"utf-8\"></head>\n<body>\n<h1>Notes</h1>\n<p>Use <code>a &lt; b</code> in <strong>code</strong>.</p>\n<pre><code class=\"language-js\">if (a &lt; b) run();\n</code></pre>\n</body>\n</html>",
        }}
        howToTitle={"How to convert Markdown to an HTML file"}
        howTo={[
          "Paste your Markdown in the \"Markdown\" box.",
          "Click \"Convert\", which becomes available once the box is not empty.",
          "Check the code in \"HTML Output\", then click \"Copy\" or use \"Download\" to save it as document.html.",
        ]}
        specs={[
          { label: "Input", value: "Markdown text, read with CommonMark and GitHub Flavored Markdown rules" },
          { label: "Output", value: "One HTML document: doctype, a head declaring UTF-8 encoding, and body; no title, styles or lang attribute" },
          { label: "Raw HTML", value: "Passed through as written, not sanitized" },
          { label: "Download", value: "document.html" },
        ]}
        privacyTitle={"Where your Markdown is converted"}
        privacy={"Conversion runs in your browser: the marked library is downloaded the first time you click Convert, and your Markdown and the resulting HTML are never sent to our servers. If an error is shown in the output box, its cleaned message is sent to our error log with the tool’s name and your browser’s name and version, quoted text and URLs removed, so that we can fix the problem."}
        faqs={[
          { q: "Does the output include a full HTML page?", a: "Yes. The HTML is wrapped in a doctype, an html element, a head declaring the UTF-8 encoding and a body, so accented letters display correctly when the file is opened. A title and styles are not added." },
          { q: "Is raw HTML in my Markdown kept?", a: "Yes, exactly as written: this converter does not sanitize, so a script element or an onclick attribute in your Markdown ends up in the file. Remove anything you do not trust before publishing; Markdown Previewer shows a cleaned version." },
          { q: "Are code blocks syntax-highlighted?", a: "No. A fenced block marked js becomes a pre and code element with the class language-js, ready for a highlighter such as Prism or highlight.js, but no colors are added here." },
          { q: "Can I convert a .md file directly?", a: "No, there is no file upload. Open the .md file in a text editor, copy its content and paste it in the Markdown box; the result can then be saved with the Download button." },
        ]}
        tips={[
          "To read the result as a page rather than as code, paste the same Markdown into Markdown Previewer.",
        ]}
      />
    </div>
  );
}