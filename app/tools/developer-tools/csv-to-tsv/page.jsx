'use client';
import { useState } from 'react';
export default function CsvToTsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => setOutput(input.split('\n').map(line => line.split(',').join('\t')).join('\n'));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to TSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to TSV format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">TSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Csv To Tsv</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">CSV To TSV is a free online conversion tool that instantly transforms comma-separated values files into tab-separated values format without requiring any software installation. This utility is perfect for data professionals, developers, and analysts who need to quickly convert between these two popular data formats for compatibility with various applications and databases.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Csv To Tsv</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Open the CSV To TSV tool in your web browser and locate the file upload area on the homepage.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your CSV file directly into the designated conversion zone.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>The tool automatically processes your file and displays a preview of the converted TSV format.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the download button to save your newly converted TSV file to your computer.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is the difference between CSV and TSV files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">CSV files use commas to separate values while TSV files use tabs. TSV format is often preferred for data containing commas within fields, as it reduces parsing conflicts and improves data integrity.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all file conversions are processed locally in your browser and files are not stored on our servers. Your data remains completely private and secure throughout the conversion process.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file size limit does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The CSV To TSV converter can handle files up to 50MB in size, making it suitable for both small personal projects and larger enterprise-level data conversions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Currently, the tool processes one file at a time. However, you can quickly convert multiple files by uploading and downloading them sequentially in just a few clicks each.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always backup your original CSV file before conversion to ensure you have a copy of the source data in case you need to revert or verify the conversion accuracy.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Preview the converted TSV file within the tool before downloading to verify that all data has been properly converted and formatted according to your requirements.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use TSV format when working with databases like Excel or Google Sheets that may have issues parsing CSV files containing embedded commas or special characters.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For files with quoted fields or complex data structures, review the conversion preview carefully as tab-separated format may display differently than your original CSV layout.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}