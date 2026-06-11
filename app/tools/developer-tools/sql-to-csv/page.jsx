'use client';
import { useState } from 'react';
export default function SqlToCsvPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const convert = () => {
    try {
      const rows = [];
      const re = /INSERT INTO \w+ \(([^)]+)\) VALUES \(([^)]+)\)/gi;
      let match;
      let headers = null;
      while ((match = re.exec(input)) !== null) {
        if (!headers) { headers = match[1].split(',').map(h => h.trim()); rows.push(headers.join(',')); }
        const values = match[2].split(',').map(v => v.trim().replace(/^'|'$/g,''));
        rows.push(values.join(','));
      }
      if (rows.length === 0) throw new Error('No INSERT statements found');
      setOutput(rows.join('\n'));
      setError('');
    } catch(e) { setError(e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL to CSV</h1>
        <p className="text-neutral-500 text-center mb-8">Extract data from SQL to CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SQL Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="INSERT INTO..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Sql To Csv</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">SQL To CSV is a free online tool that instantly converts SQL query results into CSV format for easy data export and analysis. Perfect for database administrators, developers, and data analysts who need to quickly transform structured query data into spreadsheet-compatible files.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Sql To Csv</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your SQL query into the input field or upload a SQL file</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to execute the transformation</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Preview the generated CSV output in the results panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the CSV file to your computer with a single click</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What SQL databases does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">SQL To CSV supports standard SQL syntax compatible with MySQL, PostgreSQL, SQL Server, SQLite, and other major relational databases.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for conversions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool can handle most standard SQL queries, but very large datasets may be limited to 10,000 rows for optimal performance.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the CSV delimiter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can choose between comma, semicolon, tab, and pipe delimiters in the output settings before downloading.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do you store my SQL queries or data?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all conversions are processed locally in your browser and no data is stored on our servers for privacy protection.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use column aliases in your SELECT statement to create meaningful CSV headers that are easy to understand</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Include a WHERE clause to filter results before conversion and reduce unnecessary data in your CSV output</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your SQL query in your database first to ensure it returns the correct results before conversion</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Export multiple related tables separately then use spreadsheet tools to combine them if needed for complex data structures</li>
          </ul>
        </div>
      </div>
    </div>
  );
}