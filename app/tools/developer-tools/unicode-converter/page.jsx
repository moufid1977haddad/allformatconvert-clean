'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import TextArea from '@/app/components/TextArea';
export default function UnicodeConverterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const toUnicode = () => setOutput(input.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4,'0')).join(''));
  // P24 review (03/10): the ES6 form \u{1F600} (and U+1F600) was left as it was, without a word
  const fromUnicode = () => setOutput(input
    .replace(/\\u\{([0-9a-fA-F]{1,6})\}|U\+([0-9a-fA-F]{4,6})\b/g, (m, a, b) => { const cp = parseInt(a || b, 16); return cp <= 0x10ffff ? String.fromCodePoint(cp) : m; })
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16))));
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Unicode Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to Unicode escapes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Enter text or unicode..." value={input} onChange={e => setInput(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={toUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">To Unicode</button>
            <button onClick={fromUnicode} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">From Unicode</button>
          </div>
          {output && <div className="space-y-2"><TextArea aria-label="Result" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
          <TextDownload text={output} name="converted.txt" /><button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button></div>}
        </div>
      </div>
      <SeoContent
        title={"Unicode Converter"}
        description={"Unicode Converter writes every character of your text as a \\uXXXX escape, the form used in JavaScript, JSON and Java string literals, and turns escapes back into text. To Unicode escapes all characters, plain ASCII letters included, in lowercase hex; a character above U+FFFF, such as the emoji 😀, becomes two escapes (a UTF-16 surrogate pair), while ☕ (U+2615) takes one. From Unicode reads \\uXXXX, the ES2015 form \\u{1F600} and U+1F600 code points, and leaves any other text as it is. It does not produce UTF-8 bytes or HTML entities, and needs no server."}
        example={{
          caption: "A letter, an accented letter and an emoji escaped with To Unicode, then three escape styles read with From Unicode:",
          inputLabel: "Input",
          input: "Aé😀\n\n\\u0041 \\u{1F600} U+00E9",
          outputLabel: "Result",
          output: "To Unicode: \\u0041\\u00e9\\ud83d\\ude00\n\nFrom Unicode: A 😀 é",
        }}
        howToTitle={"How to convert text to \\uXXXX escapes"}
        howTo={[
          "Paste text, or escapes such as \\u00e9, \\u{1F600} or U+00E9.",
          "Click \"To Unicode\" to escape every character, or \"From Unicode\" to turn escapes back into text.",
          "Copy the line with \"Copy\"; \"Download\" writes it to converted.txt."
        ]}
        specs={[
          { label: "To Unicode output", value: "One \\uXXXX per UTF-16 code unit, lowercase hex, no separators" },
          { label: "Read by From Unicode", value: "\\uXXXX; \\u{…} with one to six hex digits; U+ (capital U) followed by four to six hex digits" },
          { label: "Not handled", value: "UTF-8 bytes (see Hex to Text) and HTML entities (see HTML Entity Decoder)" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Both buttons run a short script inside this page: your text is not sent to a server and is not saved. The converter has no error messages of its own; if the page fails, for instance when the browser refuses a copy, we receive the error, the tool's name and your browser's name and version, never the text you pasted."}
        faqs={[
          { q: "How many \\u escapes does an emoji take?", a: "Two for emoji above U+FFFF, such as 😀 (\\ud83d\\ude00), which JavaScript stores as a surrogate pair; one for older emoji in the basic plane, such as ☕ (\\u2615). From Unicode joins a pair back into one character." },
          { q: "Can it read \\u{1F600} or U+1F600?", a: "Yes. Besides \\uXXXX, From Unicode reads the ES2015 \\u{…} form and U+ code points with four to six hex digits. A lowercase u+ is not recognized and stays as typed." },
          { q: "Does To Unicode escape plain letters too?", a: "Yes. Every character is escaped, ASCII included, so A becomes \\u0041 and the whole output is plain ASCII. Paste only the characters that need escaping if you want ordinary letters to stay readable around them." },
          { q: "Is this the same as UTF-8?", a: "No. \\uXXXX numbers are UTF-16 code units: é is \\u00e9, while its UTF-8 bytes are c3 a9. To see or decode bytes, use Hex to Text." }
        ]}
        tips={[
          "The output of To Unicode can go inside a JSON string, where \\uXXXX escapes are valid as they are."
        ]}
      />
    </div>
  );
}