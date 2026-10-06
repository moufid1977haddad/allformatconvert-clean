'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { sentenceCase, titleCase, capitalizedCase, graphemes } from '../../../lib/textSegments';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

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
  const wordsOf = (line) => line.normalize('NFC').replace(/(\p{L})['’](\p{L})/gu, '$1$2').replace(/([\p{Ll}\p{N}]\p{M}*)(\p{Lu})/gu, '$1 $2').replace(/(\p{Lu}+)(\p{Lu}\p{M}*\p{Ll})/gu, '$1 $2').split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
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
        <p className="text-neutral-500 text-center mb-8">Convert text to 12 letter and programming cases</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
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
          <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(text).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
          {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
          <TextDownload text={text} name="converted.txt" />
        </div>
      </div>
      <SeoContent
        title="Case Converter"
        description={"Case Converter rewrites the text in its box in one of twelve letter cases: UPPERCASE, lowercase, Title Case, Capitalized Case, Sentence case, aLtErNaTe, iNVERSE, and the programming cases camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE. Use it to fix text typed with caps lock on, format headings, or name variables and files. Each button converts the text in place, with no undo. It does not recognize proper nouns, so Sentence case writes friday rather than Friday. Nothing leaves the page: your browser applies its own Unicode letter rules."}
        example={{
          caption: "Title Case on a heading typed in capitals: short words stay lower-case and NASA is kept as an acronym.",
          inputLabel: "Text",
          input: "THE LORD OF THE RINGS: A NASA REVIEW",
          outputLabel: "After \"Title Case\"",
          output: "The Lord of the Rings: A NASA Review",
        }}
        howToTitle={"How to change text case"}
        howTo={[
          "Paste the text to fix, for example a heading typed with caps lock on.",
          "Click a case button, for example \"Sentence case\", \"Title Case\" or \"snake_case\"; the box is rewritten at once.",
          "To try another case on the original wording, paste it again, since each button converts what the box holds now.",
          "Copy the converted text with \"Copy\", or keep it as converted.txt with \"Download\"."
        ]}
        specs={[
          { label: "Input", value: "Typed or pasted text" },
          { label: "Text cases", value: "UPPERCASE, lowercase, Title Case, Capitalized Case, Sentence case, aLtErNaTe, iNVERSE" },
          { label: "Programming cases", value: "camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE; each line converted on its own" },
          { label: "Output", value: "The same box; Copy, or Download as converted.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Every case is computed by JavaScript in this page, with your browser's Unicode rules for letters and sentences. The text you paste is never sent to us or to anyone else, and it is gone when you close the tab."}
        faqs={[
          { q: "What is the difference between Title Case and Capitalized Case?", a: "Title Case keeps short words such as a, the, of, in or to in lower case unless they open or close the title, while Capitalized Case capitalizes every word. The short words come from a fixed list, so through or between are capitalized. Both keep words like iPhone, and in a text typed all in capitals only known acronyms such as NASA, PDF or USA stay in capitals." },
          { q: "Does Sentence case capitalize after every period?", a: "No. It capitalizes the first word of the text, of each line, and after ! or ?, and after a period when the next word already starts with a capital. After a period followed by a lower-case word, as in hello world. this is, the word stays lower-case, because Unicode sentence rules read that period as an abbreviation." },
          { q: "Can I fix text typed with caps lock on?", a: "Yes. Click \"Sentence case\": a sentence written mostly in capitals is lowered, then its first letter is raised; known acronyms such as NASA, USA or PDF keep their capitals, and i, i'm or i'll become I, I'm, I'll. For text like hELLO wORLD, \"iNVERSE\" gives Hello World." },
          { q: "Does snake_case split words joined together, like myHTTPServer?", a: "Yes, at changes of case as well as at spaces and punctuation: myHTTPServer becomes my_http_server. Apostrophes inside a word are dropped, so don't stop becomes dont_stop, accented letters are kept (café_crème), and every line is converted separately." }
        ]}
        tips={[
          "Paste a column of names copied from a spreadsheet to turn them all into kebab-case or snake_case at once, one per line."
        ]}
      />
    </div>
  );
}