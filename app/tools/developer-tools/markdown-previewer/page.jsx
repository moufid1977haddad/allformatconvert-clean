'use client';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import SeoContent from '../../../components/SeoContent';

export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing **markdown** here...');
  // CommonMark + GitHub Flavored Markdown (marked), then DOMPurify: tables,
  // links, images, code blocks and nested lists render; raw HTML is allowed
  // but scripts and event handlers are stripped. The previous renderer knew
  // six patterns (29/09).
  const [html, setHtml] = useState('');
  useEffect(() => {
    let alive = true;
    import('dompurify').then(({ default: DOMPurify }) => {
      if (alive) setHtml(DOMPurify.sanitize(marked.parse(markdown, { gfm: true, async: false })));
    });
    return () => { alive = false; };
  }, [markdown]);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown Previewer</h1>
        <p className="text-neutral-500 text-center mb-8">Write and preview Markdown in real time</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Preview</label><div className="w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 text-sm" dangerouslySetInnerHTML={{__html: html}} /></div>
        </div>
      </div>
      <SeoContent
        title="Markdown Previewer"
        description={"Markdown Previewer renders Markdown live as you type with marked, a CommonMark and GitHub Flavored Markdown parser, entirely in your browser: headings, emphasis, links, images, block quotes, ordered and nested lists, task lists, tables, fenced code blocks, strikethrough and horizontal rules. HTML written inside the Markdown is rendered too, after DOMPurify removes anything that could run code (scripts, event handlers, javascript: links). There's no copy, export, or share feature; this is a live preview only."}
        howTo={[
          "Paste or type Markdown into the left text area.",
          "Watch the formatted preview update instantly on the right.",
          "Use any standard Markdown: # headings, **bold**, *italic*, [links](url), tables, ``` code blocks, - lists.",
          "Select and copy text directly from the panes if you need to reuse it elsewhere."
        ]}
        faqs={[
          { q: "Is Markdown Previewer free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What Markdown syntax does it support?", a: "CommonMark plus GitHub Flavored Markdown: headings, bold, italic, strikethrough, links, images, block quotes, ordered, bullet, nested and task lists, tables, inline code, fenced code blocks and horizontal rules." },
          { q: "Can I export or share my preview?", a: "No — there's no copy, export, or share-link feature on this page. Select and copy text manually if you need it elsewhere." },
          { q: "Is my markdown uploaded to a server?", a: "No, rendering happens entirely in your browser." }
        ]}
        tips={[
          "HTML inside your Markdown is rendered, but scripts and event handlers are removed before display.",
          "To keep your work, copy it elsewhere: this page has no export."
        ]}
      />
    </div>
  );
}