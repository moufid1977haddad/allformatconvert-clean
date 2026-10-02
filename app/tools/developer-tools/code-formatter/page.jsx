'use client';
import { useRef, useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { beautify } from '../../../lib/codeTools';
import { reformatJson } from '../../../lib/jsonText';
import { stripBom } from '../../../lib/jsonLossless';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';

export default function CodeFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [lang, setLang] = useState('json');
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
    try {
      // JSON: re-indented from the original text, so 64-bit ids and 1.10 are
      // not rounded (JSON.stringify(JSON.parse()) did that, 29/09).
      setOutput(lang === 'json' ? reformatJson(stripBom(input), 2) : await beautify(input, lang));
    } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Code Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex gap-2">{['json','css','html'].map(l => <button key={l} onClick={() => setLang(l)} className={"px-4 py-2 rounded-lg font-semibold transition " + (lang===l?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800')}>{l.toUpperCase()}</button>)}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste code here..." ref={inputRef} aria-label="Input" onChange={e => setInput(e.target.value)} onBlur={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            {!output.startsWith('Error: ') && <TextDownload text={output} name={'formatted.' + lang} />}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Format</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"Code Formatter"}
        description={"Code Formatter re-indents JSON, CSS and HTML entirely in your browser. JSON is validated and re-indented from your original text, so every number (including 20-digit ids and values like 1.10), escape and key order stays exactly as written. CSS and HTML are formatted by js-beautify, the engine of beautifier.io: strings, data: URLs, comments, and the contents of <pre>, <textarea>, <script> and <style> are kept intact."}
        howTo={[
          "Choose JSON, CSS or HTML.",
          "Paste your code into the input box.",
          "Click 'Format'.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "Is Code Formatter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does formatting change my data or code?", a: "No — only whitespace and line breaks change. JSON numbers are not re-serialized, so large integers and trailing zeros are preserved." },
          { q: "What happens with invalid JSON?", a: "The parser's error message is shown instead of output." },
          { q: "Is my code uploaded to a server?", a: "No — everything runs in your browser; the engine is downloaded once when you first click." }
        ]}
        tips={[
          "For JavaScript, use the JavaScript Formatter.",
          "Minified CSS or HTML becomes readable in one click."
        ]}
      />
    </div>
  );
}