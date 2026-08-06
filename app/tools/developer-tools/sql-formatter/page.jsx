'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

// Splits input into { code } and { string } segments by scanning quotes, so
// the keyword/comma regexes below can be applied only to code segments —
// never to the contents of a string literal ('...') or a quoted identifier
// ("...") — instead of running on the whole text blindly. SQL escapes an
// embedded quote by doubling it (e.g. 'it''s'), not with a backslash, so
// a doubled quote character is treated as literal content rather than the
// end of the string/identifier.
function splitSqlSegments(input) {
  const segments = [];
  let i = 0;
  const n = input.length;
  let buf = '';
  while (i < n) {
    const c = input[i];
    if (c === "'" || c === '"') {
      if (buf) { segments.push({ code: buf }); buf = ''; }
      const quote = c;
      let str = c;
      i++;
      while (i < n) {
        if (input[i] === quote) {
          if (input[i + 1] === quote) { str += quote + quote; i += 2; continue; }
          str += quote; i++; break;
        }
        str += input[i]; i++;
      }
      segments.push({ string: str });
      continue;
    }
    buf += c;
    i++;
  }
  if (buf) segments.push({ code: buf });
  return segments;
}

export default function SqlFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const keywords = ['SELECT','FROM','WHERE','AND','OR','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','DROP','JOIN','LEFT','RIGHT','INNER','ON','GROUP BY','ORDER BY','HAVING','LIMIT'];
  const format = () => {
    const sql = splitSqlSegments(input.trim())
      .map(seg => {
        if (seg.string !== undefined) return seg.string;
        let code = seg.code;
        keywords.forEach(kw => { code = code.replace(new RegExp('\\b' + kw + '\\b','gi'),'\n' + kw); });
        code = code.replace(/,/g,',\n  ');
        return code;
      })
      .join('');
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
        description="SQL Formatter breaks a fixed list of SQL keywords (SELECT, FROM, WHERE, JOIN, and about 20 others) onto new lines and adds a line break after every comma, entirely in your browser — nothing is uploaded to a server. It's a simple keyword-matching pass, not a real SQL parser, but it is string-aware: string literals ('...') and double-quoted identifiers, including ones with a doubled-quote escape like 'it''s', are scanned separately from the surrounding SQL, so a keyword or comma inside one is copied through untouched instead of getting an unwanted line break."
        howTo={[
          "Paste your SQL query into the input box.",
          "Click 'Format' to break keywords and comma-separated items onto new lines.",
          "Review the result in the output box.",
          "Click 'Copy' to copy the formatted SQL to your clipboard."
        ]}
        faqs={[
          { q: "Is SQL Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What SQL dialects does it support?", a: "It matches a fixed list of common keywords (SELECT, FROM, WHERE, JOIN, GROUP BY, and similar) that are shared across most SQL dialects, but it doesn't parse or validate dialect-specific syntax." },
          { q: "Can I customize indentation size or keyword case?", a: "No, there are no formatting options — the line-break behavior and spacing are fixed." },
          { q: "Is my SQL uploaded to a server?", a: "No, formatting happens entirely in your browser." }
        ]}
        tips={[
          "String literals and quoted identifiers, including ones with an escaped quote (e.g. 'it''s'), are scanned as protected content, so a keyword or comma inside them won't get an unwanted line break.",
          "This is a lightweight readability pass, not a validator — it won't catch syntax errors in your SQL.",
          "For dialect-specific formatting or full SQL parsing, use a dedicated SQL formatting library instead.",
          "Review the formatted output before running it — this is a readability pass, not a validator, so it won't catch typos or invalid syntax in your original query."
        ]}
      />
    </div>
  );
}