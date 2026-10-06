'use client';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import SeoContent from '../../../components/SeoContent';
import { DownloadGroup, TextDownload } from '../../../components/FileDownload';
import TextArea from '@/app/components/TextArea';

export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing **markdown** here...\n\n- Item 1\n- Item 2\n- Item 3');
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
        <h1 className="text-3xl font-bold text-center mb-2">Markdown Editor</h1>
        <p className="text-neutral-500 text-center mb-8">Write and preview Markdown in real time</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><TextArea aria-label="Markdown" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Preview</label><div className="w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 prose prose-sm" dangerouslySetInnerHTML={{__html: html}} /></div>
        </div>
        <DownloadGroup zipName="document.zip" alternatives className="mt-4">
          <TextDownload text={markdown} name="document.md" type="text/markdown;charset=utf-8" />
          <TextDownload text={html} name="document.html" type="text/html;charset=utf-8" />
        </DownloadGroup>
      </div>
      <SeoContent
        title="Markdown Editor"
        description={"Markdown Editor is a two-pane writing page: you type Markdown on the left and the preview on the right is rebuilt after each change. The text is parsed with marked, which follows CommonMark and GitHub Flavored Markdown, so tables, task lists, fenced code and strikethrough work. HTML typed inside the Markdown is kept after DOMPurify strips scripts, event handlers and javascript: links. When the draft is ready, save it as document.md, save the generated HTML as document.html (the body content, without a head section), or take both in one ZIP. There is no formatting toolbar and no autosave."}
        example={{
          caption: "A task list and a table typed in the left pane; below is the HTML that marked produces with the page’s settings (the page then passes it through DOMPurify).",
          inputLabel: "Markdown",
          input: "## Tasks\n\n- [x] Draft\n- [ ] Review\n\n| Step | Owner |\n|---|---|\n| Draft | Ana |",
          outputLabel: "HTML (document.html)",
          output: "<h2>Tasks</h2>\n<ul>\n<li><input checked=\"\" disabled=\"\" type=\"checkbox\"> Draft</li>\n<li><input disabled=\"\" type=\"checkbox\"> Review</li>\n</ul>\n<table>\n<thead>\n<tr>\n<th>Step</th>\n<th>Owner</th>\n</tr>\n</thead>\n<tbody><tr>\n<td>Draft</td>\n<td>Ana</td>\n</tr>\n</tbody></table>",
        }}
        howToTitle={"How to write Markdown and download it"}
        howTo={[
          "Replace the sample text in the \"Markdown\" pane with your own writing.",
          "Check the \"Preview\" pane on the right; it is rebuilt after each change.",
          "Click \"Download\" on the document.md row to save your Markdown, or on the document.html row to save the generated HTML.",
          "Click \"Download all\" to get both files in document.zip.",
        ]}
        specs={[
          { label: "Syntax", value: "CommonMark plus GitHub Flavored Markdown: tables, task lists, strikethrough, fenced code" },
          { label: "HTML inside Markdown", value: "Allowed; DOMPurify removes scripts, event handlers and javascript: links" },
          { label: "Downloads", value: "document.md (your text), document.html (body content only, no head or charset tag), document.zip (both)" },
          { label: "Length", value: "The tool sets no size cap; past 1,000,000 characters the left box shows only the beginning while the preview uses the whole text" },
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Your Markdown is turned into HTML by code running in the page (marked, then DOMPurify) and is not sent to our servers or stored anywhere. Images you link to are loaded by your browser from the sites that host them, so those sites see the request. The downloads are built in the browser from your text."}
        faqs={[
          { q: "Is my draft saved if I close the tab?", a: "No. Nothing is stored, in your browser or on a server. Once you have changed the sample, the browser asks before you leave until you download one of the files or copy the whole text, so download document.md first." },
          { q: "Does the HTML download include styles?", a: "No. document.html holds only the HTML generated from your Markdown, without a head section, stylesheet or charset tag. For a complete page with a UTF-8 declaration, paste the same Markdown into Markdown to HTML." },
          { q: "Can I use HTML tags inside the Markdown?", a: "Yes. Tags such as details or kbd are kept in the preview and in document.html, but DOMPurify first removes script elements, attributes such as onclick and javascript: links." },
          { q: "Does it support tables and task lists?", a: "Yes. GitHub Flavored Markdown is on, so pipe tables, - [ ] task lists (shown as disabled checkboxes), ~~strikethrough~~ and fenced code blocks with a language name are converted." },
        ]}
        tips={[
          "Need a PDF of the finished document? Paste the same Markdown into Markdown to PDF.",
        ]}
      />
    </div>
  );
}