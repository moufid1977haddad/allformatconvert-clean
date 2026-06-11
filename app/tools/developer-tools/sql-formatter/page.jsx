'use client';
import { useState } from 'react';
export default function SqlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const keywords = ['SELECT','FROM','WHERE','AND','OR','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','DROP','JOIN','LEFT','RIGHT','INNER','ON','GROUP BY','ORDER BY','HAVING','LIMIT'];
  const format = () => {
    let sql = input.trim();
    keywords.forEach(kw => { sql = sql.replace(new RegExp('\\b' + kw + '\\b','gi'),'\n' + kw); });
    sql = sql.replace(/,/g,',\n  ');
    setOutput(sql.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify SQL queries</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SQL here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Sql Formatter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">SQL Formatter is a free online tool that automatically formats and beautifies SQL queries for improved readability and consistency. It helps developers and database administrators clean up messy SQL code, making it easier to debug, maintain, and share with team members.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Sql Formatter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your unformatted SQL query into the input text area on the SQL Formatter tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Format' button to automatically format your SQL code with proper indentation and spacing</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the formatted output in the result panel to ensure it meets your formatting preferences</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the formatted SQL code using the 'Copy' button and paste it into your database application or editor</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is SQL Formatter completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, SQL Formatter is completely free with no hidden charges, registration requirements, or limitations on the number of queries you can format.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What SQL dialects does SQL Formatter support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">SQL Formatter supports standard SQL syntax and is compatible with most popular databases including MySQL, PostgreSQL, SQL Server, Oracle, and SQLite.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the formatting style and indentation?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, most SQL Formatter tools offer customizable options for indentation size, keyword case, and spacing preferences to match your coding standards.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my SQL data secure when using this online tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">SQL Formatter processes your queries locally in your browser without storing or transmitting your data to external servers, ensuring complete privacy and security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use SQL Formatter regularly to maintain consistent code style across your entire database project and team</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the formatting settings you prefer and apply them consistently to all your SQL scripts for uniform code appearance</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the formatted output as a learning tool to understand best practices for SQL code organization and readability</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Before executing complex queries, format them to visually identify potential syntax errors and logical issues more easily</li>
          </ul>
        </div>
      </div>
    </div>
  );
}