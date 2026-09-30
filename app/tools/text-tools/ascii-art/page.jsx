'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import figlet from 'figlet';

// Each font is loaded only when chosen (FIGlet fonts, figlet npm package, MIT).
const FONTS = {
  Standard: () => import('figlet/importable-fonts/Standard.js'),
  Big: () => import('figlet/importable-fonts/Big.js'),
  Slant: () => import('figlet/importable-fonts/Slant.js'),
  Small: () => import('figlet/importable-fonts/Small.js'),
  Banner: () => import('figlet/importable-fonts/Banner.js'),
  Block: () => import('figlet/importable-fonts/Block.js'),
  Doom: () => import('figlet/importable-fonts/Doom.js'),
  Shadow: () => import('figlet/importable-fonts/Shadow.js'),
  'ANSI Shadow': () => import('figlet/importable-fonts/ANSI Shadow.js'),
  '3-D': () => import('figlet/importable-fonts/3-D.js'),
};

export default function AsciiArtPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [copyError, setCopyError] = useState(false);
  const [font, setFont] = useState('Standard');
  const [note, setNote] = useState('');
  const generate = async () => {
    const mod = await FONTS[font]();
    figlet.parseFont(font, mod.default);
    // figlet silently skips a character its font lacks: say which ones.
    const missing = [...new Set(Array.from(text))].filter(ch => ch.trim() && !figlet.textSync(ch, { font }).trim());
    setNote(missing.length ? `Not in this font, left out: ${missing.join(' ')}` : '');
    setResult(figlet.textSync(text, { font }));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ASCII Art Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to ASCII art</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4" placeholder="Type your text here..." maxLength={60} />
          <select value={font} onChange={e => setFont(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3" aria-label="Font">{Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}</select>
          {note && <p className="text-amber-600 text-sm text-center">{note}</p>}
          <button onClick={generate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Generate</button>
          {result && (
            <div className="space-y-2">
              <pre className="w-full bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-xs font-mono overflow-x-auto">{result}</pre>
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => setCopyError(true)); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"ASCII Art Generator"}
        description={"ASCII Art Generator turns text into large ASCII-art letters with FIGlet, the classic banner engine (the one behind patorjk.com's generator), entirely in your browser. Letters, digits, punctuation and accented Latin letters are supported, in ten fonts (Standard, Big, Slant, Small, Banner, Block, Doom, Shadow, ANSI Shadow and 3-D). If a character isn't in the chosen font, the tool says which one instead of silently dropping it. This tool converts text, not images."}
        howTo={[
          "Type your text (up to 60 characters).",
          "Choose a font.",
          "Click 'Generate'.",
          "Copy the result and paste it where a monospaced font is used (code, terminal, README)."
        ]}
        faqs={[
          { q: "Is ASCII Art Generator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Which characters are supported?", a: "All printable ASCII — letters, digits and punctuation — and, in most fonts, accented Latin letters. Anything a font lacks is listed under the result." },
          { q: "Why does it look wrong in my document?", a: "ASCII art needs a monospaced font such as Courier or Consolas; paste it into a code block." },
          { q: "Is my text uploaded to a server?", a: "No — everything happens in your browser." }
        ]}
        tips={[
          "Short words look best; wide fonts such as Big or Banner can exceed a terminal's 80 columns.",
          "Try several fonts: Slant and ANSI Shadow suit headers, Small suits narrow spaces."
        ]}
      />
    </div>
  );
}