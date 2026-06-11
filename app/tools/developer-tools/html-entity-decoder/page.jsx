'use client';
import { useState } from 'react';
export default function HtmlEntityDecoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const decode = () => { const el = document.createElement('div'); el.innerHTML = input; setOutput(el.textContent || el.innerText || ''); };
  const encode = () => setOutput(input.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HTML Entity Decoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode HTML entities</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste HTML here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Html Entity Decoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">HTML Entity Decoder is a free online tool that converts HTML entities and special characters back into their readable text format. Simply paste your encoded HTML content and instantly decode entities like &amp;, &lt;, &quot;, and many others.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Html Entity Decoder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the HTML Entity Decoder tool on our website</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or type your HTML encoded text into the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Decode' button to convert entities to regular characters</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the decoded output and use it in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What are HTML entities?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">HTML entities are special codes used to represent characters that have special meaning in HTML, such as &amp; for ampersand (&), &lt; for less than (<), and &quot; for quotation marks.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why do I need to decode HTML entities?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Decoding HTML entities helps convert encoded text back to its readable format, making it easier to understand and work with the original content in your applications or documents.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is this tool free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the HTML Entity Decoder is completely free to use with no registration, login, or hidden fees required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does the tool store my data?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all decoding is done locally in your browser and we do not store or log any of your input data for privacy and security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access when you frequently work with HTML encoded content in your development workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the copy button to quickly transfer decoded content to your clipboard without manual selection</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test with common entities like &nbsp;, &copy;, and &euro; to familiarize yourself with the most frequently used HTML codes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine this tool with other SEO and development utilities for a complete content optimization and debugging toolkit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}