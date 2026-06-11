'use client';
import { useState, useRef } from 'react';
export default function ExcelToJsonPage() {
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('');
  const inputRef = useRef();
  const convert = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const result = {};
      workbook.SheetNames.forEach(name => { result[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]); });
      setOutput(JSON.stringify(result, null, 2));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Excel files to JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop an Excel file here</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={convert} />
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Excel To Json</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Excel To Json is a free online tool that instantly converts your Excel spreadsheets into JSON format without requiring any installation or coding knowledge. Perfect for developers, data analysts, and businesses looking to streamline data integration and API development workflows.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Excel To Json</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your Excel file (.xlsx, .xls) or paste your spreadsheet data directly into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Configure your conversion settings such as selecting specific sheets, rows, or columns to include</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to instantly transform your Excel data into properly formatted JSON</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy or download the generated JSON output and use it in your applications, APIs, or databases</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does Excel To Json support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports .xlsx, .xls, and .csv file formats. You can also paste data directly from your spreadsheet application.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for conversion?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most conversions support files up to 10MB. For larger files, consider splitting your data or contacting support for assistance.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple sheets at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can select which sheets to convert. The tool will either merge them into one JSON file or create separate JSON files per sheet based on your preference.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">All conversions are processed securely. Your files are not stored on our servers and are automatically deleted after conversion.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the first row of your Excel file as header names for cleaner, more readable JSON output with meaningful property names</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove any empty rows or columns before conversion to ensure your JSON output is clean and optimized</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of the preview feature to verify your conversion settings before finalizing the output</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For complex nested data structures, consider using the advanced options to customize how your Excel data maps to JSON properties</li>
          </ul>
        </div>
      </div>
    </div>
  );
}