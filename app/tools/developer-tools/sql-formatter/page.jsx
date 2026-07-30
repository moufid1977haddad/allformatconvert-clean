'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="SQL Formatter"
        description="SQL Formatter breaks a fixed list of SQL keywords (SELECT, FROM, WHERE, JOIN, and about 20 others) onto new lines and adds a line break after every comma, entirely in your browser — nothing is uploaded to a server. It's a simple keyword-matching pass, not a real SQL parser: it isn't aware of string literals, so a keyword or comma inside a quoted string value will also get an unwanted line break inserted."
        howTo={[
          "Paste your SQL query into the input box.",
          "Click 'Format' to break keywords and comma-separated items onto new lines.",
          "Review the result — check quoted string values for unwanted line breaks.",
          "Click 'Copy' to copy the formatted SQL to your clipboard."
        ]}
        faqs={[
          { q: "Is SQL Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What SQL dialects does it support?", a: "It matches a fixed list of common keywords (SELECT, FROM, WHERE, JOIN, GROUP BY, and similar) that are shared across most SQL dialects, but it doesn't parse or validate dialect-specific syntax." },
          { q: "Can I customize indentation size or keyword case?", a: "No, there are no formatting options — the line-break behavior and spacing are fixed." },
          { q: "Is my SQL uploaded to a server?", a: "No, formatting happens entirely in your browser." }
        ]}
        tips={[
          "Check string literal values in your query after formatting — since the tool isn't string-aware, a keyword or comma inside quotes can get an unwanted line break inserted.",
          "This is a lightweight readability pass, not a validator — it won't catch syntax errors in your SQL.",
          "For dialect-specific formatting or full SQL parsing, use a dedicated SQL formatting library instead.",
          "Review the formatted output before running it, especially for queries with string literals containing SQL keywords."
        ]}
      />
    </div>
  );
}