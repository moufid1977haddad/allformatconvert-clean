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
        description={"HTML Formatter re-indents HTML with js-beautify, the engine of beautifier.io, entirely in your browser. It understands HTML structure: void elements such as <br>, <img> and <input> don't increase the indentation, attributes containing > are handled, and the contents of <pre> and <textarea> are left exactly as written (whitespace there is visible on the page). Inline <script> and <style> blocks are formatted as JavaScript and CSS."}
        howTo={[
          "Paste your HTML into the input box.",
          "Click 'Format'.",
          "Review the indented result.",
          "Click 'Copy' to copy it."
        ]}
        faqs={[
          { q: "Is HTML Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can formatting change how my page looks?", a: "Only where whitespace between inline elements matters; <pre> and <textarea> contents, where it always matters, are never touched." },
          { q: "Does it format embedded CSS and JavaScript?", a: "Yes — <style> and <script> blocks are formatted with the CSS and JavaScript rules." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "Paste minified HTML from a site to make it readable.",
          "For a full document or a fragment, the result keeps your tags and attributes exactly."
        ]}
      />
    </div>
  );
}