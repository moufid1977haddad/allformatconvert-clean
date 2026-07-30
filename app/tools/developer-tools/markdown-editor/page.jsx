'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Escape raw HTML first so pasted/typed markup (e.g. <img onerror=...>) renders
// as visible text instead of being injected live via dangerouslySetInnerHTML.
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing **markdown** here...\n\n- Item 1\n- Item 2\n- Item 3');
  const toHtml = (md) => escapeHtml(md).replace(/^### (.*$)/gm,'<h3>$1</h3>').replace(/^## (.*$)/gm,'<h2>$1</h2>').replace(/^# (.*$)/gm,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/^- (.*$)/gm,'<li>$1</li>').replace(/(<li>.*<\/li>)/gs,'<ul>$1</ul>').replace(/\n/g,'<br>');
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Markdown Editor</h1>
        <p className="text-neutral-500 text-center mb-8">Write and preview Markdown in real time</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Preview</label><div className="w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 prose prose-sm" dangerouslySetInnerHTML={{__html: toHtml(markdown)}} /></div>
        </div>
      </div>
      <SeoContent
        title="Markdown Editor"
        description="Markdown Editor gives you a split-screen view that renders a small subset of Markdown live as you type — headings (#, ##, ###), bold (**text**), italic (*text*), and simple bullet lists (- item) — entirely in your browser. Raw HTML you type is escaped and shown as literal text rather than rendered, so it can't be used to style the preview or inject content. There's no copy or download button; this is a live preview only."
        howTo={[
          "Type or paste Markdown into the left-hand text area.",
          "Watch the rendered preview update instantly on the right as you type.",
          "Use #, ##, or ### for headings, **text** for bold, *text* for italic, and - item for a bullet list.",
          "Select and copy text directly from the preview or editor pane if you need to reuse it elsewhere."
        ]}
        faqs={[
          { q: "Is Markdown Editor free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I copy the rendered HTML or download my Markdown file?", a: "No — there's no copy or download button on this page; it's a live preview only. Select and copy text manually if needed." },
          { q: "What Markdown syntax does it support?", a: "Only headings, bold, italic, and simple bullet lists. Links, images, code blocks, tables, blockquotes, and numbered lists aren't supported." },
          { q: "Is my text uploaded to a server?", a: "No, rendering happens entirely in your browser." }
        ]}
        tips={[
          "Stick to headings, bold, italic, and bullet lists — other Markdown syntax (links, images, tables, code blocks) will show up as plain text rather than being formatted.",
          "Typed or pasted HTML is shown as literal text in the preview rather than rendered, so you can't use raw HTML tags to style your content here.",
          "For features like links, tables, or code blocks, use a full-featured Markdown editor instead.",
          "Since there's no save or download, copy anything important elsewhere before navigating away."
        ]}
      />
    </div>
  );
}