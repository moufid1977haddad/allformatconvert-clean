'use client';
import { useState } from 'react';
export default function CsvToExcelPage() {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('');
  const convert = async () => {
    if (!input) return;
    setStatus('Converting...');
    try {
      const XLSX = (await import('xlsx')).default;
      const ws = XLSX.utils.aoa_to_sheet(input.split('\n').map(r => r.split(',')));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'converted.xlsx');
      setStatus('Downloaded!');
    } catch(e) { setStatus('Error: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to Excel</h1>
        <p className="text-neutral-500 text-center mb-8">Convert CSV to Excel format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Paste CSV here..." value={input} onChange={e => setInput(e.target.value)} />
          <button onClick={convert} disabled={!input} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert and Download</button>
          {status && <p className="text-center text-green-400">{status}</p>}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Csv To Excel</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">CSV To Excel is a free online tool that instantly converts CSV (Comma-Separated Values) files into Excel spreadsheets without requiring any software installation. This versatile converter preserves your data formatting and allows you to download the converted file in seconds.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Csv To Excel</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload your CSV file by clicking the upload button or dragging and dropping the file into the designated area</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>The tool automatically detects the delimiter and previews your data to ensure correct formatting</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize any settings such as delimiter type, sheet name, or cell formatting if needed</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the Convert button and download your Excel file in .xlsx or .xls format</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does CSV To Excel support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">CSV To Excel supports standard CSV files and can export to both .xlsx (Excel 2007+) and .xls (older Excel versions) formats.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all uploads are processed securely and files are automatically deleted from our servers after conversion. We do not store or share your data.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">CSV To Excel can handle files up to 50MB in size, making it suitable for most standard data conversion needs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, CSV To Excel is completely online and works in any modern web browser without requiring any downloads or installations.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature before converting to verify your data is formatted correctly and detect any delimiter issues</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For CSV files with special characters or non-English text, ensure your file is UTF-8 encoded for best results</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>If your CSV contains formulas, note that they will be converted to their calculated values in the Excel file</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Batch convert multiple CSV files by using the tool repeatedly, or contact support if you need to process large volumes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}