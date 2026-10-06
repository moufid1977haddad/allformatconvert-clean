'use client';
import { useState, useEffect } from 'react';
import { marked } from 'marked';
import SeoContent from '../../../components/SeoContent';
import { DownloadGroup, TextDownload } from '../../../components/FileDownload';
import TextArea from '@/app/components/TextArea';
import md from '@/app/components/markdownPreview.module.css';

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
        <p className="text-neutral-500 text-center mb-8">Paste Markdown and check the HTML it produces</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Markdown</label><TextArea aria-label="Markdown" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-96 resize-none font-mono" value={markdown} onChange={e => setMarkdown(e.target.value)} /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Preview</label><div className={`w-full bg-white rounded-xl p-4 h-96 overflow-y-auto text-neutral-900 ${md.preview}`} dangerouslySetInnerHTML={{__html: html}} /></div>
        </div>
        <DownloadGroup zipName="document.zip" alternatives className="mt-4">
          <TextDownload text={markdown} name="document.md" type="text/markdown;charset=utf-8" />
          <TextDownload text={html} name="document.html" type="text/html;charset=utf-8" />
        </DownloadGroup>
      </div>
      <SeoContent
        title="Markdown Previewer"
        description={"Markdown Previewer is for checking text you already have, such as a README, a pull-request description or notes copied from another app, before you publish it. Paste it on the left and the right pane shows the HTML that marked produces under CommonMark and GitHub Flavored Markdown rules: links, images, block quotes, nested lists, tables and code blocks. Raw HTML in the text is cleaned by DOMPurify, so a pasted script or onerror attribute cannot run. The source can be saved as document.md and the rendered HTML as document.html, or both in a ZIP. Markdown Editor has the same panes with a longer starter sample for writing from scratch."}
        example={{
          caption: "A link, a strikethrough and a quote pasted on the left; below is the HTML that marked produces with the page’s settings, before the DOMPurify step.",
          inputLabel: "Pasted Markdown",
          input: "See [the spec](https://spec.commonmark.org/) and ~~old~~ new.\n\n> Quoted line",
          outputLabel: "HTML in the preview",
          output: "<p>See <a href=\"https://spec.commonmark.org/\">the spec</a> and <del>old</del> new.</p>\n<blockquote>\n<p>Quoted line</p>\n</blockquote>",
        }}
        howToTitle={"How to preview Markdown before publishing it"}
        howTo={[
          "Select the sample in the \"Markdown\" pane and paste your own Markdown over it.",
          "Compare it with the \"Preview\" pane, where links, lists, tables and code blocks become HTML.",
          "Fix the source on the left; the preview follows each edit.",
          "Use \"Download\" on the document.html row to keep the rendered HTML, or \"Download all\" for the HTML and the Markdown together.",
        ]}
        specs={[
          { label: "Rules", value: "CommonMark and GitHub Flavored Markdown, as implemented by the marked library" },
          { label: "HTML cleaning", value: "DOMPurify: script elements, event-handler attributes and javascript: links are removed" },
          { label: "Files you can save", value: "document.md, document.html (body content only) and document.zip with both" },
          { label: "Pasted text size", value: "Pasted text over 1,000,000 characters is shown in part in the left box; the preview is built from all of it" },
        ]}
        privacyTitle={"Where your Markdown is rendered"}
        privacy={"Rendering happens in your browser: the pasted Markdown and its HTML never reach our servers and are not kept after you leave. Pictures referenced in the Markdown are fetched by your browser from their own addresses, which reveals your visit to those hosts. Each download is built from the text on your screen."}
        faqs={[
          { q: "Is pasted HTML safe to preview?", a: "Yes. Before it is shown, the HTML goes through DOMPurify, which drops script elements, attributes such as onerror and javascript: links, so pasted code cannot run in this page. The cleaned HTML is also what document.html contains." },
          { q: "Can I share a link to my preview?", a: "No. Nothing is uploaded, so there is no address to share. Download document.md or document.html and send the file, or paste the Markdown wherever it will be published." },
          { q: "Does it render math formulas or diagrams?", a: "No. marked converts standard and GitHub Flavored Markdown only: LaTeX between dollar signs stays plain text, and a mermaid block is shown as an ordinary code block." },
        ]}
        tips={[
          "Markdown to HTML wraps the same kind of output in a full HTML5 document that declares the UTF-8 encoding.",
        ]}
      />
    </div>
  );
}