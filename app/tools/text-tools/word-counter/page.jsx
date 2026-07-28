'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function WordCounterPage() {
  const [text, setText] = useState('');
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim()).length;
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n+/).filter(p => p.trim()).length;
  const readingTime = Math.ceil(words / 200);
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Word Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count words, characters and sentences</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{words}</div><div className="text-neutral-400 text-sm mt-1">Words</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{characters}</div><div className="text-neutral-400 text-sm mt-1">Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{charactersNoSpaces}</div><div className="text-neutral-400 text-sm mt-1">No Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{sentences}</div><div className="text-neutral-400 text-sm mt-1">Sentences</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{paragraphs}</div><div className="text-neutral-400 text-sm mt-1">Paragraphs</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{readingTime}</div><div className="text-neutral-400 text-sm mt-1">Min Read</div></div>
          </div>
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
      <SeoContent
        title="Word Counter"
        description="Word Counter instantly analyzes text for word count, character count (with and without spaces), sentence count, paragraph count, and estimated reading time, updating live as you type — entirely in your browser."
        howTo={[
          "Paste or type your text into the main text box.",
          "Watch the six stats update in real time: Words, Characters, No Spaces, Sentences, Paragraphs, and Min Read.",
          "Edit your text and the counts refresh automatically.",
          "Click \"Clear\" to reset the text box and start over."
        ]}
        faqs={[
          { q: "Is Word Counter free to use?", a: "Yes, it's completely free with no signup and unlimited use." },
          { q: "Is my data saved?", a: "No, everything is processed locally in your browser — your text is never sent to a server." },
          { q: "Can I use it for academic essays?", a: "Yes, it's well suited for checking word count requirements for assignments and applications." },
          { q: "Does it provide keyword density analysis?", a: "No — it covers word count, character count, sentence count, paragraph count, and reading time only." }
        ]}
        tips={[
          "Use the \"Min Read\" estimate (based on 200 words per minute) to gauge how long your content will take readers to get through.",
          "Check \"Characters\" against social media limits, since some platforms count characters rather than words.",
          "Paste from Google Docs, Word, or any editor to instantly see stats for an existing document.",
          "Watch the \"Sentences\" count while editing to catch run-on sentences in longer pieces of writing."
        ]}
      />
    </div>
  );
}