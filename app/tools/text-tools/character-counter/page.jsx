'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { countCharacters } from '../../../lib/textTools';
import TextArea from '@/app/components/TextArea';

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const c = countCharacters(text);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Character Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count characters in real time</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.characters}</div><div className="text-neutral-400 text-sm mt-1">Total Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.letters}</div><div className="text-neutral-400 text-sm mt-1">Letters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.digits}</div><div className="text-neutral-400 text-sm mt-1">Digits</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.spaces}</div><div className="text-neutral-400 text-sm mt-1">Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.other}</div><div className="text-neutral-400 text-sm mt-1">Other symbols</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.charactersNoSpaces}</div><div className="text-neutral-400 text-sm mt-1">Without spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.lines}</div><div className="text-neutral-400 text-sm mt-1">Lines</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.utf16Units}</div><div className="text-neutral-400 text-sm mt-1">UTF-16 units</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{c.utf8Bytes}</div><div className="text-neutral-400 text-sm mt-1">UTF-8 bytes</div></div>
          </div>
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
      <SeoContent
        title={"Character Counter"}
        description={"Character Counter shows nine counts for the text you type or paste: total characters, letters, digits, spaces, other symbols, characters without spaces, lines, UTF-16 code units and UTF-8 bytes. Characters are counted as you see them, so an emoji with a skin tone, a flag, or an accent typed as a separate mark counts as one. Use it to check a text against a character limit, or the byte size a field will store. It only counts: it does not edit, save or send the text, and it runs in your browser."}
        example={{
          caption: "Two lines of text. The line break is one of the 3 spaces, and 👍🏽 is one character but 4 UTF-16 units and 8 bytes.",
          inputLabel: "Text",
          input: "Café 👍🏽 #1\nok",
          outputLabel: "Counts shown",
          output: "Total Characters: 12\nLetters: 6\nDigits: 1\nSpaces: 3\nOther symbols: 2\nWithout spaces: 9\nLines: 2\nUTF-16 units: 15\nUTF-8 bytes: 20",
        }}
        howToTitle={"How to count characters in a text"}
        howTo={[
          "Paste the text whose length you need to check, or type it in the box.",
          "Read the nine counts under it; they change with every keystroke.",
          "Compare \"UTF-16 units\" with a web form's maxlength, or \"UTF-8 bytes\" with a limit expressed in bytes.",
          "Click \"Clear\" to empty the box."
        ]}
        specs={[
          { label: "Counts", value: "Total Characters, Letters, Digits, Spaces, Other symbols, Without spaces, Lines, UTF-16 units, UTF-8 bytes" },
          { label: "Spaces", value: "Every whitespace character, tabs and line breaks included" },
          { label: "Lines", value: "Zero for an empty box; a line break at the very end adds one more, empty line" },
          { label: "Digits", value: "Digits of every script, and number signs such as ½ or ²" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"The counts are recalculated by JavaScript inside this page on each keystroke; the text never leaves your device and is not saved, so a reload empties the box. The page has no error message of its own; if it ever crashed, our error log would receive the error message, the tool name and your browser's name and version, without your text."}
        faqs={[
          { q: "Does the character count include spaces?", a: "Yes. \"Total Characters\" includes spaces, tabs and line breaks, while \"Without spaces\" leaves all of them out. The \"Spaces\" count covers every kind of whitespace, so a text written on two lines always has at least one: the line break." },
          { q: "How are emoji and accents counted?", a: "One each, as they appear: 👍🏽 and 👨‍👩‍👧 each count as one character, and so does é typed as e plus a combining accent. This relies on Intl.Segmenter, which Firefox has had since version 125; older Firefox versions count code points instead, so 👨‍👩‍👧 counts as 5 there." },
          { q: "Is a form's maxlength the same as Total Characters?", a: "No. JavaScript and the maxlength of web forms count UTF-16 code units: a plain letter is 1, but 👍🏽 is 4. A limit set in bytes, as in some databases, file formats and APIs, matches \"UTF-8 bytes\", where é takes 2 and 👍🏽 takes 8." },
          { q: "Are letters from other alphabets counted as letters?", a: "Yes. é, ß, я, 日 and every other Unicode letter count as letters, and digits of any script count as digits, as do signs like ½ or ². Emoji, punctuation and symbols such as # go to \"Other symbols\"." }
        ]}
        tips={[
          "To count words, sentences and reading time on the same text, paste it into Word Counter."
        ]}
      />
    </div>
  );
}