'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { markdownToHtml } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';

export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = async () => {
    try {
      const html = await markdownToHtml(input);
      setOutput('<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body>\n' + html + '</body>\n</html>');
    } catch (e) { setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown to HTML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Markdown to HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste Markdown here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">HTML Output</label><textarea aria-label="HTML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"Markdown to HTML converts Markdown into a complete HTML document with marked, a CommonMark and GitHub Flavored Markdown parser, entirely in your browser. Headings, paragraphs, emphasis, links, images, block quotes, ordered and nested lists, fenced code blocks (with their language class), inline code, tables, strikethrough and horizontal rules are all converted, and < > & in code are escaped."}
        howTo={[
          "Paste your Markdown into the input box.",
          "Click 'Convert'.",
          "Review the HTML output.",
          "Click 'Copy' to copy it."
        ]}
        faqs={[
          { q: "Is Markdown to HTML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which Markdown syntax is supported?", a: "CommonMark plus GitHub Flavored Markdown: tables, fenced code blocks, strikethrough, autolinks and task lists." },
          { q: "Does it produce a full HTML page?", a: "Yes — the output is wrapped in a minimal HTML5 document with UTF-8 encoding, ready to save as .html." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "To preview the rendered result instead of the code, use the Markdown Previewer.",
          "Raw HTML written inside your Markdown is passed through as is."
        ]}
      />
    </div>
  );
}