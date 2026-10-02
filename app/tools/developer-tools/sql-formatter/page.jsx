'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatSql } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';

export default function SqlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [dialect, setDialect] = useState('sql');
  const format = async () => {
    try { setOutput(await formatSql(input, { language: dialect })); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SQL Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify SQL queries</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SQL here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="formatted.sql" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={dialect} onChange={e => setDialect(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3" aria-label="SQL dialect">
              {[['sql','Standard SQL'],['mysql','MySQL'],['mariadb','MariaDB'],['postgresql','PostgreSQL'],['tsql','SQL Server'],['plsql','Oracle PL/SQL'],['sqlite','SQLite'],['bigquery','BigQuery'],['snowflake','Snowflake'],['redshift','Redshift'],['spark','Spark'],['db2','Db2']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"SQL Formatter"}
        description={"SQL Formatter formats SQL with sql-formatter, the open-source library behind many online SQL beautifiers, entirely in your browser. It parses the query rather than inserting line breaks at keywords, so comments (-- and /* */), string literals with commas or quotes, and function calls such as COUNT(a, b) stay intact. Keywords are upper-cased and clauses indented, with dialect-specific syntax for standard SQL, MySQL, MariaDB, PostgreSQL, SQL Server (T-SQL), Oracle (PL/SQL), SQLite, BigQuery, Snowflake and more."}
        howTo={[
          "Choose your SQL dialect (standard SQL works for most queries).",
          "Paste your query into the input box.",
          "Click 'Format'.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "Is SQL Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can formatting break my query?", a: "No — the formatter tokenizes SQL, so text inside comments and strings is never modified; only whitespace and keyword case change." },
          { q: "Which databases are supported?", a: "Standard SQL, MySQL, MariaDB, PostgreSQL, SQL Server, Oracle PL/SQL, SQLite, BigQuery, Snowflake, Redshift, Spark, Db2 and others, each with its own syntax (backticks, [brackets], $1 parameters…)." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "Pick the dialect of your database so special syntax (MySQL backticks, T-SQL brackets, PostgreSQL :: casts) is recognized.",
          "If the formatter reports a parse error, the query probably uses syntax of another dialect."
        ]}
      />
    </div>
  );
}