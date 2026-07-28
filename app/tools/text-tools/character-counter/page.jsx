'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function CharacterCounterPage() {
  const [text, setText] = useState('');
  const chars = text.length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const numbers = (text.match(/[0-9]/g) || []).length;
  const spaces = (text.match(/\s/g) || []).length;
  const special = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Character Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count characters in real time</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{chars}</div><div className="text-neutral-400 text-sm mt-1">Total Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{letters}</div><div className="text-neutral-400 text-sm mt-1">Letters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{numbers}</div><div className="text-neutral-400 text-sm mt-1">Numbers</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{spaces}</div><div className="text-neutral-400 text-sm mt-1">Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{special}</div><div className="text-neutral-400 text-sm mt-1">Special</div></div>
          </div>
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
      <SeoContent
        title="Character Counter"
        description="Character Counter instantly breaks down any text into total characters, letters, numbers, spaces, and special characters, updating live as you type — entirely in your browser."
        howTo={[
          "Paste or type your text into the input box.",
          "Watch the five counts update in real time as you type: Total Characters, Letters, Numbers, Spaces, and Special.",
          "Edit your text and the counts refresh automatically.",
          "Click \"Clear\" to reset the text box and start over."
        ]}
        faqs={[
          { q: "Is Character Counter free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it count words, sentences, or paragraphs?", a: "No — this tool breaks text down into characters, letters, numbers, spaces, and special characters only. For word or sentence counts, use the Word Counter tool instead." },
          { q: "Can I exclude spaces from the count?", a: "Not as a toggle — spaces are always shown as their own separate count alongside the total." },
          { q: "Is there a maximum text length?", a: "No hard limit is enforced — very long text is limited only by your browser's performance." }
        ]}
        tips={[
          "Use the \"Total Characters\" number to check against platform limits like social media post length.",
          "The \"Special\" count includes punctuation and symbols — handy for spotting stray characters in data you're cleaning up.",
          "For word or sentence counts and reading time estimates, use the dedicated Word Counter tool.",
          "Click \"Clear\" between texts rather than manually selecting and deleting to reset all five counts at once."
        ]}
      />
    </div>
  );
}