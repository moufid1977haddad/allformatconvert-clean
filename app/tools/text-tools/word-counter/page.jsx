'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { countWords, countSentences, graphemes } from '../../../lib/textSegments';
import KeywordDensity from '../../../components/KeywordDensity';
import TextArea from '@/app/components/TextArea';

export default function WordCounterPage() {
  const [text, setText] = useState('');
  // Words, characters and sentences as a reader counts them (see lib/textSegments.js): an emoji is one
  // character, Japanese and Chinese are split into words, "Mr." and "3.50" do not end a sentence.
  const words = countWords(text);
  const chars = graphemes(text);
  const characters = chars.length;
  const charactersNoSpaces = chars.filter((c) => !/^\s+$/.test(c)).length;
  const sentences = countSentences(text);
  const paragraphs = text.trim() === '' ? 0 : text.split(/\n+/).filter(p => p.trim()).length;
  const readingTime = Math.ceil(words / 200);
  const speakingTime = Math.ceil(words / 130); // P24: speaking time at 130 words a minute, as wordcounter.net shows it
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Word Counter</h1>
        <p className="text-neutral-500 text-center mb-8">Count words, characters and sentences</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Type or paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{words}</div><div className="text-neutral-400 text-sm mt-1">Words</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{characters}</div><div className="text-neutral-400 text-sm mt-1">Characters</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{charactersNoSpaces}</div><div className="text-neutral-400 text-sm mt-1">No Spaces</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{sentences}</div><div className="text-neutral-400 text-sm mt-1">Sentences</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{paragraphs}</div><div className="text-neutral-400 text-sm mt-1">Paragraphs</div></div>
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center"><div className="text-3xl font-bold text-indigo-400">{readingTime}</div><div className="text-neutral-400 text-sm mt-1">Min Read</div></div>
          </div>
          <p className="text-sm text-neutral-600 text-center" data-speaking>About {speakingTime} min to say aloud (130 words a minute); reading time at 200 words a minute.</p>
          <KeywordDensity text={text} />
          <button onClick={() => setText('')} className="w-full bg-neutral-200 hover:bg-neutral-200 rounded-xl py-2 font-semibold transition">Clear</button>
        </div>
      </div>
      <SeoContent
        title="Word Counter"
        description={"Word Counter counts the words, characters with and without spaces, sentences and paragraphs of a text as you type, and estimates reading time at 200 words a minute and speaking time at 130. Below the counts, a keyword density table lists the most frequent words, or repeated two- and three-word phrases, with their share of all words. It relies on your browser's Unicode segmentation, so Chinese, Japanese and Thai are split into words and Mr. or 3.50 do not end a sentence. It only counts, and it runs in your browser."}
        example={{
          caption: "Mr. and 3.50 do not end a sentence, so there are 3 sentences; $ alone is not a word.",
          inputLabel: "Text",
          input: "Mr. Smith paid $3.50 for coffee. He liked it!\n\nThe next day he came back.",
          outputLabel: "Counts shown",
          output: "Words: 15\nCharacters: 73\nNo Spaces: 58\nSentences: 3\nParagraphs: 2\nMin Read: 1\nAbout 1 min to say aloud",
        }}
        howToTitle={"How to count words in a text"}
        howTo={[
          "Paste your essay, article or post into the box, or start typing.",
          "Read \"Words\", \"Characters\", \"No Spaces\", \"Sentences\", \"Paragraphs\" and \"Min Read\"; they update with each change.",
          "Under the counts, switch the keyword table from \"1 word\" to two- or three-word phrases, or untick \"Leave out common English words\" to include the, and, of.",
          "Click \"Clear\" to empty the box and start again."
        ]}
        specs={[
          { label: "Counts", value: "Words, Characters, No Spaces, Sentences, Paragraphs, Min Read, speaking time" },
          { label: "Reading speed", value: "Min Read = words ÷ 200, rounded up; speaking time = words ÷ 130, rounded up" },
          { label: "Paragraphs", value: "Every non-empty line counts, so a single line break starts a new paragraph" },
          { label: "Keyword density", value: "Up to 15 rows; phrases shown only when used more than once; 56 common English words can be left out" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Words, sentences and characters are found by Intl.Segmenter, the text segmentation built into your browser, and every count is recomputed inside the page on each keystroke. Your text is not sent or saved: reloading the page clears it. The page has no copy or download button, so the counts stay on your screen."}
        faqs={[
          { q: "Does Characters include spaces and line breaks?", a: "Yes. \"Characters\" counts everything you typed, spaces and line breaks included, with each emoji counted once. \"No Spaces\" leaves out every kind of whitespace. For letters, digits or byte size, use Character Counter." },
          { q: "How is reading time calculated?", a: "200 words a minute, rounded up: \"Min Read\" is the word count divided by 200, so any text up to 200 words shows 1. The speaking time under the counts uses 130 words a minute, rounded up the same way." },
          { q: "Is a number or a hyphenated word counted as one word?", a: "Yes for numbers: 3.50 is one word. Hyphenated words follow the Unicode word rules of your browser, which split well-known into two words. A symbol such as $ or & alone is not a word." },
          { q: "Can I see keyword density?", a: "Yes. The table below the counts lists up to 15 words or phrases with the number of uses and their share of all words. Two- and three-word phrases appear only when used more than once, and the, and, of and similar words can be left out." },
          { q: "Does it count the same way in every browser?", a: "No. Firefox before version 125 has no Intl.Segmenter, so there a run of Chinese, Japanese or Thai text counts as one word and an emoji with a skin tone counts as two characters. Current Chrome, Edge, Safari and Firefox give the counts described here." }
        ]}
      />
    </div>
  );
}