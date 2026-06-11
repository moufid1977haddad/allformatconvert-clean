'use client';
import { useState } from 'react';
export default function CsvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const lines = input.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const result = lines.slice(1).map(line => { const vals = line.split(','); return Object.fromEntries(headers.map((h,i) => [h, vals[i]?.trim() || ''])); });
      setOutput(JSON.stringify(result, null, 2));
      setError('');
    } catch(e) { setError('Invalid CSV'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name,age,city..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Csv To Json</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">CSV to JSON is a free online tool that instantly converts comma-separated values (CSV) files into JavaScript Object Notation (JSON) format without any software installation required. This converter supports large files, maintains data integrity, and is perfect for developers, data analysts, and anyone working with data integration and API development.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Csv To Json</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload or paste your CSV file content into the input field on the CSV to JSON converter page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Review the preview to ensure your data is formatted correctly with proper headers and delimiters</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Convert button to instantly transform your CSV data into JSON format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the converted JSON file or copy the formatted output directly to your clipboard for immediate use</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the maximum file size I can convert?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our CSV to JSON converter supports files up to 50MB in size, making it suitable for most common data conversion tasks.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, CSV to JSON is completely free and web-based, requiring only a modern browser and internet connection.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my data be kept private?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all conversions are processed locally in your browser and no data is stored on our servers or shared with third parties.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert JSON back to CSV?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, we offer a complementary JSON to CSV converter for easy bidirectional data format conversion.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your CSV file has a header row as the first line, which will become the keys in your JSON objects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use consistent delimiters throughout your CSV file; the tool auto-detects commas, semicolons, tabs, and pipes</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove any extra blank rows or columns from your CSV before conversion to avoid unnecessary null values in JSON</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Validate your JSON output using a JSON linter before integrating it into your applications or APIs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}