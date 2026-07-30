'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Escape raw HTML first so pasted/typed markup (e.g. <img onerror=...>) renders
// as visible text instead of being injected live via dangerouslySetInnerHTML.
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing **markdown** here...');
  const toHtml = (md) => escapeHtml(md).replace(/^### (.*)/gm,'<h3>$1</h3>').replace(/^## (.*)/gm,'<h2>$1</h2>').replace(/^# (.*)/gm,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/^- (.*)/gm,'<li>$1</li>').replace(/\n/g,'<br>');
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown Previewer</h1>
        <p className="text-neutral-500 text-center mb-8">Write and preview Markdown in real time</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Preview</label><div className="w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 text-sm" dangerouslySetInnerHTML={{__html: toHtml(markdown)}} /></div>
        </div>
      </div>
      <SeoContent
        title="Markdown Previewer"
        description="Markdown Previewer renders a small subset of Markdown live as you type — headings (#, ##, ###), bold (**text**), italic (*text*), and simple list items (- item) — entirely in your browser. Raw HTML you type is escaped and shown as literal text rather than rendered, so it can't be used to style the preview or inject content. There's no copy, export, or share feature; this is a live preview only."
        howTo={[
          "Paste or type Markdown into the left text area.",
          "Watch the formatted preview update instantly on the right.",
          "Use #, ##, or ### for headings, **text** for bold, *text* for italic, and - item for list items.",
          "Select and copy text directly from the panes if you need to reuse it elsewhere."
        ]}
        faqs={[
          { q: "Is Markdown Previewer free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What Markdown syntax does it support?", a: "Only headings, bold, italic, and simple list items. Links, images, code blocks, tables, and blockquotes aren't supported." },
          { q: "Can I export or share my preview?", a: "No — there's no copy, export, or share-link feature on this page. Select and copy text manually if you need it elsewhere." },
          { q: "Is my markdown uploaded to a server?", a: "No, rendering happens entirely in your browser." }
        ]}
        tips={[
          "Stick to headings, bold, italic, and list items — other Markdown syntax will show up as plain text rather than being formatted.",
          "List items render without a surrounding list container, so their exact appearance may differ slightly from a full Markdown renderer.",
          "Typed or pasted HTML is shown as literal text rather than rendered, so raw HTML tags won't style your content here.",
          "For links, tables, code blocks, or exporting your work, use a full-featured Markdown editor instead."
        ]}
      />
    </div>
  );
}