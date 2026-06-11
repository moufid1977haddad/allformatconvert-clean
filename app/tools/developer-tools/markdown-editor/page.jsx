'use client';
import { useState } from 'react';
export default function MarkdownEditorPage() {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart writing **markdown** here...\n\n- Item 1\n- Item 2\n- Item 3');
  const toHtml = (md) => md.replace(/^### (.*$)/gm,'<h3>$1</h3>').replace(/^## (.*$)/gm,'<h2>$1</h2>').replace(/^# (.*$)/gm,'<h1>$1</h1>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/^- (.*$)/gm,'<li>$1</li>').replace(/(<li>.*<\/li>)/gs,'<ul>$1</ul>').replace(/\n/g,'<br>');
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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Markdown Editor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Markdown Editor is a free online tool that allows you to write, edit, and preview Markdown text in real-time without installing any software. Perfect for bloggers, developers, and content creators, this lightweight editor helps you format your text efficiently and convert it to HTML instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Markdown Editor</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Markdown Editor website and you'll see a split-screen interface with the editor on the left and preview on the right</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Type or paste your Markdown content into the text area on the left side of the editor</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Watch your formatted text appear instantly in the preview pane on the right as you type</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy your rendered HTML output or download your Markdown file when you're finished editing</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Markdown Editor really free?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Markdown Editor is completely free to use with no registration, hidden fees, or premium tiers required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install anything to use Markdown Editor?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Markdown Editor is a web-based tool that runs entirely in your browser, so no installation or downloads are necessary.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I save my Markdown files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can download your Markdown files directly to your computer or copy the HTML output to use elsewhere.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What Markdown syntax does this editor support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Markdown Editor supports standard Markdown syntax including headings, bold, italic, lists, links, images, code blocks, and tables.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use keyboard shortcuts like Ctrl+B for bold and Ctrl+I for italic to speed up your writing workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview your Markdown in real-time by keeping both the editor and preview panes visible simultaneously</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the HTML output directly to your blog, website, or content management system for quick publishing</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the editor for taking quick notes, creating documentation, or drafting social media posts with consistent formatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}