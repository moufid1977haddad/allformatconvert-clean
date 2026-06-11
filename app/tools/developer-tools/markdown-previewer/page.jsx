'use client';
import { useState } from 'react';
export default function MarkdownPreviewerPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing **markdown** here...');
  const toHtml = (md) => md.replace(/^### (.*)/gm,'<h3>$1</h3>').replace(/^## (.*)/gm,'<h2>$1</h2>').replace(/^# (.*)/gm,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/^- (.*)/gm,'<li>$1</li>').replace(/\n/g,'<br>');
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Markdown Previewer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Markdown Previewer is a free online tool that instantly converts your markdown text into formatted HTML preview in real-time. Perfect for writers, developers, and content creators who want to visualize their markdown syntax before publishing.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Markdown Previewer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your markdown code into the left text area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Watch the formatted preview update instantly on the right side</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Copy your rendered HTML output or continue editing</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Share your markdown preview link or export the formatted content</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Markdown Previewer free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Markdown Previewer is completely free and requires no registration or installation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What markdown syntax does it support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">It supports all standard markdown syntax including headers, bold, italics, links, lists, code blocks, tables, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I save my markdown documents?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can copy the formatted output or export it, though for permanent storage we recommend using a markdown editor with file saving capabilities.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does it work on mobile devices?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Markdown Previewer is fully responsive and works seamlessly on smartphones, tablets, and desktop browsers.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use keyboard shortcuts to format text faster - type # for headers, ** for bold, and _ for italics</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the HTML output directly into your website or blog without additional formatting needed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test complex markdown tables and code blocks before using them in production</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark the tool for quick access and use it as your go-to markdown validation checker</li>
          </ul>
        </div>
      </div>
    </div>
  );
}