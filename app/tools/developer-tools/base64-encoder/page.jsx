'use client';
import { useState } from 'react';
export default function Base64EncoderPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const encode = () => { try { setOutput(btoa(input)); } catch(e) { setOutput('Error encoding'); } };
  const decode = () => { try { setOutput(atob(input)); } catch(e) { setOutput('Invalid Base64'); } };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Base64 Encoder</h1>
        <p className="text-neutral-500 text-center mb-8">Encode and decode Base64</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste text here..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={encode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Encode</button>
            <button onClick={decode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Decode</button>
          </div>
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Base64 Encoder</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Base64 Encoder is a free online tool that converts text and binary data into Base64 encoding format, making it easy to transmit data safely across different systems and platforms. This efficient encoder instantly transforms your input into Base64 code without requiring any software installation or registration.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Base64 Encoder</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text or data into the input field on the Base64 Encoder tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Encode' button to instantly convert your content to Base64 format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>View the encoded output displayed in the results section</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the Base64 encoded text to your clipboard and use it wherever needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is Base64 encoding used for?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Base64 encoding is used to convert binary data into ASCII string format, making it safe to transmit across email, APIs, and web protocols that may not handle binary data properly.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Base64 Encoder tool secure?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the encoding process happens entirely in your browser without sending data to external servers, ensuring your information remains private and secure.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I encode large files with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool works best with text and moderate-sized data. For very large files, consider using command-line tools or dedicated software designed for bulk encoding.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How do I decode Base64 back to original text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can use a Base64 Decoder tool, which is the reverse process. Many online platforms offer both encoding and decoding functionality in one place.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the encoded output immediately after encoding to ensure you capture the complete Base64 string without any truncation</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Base64 encoding when embedding images or binary files in JSON, HTML, or CSS for seamless data integration</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your Base64 encoded data with a decoder tool to verify the encoding was successful before using it in production</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep encoded data organized by labeling it with its original file type or content description for easier identification later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}