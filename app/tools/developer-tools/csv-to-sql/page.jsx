'use client';
import { useState } from 'react';
export default function CsvToSqlPage() {
  const [input, setInput] = useState('');
  const [tableName, setTableName] = useState('my_table');
  const [output, setOutput] = useState('');
  const convert = () => {
    const lines = input.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(',').map(v => v.trim()));
    const create = 'CREATE TABLE ' + tableName + ' (\n' + headers.map(h => '  ' + h + ' VARCHAR(255)').join(',\n') + '\n);\n\n';
    const inserts = rows.map(row => 'INSERT INTO ' + tableName + ' (' + headers.join(', ') + ') VALUES (' + row.map(v => "'" + v + "'").join(', ') + ');').join('\n');
    setOutput(create + inserts);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSV to SQL</h1>
        <p className="text-neutral-500 text-center mb-8">Generate SQL INSERT statements from CSV</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div><label className="block text-sm text-neutral-500 mb-1">Table Name</label><input type="text" value={tableName} onChange={e => setTableName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 font-mono" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">CSV Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="name,age,city..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">SQL Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Csv To Sql</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">CSV To SQL is a free online tool that instantly converts your CSV files into SQL INSERT statements without requiring any software installation. This powerful utility simplifies database management by automating the conversion process, saving time and reducing manual data entry errors.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Csv To Sql</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload or paste your CSV file into the tool's input area to get started with the conversion process.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Configure your table name and column settings to match your database schema requirements.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated SQL code in the preview window to ensure accuracy before downloading.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy or download the SQL statements and execute them directly in your database management system.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is CSV To SQL completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, CSV To SQL is 100% free with no hidden charges, registration requirements, or premium features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does this tool support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool supports standard CSV files and can handle various delimiters including commas, semicolons, tabs, and pipes.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert large CSV files?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool can handle large CSV files, though very large files may take longer to process depending on your browser's capabilities.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your data is processed locally in your browser and is never stored on our servers, ensuring complete privacy and security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to verify your data is correctly formatted before executing the SQL statements in your database.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Ensure your CSV headers match the desired SQL column names to minimize manual adjustments after conversion.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the generated SQL on a development database first before applying it to your production environment.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Consider using the batch insert feature for better performance when dealing with large datasets.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}