'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function MarkdownToHtmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let html = input.replace(/^### (.*)/gm,'<h3>$1</h3>').replace(/^## (.*)/gm,'<h2>$1</h2>').replace(/^# (.*)/gm,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/^- (.*)/gm,'<li>$1</li>').replace(/\n/g,'<br>');
    setOutput('<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body>\n' + html + '\n</body>\n</html>');
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown to HTML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Markdown to HTML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste Markdown here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">HTML Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="Markdown to HTML"
        description="Markdown to HTML converts a small subset of Markdown — headings (#, ##, ###), bold (**text**), italic (*text*), and simple list items (- item) — into a complete HTML document, entirely in your browser. Unlike this site's Markdown Editor and Previewer, the output here is displayed as HTML source text in a read-only box, not rendered live, so there's no injection risk from pasted content."
        howTo={[
          "Paste or type your Markdown into the input box.",
          "Click 'Convert' to generate a full HTML document as text.",
          "Review the generated HTML in the output box.",
          "Click 'Copy' to copy it to your clipboard."
        ]}
        faqs={[
          { q: "Is Markdown to HTML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What Markdown syntax does it support?", a: "Only headings, bold, italic, and simple list items. Links, images, code blocks, tables, and blockquotes aren't supported." },
          { q: "Does it convert in real time as I type?", a: "No — you need to click 'Convert' each time; output doesn't update automatically." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ]}
        tips={[
          "Stick to headings, bold, italic, and list items — other Markdown syntax passes through as plain text rather than being converted.",
          "The output is a complete, standalone HTML document (with doctype, head, and body), ready to save as an .html file.",
          "List items aren't wrapped in a <ul> or <ol> container, so you may want to add that manually for fully valid HTML.",
          "Click 'Convert' again after editing your Markdown, since the output doesn't refresh automatically."
        ]}
      />
    </div>
  );
}