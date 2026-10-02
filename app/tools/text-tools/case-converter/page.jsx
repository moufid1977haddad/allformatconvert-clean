'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sentenceCase, titleCase, capitalizedCase, graphemes } from '../../../lib/textSegments';
import { TextDownload } from '../../../components/FileDownload';

export default function CaseConverterPage() {
  const [text, setText] = useState('');
  const [copyError, setCopyError] = useState(false);
  const toUpper = () => setText(text.toUpperCase());
  const toLower = () => setText(text.toLowerCase());
  const toTitle = () => setText(titleCase(text));
  const toCapitalized = () => setText(capitalizedCase(text));
  const toSentence = () => setText(sentenceCase(text));
  const toAlternate = () => setText(graphemes(text).map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''));
  // P24 (03/10): convertcase.net also writes the programming cases (camelCase, PascalCase, snake_case, kebab-case,
  // CONSTANT_CASE) and iNVERSE. Words are split on spaces, punctuation and case changes (myHTTPServer → my HTTP Server),
  // letters of every alphabet kept (café crème → café_crème); each line is converted on its own.
  const wordsOf = (line) => line.replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  const byLine = (f) => setText(text.split(/(\r?\n)/).map((part) => (/^\r?\n$/.test(part) ? part : f(wordsOf(part)))).join(''));
  const toCamel = () => byLine((w) => w.map((x, i) => (i ? cap(x) : x.toLowerCase())).join(''));
  const toPascal = () => byLine((w) => w.map(cap).join(''));
  const toSnake = () => byLine((w) => w.map((x) => x.toLowerCase()).join('_'));
  const toKebab = () => byLine((w) => w.map((x) => x.toLowerCase()).join('-'));
  const toConstant = () => byLine((w) => w.map((x) => x.toUpperCase()).join('_'));
  const toInverse = () => setText(graphemes(text).map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join(''));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Case Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to any case format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <button onClick={toUpper} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">UPPERCASE</button>
            <button onClick={toLower} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">lowercase</button>
            <button onClick={toTitle} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Title Case</button>
            <button onClick={toCapitalized} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Capitalized Case</button>
            <button onClick={toSentence} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">Sentence case</button>
            <button onClick={toAlternate} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">aLtErNaTe</button>
            <button onClick={toInverse} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white">iNVERSE</button>
            <button onClick={toCamel} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white font-mono">camelCase</button>
            <button onClick={toPascal} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white font-mono">PascalCase</button>
            <button onClick={toSnake} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white font-mono">snake_case</button>
            <button onClick={toKebab} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white font-mono">kebab-case</button>
            <button onClick={toConstant} className="bg-indigo-600 hover:bg-indigo-500 rounded-xl py-2 font-semibold transition text-white font-mono">CONSTANT_CASE</button>
            <button onClick={() => setText('')} className="bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
          </div>
          <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(text).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
          {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
          <TextDownload text={text} name="converted.txt" />
        </div>
      </div>
      <SeoContent
        title="Case Converter"
        description="Case Converter transforms text between UPPERCASE, lowercase, Title Case, Capitalized Case, Sentence case, and aLtErNaTe (toggle) case, entirely in your browser. Sentence case capitalises every sentence (not just the first), restores the pronoun “I”, and keeps acronyms like NASA and brand names like iPhone; Title Case keeps short words such as “of” and “the” lower-case, as style guides do."
        howTo={[
          "Paste or type your text into the text box.",
          "Click a case button: UPPERCASE, lowercase, Title Case, Capitalized Case, Sentence case, aLtErNaTe, iNVERSE, or a programming case (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE).",
          "The text box updates immediately with the converted result.",
          "Click \"Copy\" to copy the converted text to your clipboard."
        ]}
        faqs={[
          { q: "Is Case Converter free to use?", a: "Yes, it's completely free with no signup and no limit on conversions." },
          { q: "What case formats does this tool support?", a: "UPPERCASE, lowercase, Title Case (short words like \"of\" and \"the\" stay lower-case), Capitalized Case (every word capitalised), Sentence case, iNVERSE (each letter's case swapped), the programming cases camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE, and aLtErNaTe (alternating) case. camelCase, PascalCase, snake_case, and kebab-case aren't currently included." },
          { q: "Can I convert multiple texts at once?", a: "No, one text block is converted at a time — repeat the process for additional texts." },
          { q: "Is my data private?", a: "Yes, everything happens locally in your browser — what you enter is never sent to a server." }
        ]}
        tips={[
          "Use Title Case for headlines and headings to keep formatting consistent.",
          "Apply Sentence case when cleaning up text pasted from all-caps sources.",
          "For variable and file names, use camelCase, PascalCase, snake_case, kebab-case or CONSTANT_CASE: each line is converted on its own.",
          "Copy the converted text right away, since clicking a different case button overwrites the current result."
        ]}
      />
    </div>
  );
}