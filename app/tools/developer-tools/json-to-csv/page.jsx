'use client';
import { useState } from 'react';
export default function JsonToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const data = JSON.parse(input);
      if (!Array.isArray(data)) throw new Error('JSON must be an array');
      const headers = Object.keys(data[0]);
      const csv = [headers.join(','), ...data.map(row => headers.map(h => row[h] ?? '').join(','))].join('\n');
      setOutput(csv);
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to CSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='[{"name":"John","age":30}]' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Json To Csv</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">JSON To CSV is a free online tool that instantly converts your JSON data into CSV (Comma-Separated Values) format without requiring any software installation or registration. Perfect for data analysis, spreadsheet imports, and seamless data migration between different platforms.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Json To Csv</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your JSON file into the input field on the tool's main page</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically detects the JSON structure and generates a preview of the CSV output</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the converted data and adjust any column settings if needed using the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Download button to save your CSV file to your computer or copy the output to clipboard</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is JSON To CSV really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, JSON To CSV is completely free with no hidden charges, registration requirements, or usage limits. You can convert as many JSON files as you need.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file sizes can the tool handle?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool can handle JSON files up to 10MB in size. For larger files, consider splitting them into smaller chunks before conversion.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my data be stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all conversions are processed locally in your browser. Your data is never uploaded to our servers or shared with third parties, ensuring complete privacy.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert nested JSON objects to CSV?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool automatically flattens nested JSON structures into CSV columns, making complex data easy to work with in spreadsheet applications.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to verify your data looks correct before downloading to catch any formatting issues early</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For JSON arrays containing objects, ensure all objects have consistent key names for the best CSV column alignment</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export your CSV with custom delimiters if your data contains commas by using the advanced options menu</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup of your original JSON file before conversion in case you need to reference the original data structure</li>
          </ul>
        </div>
      </div>
    </div>
  );
}