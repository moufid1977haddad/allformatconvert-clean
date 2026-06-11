'use client';
import { useState } from 'react';
export default function JsonToXmlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const obj = JSON.parse(input);
      const toXml = (obj, root = 'root') => {
        if (typeof obj !== 'object') return `<${root}>${obj}</${root}>`;
        const inner = Object.entries(obj).map(([k,v]) => toXml(v, k)).join('');
        return `<${root}>${inner}</${root}>`;
      };
      setOutput('<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(obj));
      setError('');
    } catch(e) { setError('Invalid JSON'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to XML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to XML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste JSON here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">XML Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Json To Xml</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Json To Xml is a free online converter tool that instantly transforms JSON data into XML format without requiring any software installation or technical expertise. This powerful utility helps developers, data analysts, and IT professionals seamlessly convert structured data between these two popular formats for better compatibility and integration.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Json To Xml</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your JSON data into the input field on the left side of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the Convert button to instantly process your JSON code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted XML output displayed on the right side</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the XML result and paste it into your application or file as needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Json To Xml completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Json To Xml is completely free with no hidden charges, registration requirements, or usage limits for conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large JSON files with this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool can handle most standard JSON files, though extremely large files may have processing limitations depending on your browser.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my data be saved or shared after conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your data is processed locally in your browser and is never stored on our servers or shared with third parties.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What happens if my JSON is invalid or malformed?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool will display an error message indicating the issue, helping you identify and fix syntax problems in your JSON.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your JSON syntax before conversion to ensure accurate XML output without errors</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the copy button to quickly transfer your converted XML to clipboard for easy pasting elsewhere</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark this tool for frequent use to save time on repetitive JSON to XML conversions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the conversion with sample data first if you are unfamiliar with XML structure to understand the format</li>
          </ul>
        </div>
      </div>
    </div>
  );
}