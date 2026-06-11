'use client';
import { useState, useRef } from 'react';
export default function ExcelToCsvPage() {
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
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setOutput(XLSX.utils.sheet_to_csv(sheet));
      setStatus('');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Excel to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Convert Excel files to CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click or drop an Excel file here</p>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={convert} />
          </div>
          {status && <p className="text-yellow-400 text-center">{status}</p>}
          {output && <div className="space-y-2"><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button></div>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Excel To Csv</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Excel To CSV is a free online tool that instantly converts Excel spreadsheets (.xlsx, .xls) into comma-separated values (CSV) format without requiring any software installation. This web-based converter maintains data integrity while making your files compatible with virtually any application or database system.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Excel To Csv</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Click the upload button and select your Excel file from your computer or drag and drop it into the converter window</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Choose which sheet you want to convert if your Excel file contains multiple sheets</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Convert' button to process your file within seconds</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your converted CSV file to your computer and use it in any application that supports CSV format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my file data secure when using Excel To CSV?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, your files are processed securely and automatically deleted from our servers after conversion. We do not store or share any of your data.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert multiple Excel files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can convert files one at a time with our free tool. For bulk conversions, consider using the batch feature if available in your account.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What Excel file formats are supported?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">We support all common Excel formats including .xlsx, .xls, .xlsm, and other spreadsheet variations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my formatting be preserved in the CSV file?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">CSV format is text-based, so complex formatting like colors and fonts won't transfer, but all data values and cell contents will be preserved.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Remove any merged cells or complex formatting from your Excel file before conversion for the cleanest CSV output</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Check your CSV file in a text editor to verify that all data converted correctly, especially files with special characters</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your data contains commas, consider using the delimiter options to avoid data parsing issues in your target application</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Back up your original Excel file before conversion in case you need to reference the original formatting or data structure later</li>
          </ul>
        </div>
      </div>
    </div>
  );
}