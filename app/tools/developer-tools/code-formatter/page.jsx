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
      const msg = 'Error: The language could not be recognised. Choose it in the Language list.';
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
        description={"Code Formatter formats JavaScript, TypeScript, JSX, JSON, HTML, XML, CSS, SCSS, LESS, SQL, YAML, Markdown and GraphQL entirely in your browser. The language is detected from your code, or you choose it. JavaScript, TypeScript, JSX, HTML, CSS, SCSS, LESS, YAML, Markdown and GraphQL are formatted by Prettier, the formatter most JavaScript projects use; XML by Prettier's XML plugin; SQL by sql-formatter, with 20 dialects (standard SQL, MySQL, MariaDB, PostgreSQL, SQLite, SQL Server T-SQL, Oracle PL/SQL, BigQuery, Snowflake, Redshift and more). JSON is validated and re-indented from your original text, so every number (including 20-digit ids and values like 1.10), escape and key order stays exactly as written. A syntax error is shown with its line and column and the lines around it."}
        howTo={[
          "Paste your code into the input box.",
          "Leave the Language list on 'Auto-detect', or choose the language (for SQL, also choose the SQL dialect).",
          "Click 'Format'.",
          "Click 'Copy' to copy the result, or download it as a file."
        ]}
        faqs={[
          { q: "Is Code Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which languages are supported?", a: "JavaScript, TypeScript, JSX (React), JSON, HTML, XML, CSS, SCSS, LESS, SQL (20 dialects, including MySQL, PostgreSQL, SQLite, SQL Server T-SQL, Oracle PL/SQL and BigQuery), YAML, Markdown and GraphQL." },
          { q: "How is the language detected?", a: "From the code itself: its first characters (a tag, a brace, a SQL or GraphQL keyword) and marks only one language has (type annotations for TypeScript, $variables for SCSS, key: value lines for YAML…). The result says which language was used; if it guessed wrong, choose the language in the list and click 'Format' again." },
          { q: "Does formatting change my code?", a: "Its meaning, never. JSON: only whitespace changes, numbers are not re-serialized, so large integers and trailing zeros are preserved. JavaScript, TypeScript, CSS and the others are printed in Prettier's standard style, which can also change quotes, add semicolons or wrap long lines. Accents and emoji are kept as typed." },
          { q: "What happens when my code has a syntax error?", a: "Nothing is formatted; the result shows the line and column of the first error (for example 'Line 3, column 12: Unexpected token') with the lines around it." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; each language's formatter is downloaded once, the first time you format that language." }
        ]}
        tips={[
          "Minified JavaScript, CSS, HTML or JSON becomes readable in one click.",
          "SQL keywords are written in capitals; choose your database's dialect so its own syntax (backquotes, [brackets], ::casts) is understood."
        ]}
      />
    </div>
  );
}
