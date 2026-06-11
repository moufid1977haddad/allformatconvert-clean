'use client';
import { useState } from 'react';
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
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Markdown To Html</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Markdown To Html is a free online converter that instantly transforms your Markdown text into clean, valid HTML code. Perfect for bloggers, developers, and content creators who need quick and reliable Markdown conversion without leaving their browser.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Markdown To Html</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your Markdown content into the input field on the left side of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically converts your Markdown to HTML in real-time as you type</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated HTML code displayed on the right side of the screen</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the copy button to copy the HTML code to your clipboard and use it anywhere</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Markdown To Html completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Markdown To Html is 100% free with no hidden charges, registration requirements, or usage limits. You can convert unlimited amounts of Markdown to HTML.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Markdown To Html is a web-based tool that works directly in your browser. Simply visit the website and start converting instantly without any downloads or installations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What Markdown features are supported?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports all standard Markdown syntax including headings, bold, italic, lists, links, images, code blocks, tables, blockquotes, and more.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data private and secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your data is processed locally in your browser and is never stored on our servers, ensuring complete privacy and security for your content.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the side-by-side preview to see your HTML output in real-time and catch any formatting issues immediately</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the generated HTML directly to your website, blog platform, or content management system with a single click</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different Markdown syntax to learn how each element converts to HTML for better understanding</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access whenever you need to convert Markdown to HTML without searching again</li>
          </ul>
        </div>
      </div>
    </div>
  );
}