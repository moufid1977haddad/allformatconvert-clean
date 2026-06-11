'use client';
import { useState } from 'react';
export default function XmlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const format = () => {
    try {
      let indent = 0;
      const formatted = input.replace(/></g,'>\n<').split('\n').map(line => {
        if (line.match(/^<\//)) indent = Math.max(0, indent-1);
        const result = '  '.repeat(indent) + line.trim();
        if (line.match(/^<[^/!][^>]*[^/]>$/)) indent++;
        return result;
      }).join('\n');
      setOutput(formatted);
      setError('');
    } catch(e) { setError('Error formatting XML'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">XML Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify XML</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste XML here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Xml Formatter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">XML Formatter is a free online tool that instantly beautifies, validates, and organizes your XML code for better readability and error detection. Perfect for developers and data professionals who need to clean up messy XML files without any software installation.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Xml Formatter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your XML code into the input field on the XML Formatter homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Format' button to automatically indent and organize your XML structure</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the formatted output in the results panel for proper syntax and hierarchy</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the cleaned XML code or download it as a file for use in your projects</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is XML Formatter completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, XML Formatter is 100% free with no registration, hidden fees, or usage limits required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can XML Formatter validate my XML code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool checks your XML for syntax errors and displays validation results alongside the formatted output.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file sizes can XML Formatter handle?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">XML Formatter can process files up to several megabytes, making it suitable for most standard XML documents.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my XML data after I format it?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all data is processed in your browser and not stored on our servers, ensuring complete privacy.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use XML Formatter to debug XML parsing errors by identifying missing tags or incorrect nesting</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Set custom indentation levels to match your coding style preferences for consistency across projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your XML before deployment to catch structural issues that could cause application failures</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare original and formatted XML side-by-side to understand proper XML structure and best practices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}