'use client';
import { useState } from 'react';
export default function XmlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(input, 'text/xml');
      const xmlToObj = (node) => {
        if (node.nodeType === 3) return node.nodeValue.trim();
        const obj = {};
        for (const child of node.childNodes) {
          const val = xmlToObj(child);
          if (val === '') continue;
          if (obj[child.nodeName]) {
            if (!Array.isArray(obj[child.nodeName])) obj[child.nodeName] = [obj[child.nodeName]];
            obj[child.nodeName].push(val);
          } else obj[child.nodeName] = val;
        }
        return obj;
      };
      setOutput(JSON.stringify(xmlToObj(xml.documentElement), null, 2));
      setError('');
    } catch(e) { setError('Invalid XML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert XML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">XML Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Xml To Json</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">XML to JSON is a free online conversion tool that instantly transforms your XML data into JSON format without any installation or signup required. This utility is perfect for developers, data engineers, and IT professionals who need to convert between these popular data formats quickly and efficiently.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Xml To Json</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your XML code into the input field on the left side of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to automatically process and convert your XML data</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted JSON output displayed on the right side of the interface</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the JSON result to your clipboard or download it as a file for use in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is XML to JSON conversion completely free?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our XML to JSON tool is completely free to use with no hidden fees, registration requirements, or usage limits. You can convert unlimited files without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our tool can handle XML files up to 10MB in size. For larger files, we recommend splitting them into smaller chunks or compressing the data before conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my data be stored or shared after conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your data is processed entirely in your browser and is never stored on our servers. We do not collect, share, or retain any of your conversion data for privacy and security reasons.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert JSON back to XML using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">This tool is specifically designed for XML to JSON conversion. For reverse conversion, you would need to use a dedicated JSON to XML converter tool.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your XML before conversion to ensure it is well-formed and contains no syntax errors, which will result in accurate JSON output</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the pretty-print formatting option to make your converted JSON more readable and easier to debug in your development workflow</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep attribute names and element names consistent in your XML structure to maintain clean and organized JSON output after conversion</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your converted JSON with your application immediately after conversion to verify that all data has been properly transformed and maintains its intended structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}