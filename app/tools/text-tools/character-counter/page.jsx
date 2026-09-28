'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { countCharacters } from '../../../lib/textTools';

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const c = countCharacters(text);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Character Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count characters in real time</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
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
        description={"Character Counter breaks text down into characters, letters, digits, spaces and other symbols, updating live as you type, entirely in your browser. It counts characters the way you see them: an emoji (even a family or a flag), an accented letter written with a combining accent, or a Hindi syllable is one character, not two to eleven code units. Letters and digits of every script count as letters and digits, not as special characters. It also shows the length in UTF-16 code units (what JavaScript and many form limits count) and in UTF-8 bytes (what databases and SMS encodings count)."}
        howTo={[
          "Type or paste your text into the box.",
          "Read the counts, which update as you type.",
          "Compare 'UTF-16 units' or 'UTF-8 bytes' with the limit of the system you're writing for.",
          "Click 'Clear' to start again."
        ]}
        faqs={[
          { q: "Is Character Counter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How are emoji counted?", a: "As one character each, like on your screen — 👍🏽 or 👨‍👩‍👧 count as 1, even though they are made of several code points." },
          { q: "Are accented and non-Latin letters counted as letters?", a: "Yes — é, ß, я, 日 and every other letter count as letters; digits of any script count as digits." },
          { q: "Why are there three different lengths?", a: "Characters is what you see; UTF-16 units is what JavaScript's .length and many web forms count; UTF-8 bytes is the storage size used by most databases and files." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Use 'UTF-16 units' to check a limit enforced by a web form or an API written in JavaScript.",
          "Line count includes the last line even without a final line break."
        ]}
      />
    </div>
  );
}