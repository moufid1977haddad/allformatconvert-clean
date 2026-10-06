'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatSql } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SQL here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
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
        description={"SQL Formatter lays out a query with the open-source sql-formatter library, in your browser. It tokenizes the SQL for the dialect you pick, puts each clause (SELECT, FROM, WHERE, GROUP BY…) on its own line, indents columns and conditions by 2 spaces and writes keywords in capitals. Text inside comments and string literals is not changed, and a comma inside a function call such as COUNT(a, b) or inside a string stays where it is. Twelve dialects are offered, from standard SQL to Db2. A query the dialect cannot parse gets the library's error message instead of output."}
        example={{
          caption: "Standard SQL: the comma inside the string literal does not start a new line.",
          inputLabel: "Input",
          input: "select id, count(*) as n from orders o join users u on u.id = o.user_id where o.status = 'paid, shipped' group by id",
          outputLabel: "Output",
          output: "SELECT\n  id,\n  count(*) AS n\nFROM\n  orders o\n  JOIN users u ON u.id = o.user_id\nWHERE\n  o.status = 'paid, shipped'\nGROUP BY\n  id",
        }}
        howToTitle={"How to format a SQL query"}
        howTo={[
          "Choose your database in the dialect list; \"Standard SQL\" is selected by default.",
          "Paste the query into \"Input\".",
          "Click \"Format\".",
          "Click \"Copy\", or \"Download\" to save \"formatted.sql\".",
        ]}
        specs={[
          { label: "Dialects", value: "Standard SQL, MySQL, MariaDB, PostgreSQL, SQL Server, Oracle PL/SQL, SQLite, BigQuery, Snowflake, Redshift, Spark, Db2" },
          { label: "Output", value: "SQL with uppercase keywords and 2-space indentation, saved as formatted.sql" },
          { label: "Preserved", value: "Comments, string literals, identifiers and the case of function names" },
          { label: "Errors", value: "sql-formatter's own message, which can run to several lines" },
        ]}
        privacyTitle={"Where your query is processed"}
        privacy={"sql-formatter is a JavaScript library that the page downloads when you first click \"Format\"; your query is parsed and laid out in the browser and is not uploaded. When the library rejects a query, the error text shown is sent to our error log with quoted parts, long numbers and addresses removed, along with the tool name and your browser's name and version."}
        faqs={[
          { q: "Can formatting break my query?", a: "No. The formatter changes only whitespace and the case of keywords. Comments and string literals, including commas or quotes inside them, are copied as written, so the query returns the same result." },
          { q: "Which databases are supported?", a: "12: Standard SQL, MySQL, MariaDB, PostgreSQL, SQL Server, Oracle PL/SQL, SQLite, BigQuery, Snowflake, Redshift, Spark and Db2. Code Formatter uses the same engine with a longer list, adding ClickHouse, DuckDB, Trino and Hive among others." },
          { q: "Does it work with any SQL syntax?", a: "No. Each dialect has its own syntax, so T-SQL square brackets or PostgreSQL :: casts fail under Standard SQL, while MySQL backticks are accepted. Pick your database in the list and click \"Format\" again; the error message often suggests the same." },
        ]}
        tips={[
          "Function names keep the case you typed (count stays count); only keywords such as SELECT and GROUP BY are capitalized.",
        ]}
      />
    </div>
  );
}