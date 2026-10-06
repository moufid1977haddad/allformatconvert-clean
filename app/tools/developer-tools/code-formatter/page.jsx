'use client';
import { useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { LANGUAGES, SQL_DIALECTS, languageById, detectLanguage, formatCode, errorText } from '../../../lib/codeFormat';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

// P31 (03/10): 13 languages, detected from the text unless chosen in the Language list; each formatter is downloaded
// only when Format is clicked (app/lib/codeFormat.js). Before, JSON was preselected and JavaScript pasted on an iPhone
// answered "Error: JSON Parse error: Unexpected identifier".
export default function CodeFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('auto');
  const [dialect, setDialect] = useState('sql');
  const [used, setUsed] = useState(null); // the language the output is in (detected or chosen)
  const [busy, setBusy] = useState(false);
  // The input box is NOT controlled by React (P19, 01/10): React never writes into it, and Format reads the text the
  // box really shows. A controlled box is rewritten with React's state after every input event; if an event goes
  // missing, the state lags and a character typed is overwritten. People's typing always sends the event, but
  // Safari's WebDriver does not always (React issue #10687) — the likely cause of "Éloi" for "Élodie" seen once on the
  // owner's Mac bench (not reproduced in 18 tries). The code editors of the reference sites (CodeMirror, Ace) are not
  // controlled either.
  const inputRef = useRef(null);
  const format = async () => {
    const input = inputRef.current ? inputRef.current.value : '';
    setInput(input);
    const target = lang === 'auto' ? detectLanguage(input) : lang;
    setUsed(target);
    if (!target) {
      const msg = 'Error: The language could not be recognized. Choose it in the Language list.';
      reportShownMessage(msg);
      setOutput(msg);
      return;
    }
    setBusy(true);
    try {
      setOutput(await formatCode(input, target, { sqlDialect: dialect }));
    } catch (e) {
      const msg = 'Error: ' + errorText(e);
      reportShownMessage(msg.split('\n')[0]);
      setOutput(msg);
    } finally { setBusy(false); }
  };
  const usedLang = languageById(used);
  const showDialect = lang === 'sql' || (lang === 'auto' && used === 'sql');
  const isError = output.startsWith('Error: ');
  const selectCls = 'w-full min-h-[44px] bg-white border border-neutral-300 rounded-lg px-3 py-2 text-base';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify JavaScript, TypeScript, JSX, JSON, HTML, XML, CSS, SCSS, LESS, SQL, YAML, Markdown and GraphQL</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="cf-lang" className="block text-sm text-neutral-500 mb-1">Language</label>
              <select id="cf-lang" className={selectCls} value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="auto">Auto-detect</option>
                {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
            {showDialect && (
              <div>
                <label htmlFor="cf-dialect" className="block text-sm text-neutral-500 mb-1">SQL dialect</label>
                <select id="cf-dialect" className={selectCls} value={dialect} onChange={(e) => setDialect(e.target.value)}>
                  {SQL_DIALECTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." ref={inputRef} aria-label="Input" spellCheck={false} autoCapitalize="off" autoCorrect="off" onChange={e => setInput(e.target.value)} onBlur={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <p className="text-sm text-neutral-600 mt-1 min-h-[1.25rem]" aria-live="polite" data-testid="cf-status">
              {busy ? 'Formatting…' : usedLang && output ? `${isError ? 'Read as' : 'Formatted as'} ${usedLang.label}${used === 'sql' ? ` (${SQL_DIALECTS.find((d) => d.id === dialect)?.label})` : ''}${lang === 'auto' ? ' (detected)' : ''}` : ''}
            </p>
            {!isError && usedLang && <TextDownload text={output} name={'formatted.' + usedLang.ext} />}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input || busy} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 min-h-[44px] font-semibold transition text-white">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 min-h-[44px] font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"Code Formatter"}
        description={`Code Formatter beautifies ${LANGUAGES.length} languages in your browser and works out which one you pasted. JavaScript, TypeScript, JSX, HTML, CSS, SCSS, LESS, YAML, Markdown and GraphQL go through Prettier 3; XML through Prettier's XML plugin after a well-formedness check; SQL through sql-formatter, with ${SQL_DIALECTS.length} dialects; JSON through the site's own re-indenter, which keeps every number, escape and key order as written. Prettier applies its own style, so quotes, semicolons and line wrapping can change. When the engine reports a syntax error, nothing is formatted and the output shows the message with its position whenever the engine gives one.`}
        example={{
          caption: "Auto-detect reads this as GraphQL; the line under the output says Formatted as GraphQL (detected).",
          inputLabel: "Input",
          input: "query{user(id:1){name,friends(first:2){name}}}",
          outputLabel: "Output",
          output: "query {\n  user(id: 1) {\n    name\n    friends(first: 2) {\n      name\n    }\n  }\n}",
        }}
        howToTitle={"How to format code online"}
        howTo={[
          "Paste your code into \"Input\".",
          "Leave \"Auto-detect\" in the Language list, or pick the language; for SQL, a \"SQL dialect\" list appears.",
          "Click \"Format\".",
          "Check the line under the output, which names the language used, then click \"Copy\" or \"Download\".",
        ]}
        specs={[
          { label: "Languages", value: `${LANGUAGES.map((l) => l.label).join(', ')}` },
          { label: "SQL dialects", value: `${SQL_DIALECTS.length}: ${SQL_DIALECTS.map((d) => d.label).join(', ')}` },
          { label: "Style", value: "Prettier with a print width of 80 and 2-space indentation (XML text content kept as written); JSON indented by 2 spaces; SQL keywords in capitals" },
          { label: "Detection", value: "Mostly reads the first 4,000 characters (JSON is checked on the whole text); a wrong guess is fixed by choosing the language" },
        ]}
        privacyTitle={"Where your code is processed"}
        privacy={"Formatting happens in the browser: each formatter (Prettier with the plugin a language needs, or sql-formatter) is fetched the first time you format that language, and your code is never uploaded. If formatting fails, the first line of the error, such as Line 3, column 12: Unexpected token, goes to our error log with the tool name and your browser's name and version, cleaned of quoted text, long numbers and addresses."}
        faqs={[
          { q: "Can it detect the language automatically?", a: "Yes, from the text itself: its first characters (a tag, a brace, a SQL or GraphQL keyword) and marks only one language has, such as type annotations for TypeScript or $variables for SCSS. If the guess is wrong, pick the language and click \"Format\" again." },
          { q: "Will formatting change my code?", a: "No for JSON: only whitespace changes, and numbers such as 1.10 or 20-digit ids are copied as written. Yes in style for the others: Prettier can switch quote marks, add semicolons and wrap long lines, and SQL keywords are capitalized." },
          { q: "Does it show where a syntax error is?", a: "Yes, when the engine reports a position: the output starts with the line and column and the message, then shows the lines around it with a caret. Nothing is formatted. A few errors come without a position and are shown as a message only." },
          { q: "Which SQL dialects are supported?", a: `${SQL_DIALECTS.length}, chosen in the "SQL dialect" list that appears for SQL, among them MySQL, PostgreSQL, SQLite, SQL Server (T-SQL), Oracle (PL/SQL), BigQuery, Snowflake, ClickHouse and DuckDB. SQL Formatter uses the same engine with a shorter list.` },
        ]}
        tips={[
          "Paste a minified JavaScript, CSS or HTML file to make it readable before you debug it.",
          "For JSON with 4-space or tab indentation, or sorted keys, use JSON Formatter, which has those options.",
        ]}
      />
    </div>
  );
}
