'use client';
import { useState } from 'react';

export default function UrlEncoderPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const encode = () => setResult(encodeURIComponent(text));
  const decode = () => {
    try {
      setResult(decodeURIComponent(text));
    } catch(e) {
      setResult('Invalid URL encoding');
    }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">URL Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode URLs</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your URL or text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!text} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Url Encoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">URL Encoder is a free online tool that converts special characters and spaces in URLs into percent-encoded format, making them safe for web transmission and use in links. This essential utility ensures your URLs are properly formatted and compatible across all browsers and platforms.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Url Encoder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your URL or text into the input field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Encode' button to instantly convert special characters to percent-encoded format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Copy the encoded URL from the output field using the copy button</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Use the encoded URL in your applications, APIs, or web links</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is URL encoding and why do I need it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">URL encoding converts special characters into a format that can be safely transmitted over the internet. Characters like spaces, ampersands, and slashes are replaced with percent signs followed by hexadecimal values, ensuring URLs work correctly in all contexts.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is this tool free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, URL Encoder is completely free to use with no registration required. You can encode unlimited URLs without any restrictions or hidden fees.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I decode URLs as well?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Many URL encoding tools, including this one, offer both encoding and decoding functionality. You can use the decode option to convert percent-encoded URLs back to their readable format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What characters get encoded?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Special characters including spaces, accented letters, symbols, and reserved characters like &, ?, #, and / are encoded. Letters, numbers, hyphens, underscores, periods, and tildes typically remain unchanged.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use URL encoding when passing parameters in query strings to ensure special characters don't break your links</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always encode URLs before using them in APIs or database queries to prevent injection vulnerabilities</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your encoded URLs in a browser to confirm they redirect to the correct destination</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep the original unencoded URL saved separately for reference and easy editing before re-encoding</li>
          </ul>
        </div>
      </div>
    </div>
  );
}