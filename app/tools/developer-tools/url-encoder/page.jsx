'use client';
import { useState } from 'react';
export default function UrlEncoderDevPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => { try { setOutput(encodeURIComponent(input)); } catch(e) { setOutput('Error'); } };
  const decode = () => { try { setOutput(decodeURIComponent(input)); } catch(e) { setOutput('Invalid URL encoding'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode URLs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste URL here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Url Encoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">URL Encoder is a free online tool that converts special characters and spaces in URLs into percent-encoded format, making them safe for web transmission. This essential utility ensures your URLs are properly formatted and compatible with all web browsers and servers.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Url Encoder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your URL into the input field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Encode' button to instantly convert special characters to URL-safe format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Copy the encoded URL from the output field using the copy button</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Use the encoded URL in your web applications, emails, or API requests</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is URL encoding and why do I need it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">URL encoding converts special characters into a format that can be transmitted over the internet safely. Spaces become %20, and other special characters are replaced with their ASCII values preceded by a percent sign.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is URL Encoder safe to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, URL Encoder is completely safe. The tool runs entirely in your browser, so your URLs are never sent to any server. All encoding happens locally on your device.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I decode URLs with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">This tool is specifically designed for encoding URLs. To decode URLs, you would need a URL decoder tool that performs the reverse operation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What characters does URL Encoder convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool encodes spaces, punctuation marks, and special characters like !, @, #, $, %, &, and others that have special meaning in URLs.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always encode URLs before using them in query parameters to avoid breaking your links with special characters</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use URL encoding when sharing URLs in emails or documents to ensure they remain clickable and functional</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep the encoded URL format when integrating URLs into API calls or webhook configurations</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for quick access whenever you need to encode multiple URLs for your web projects</li>
          </ul>
        </div>
      </div>
    </div>
  );
}