'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import figlet from 'figlet';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';

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
              <button onClick={() => { setCopyError(false); navigator.clipboard.writeText(result).catch(() => { setCopyError(true); reportShownMessage('Copy to the clipboard failed.'); }); }} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition text-white">Copy</button>
              {copyError && <p className="text-red-400 text-center text-sm">Copy failed</p>}
              <TextDownload text={result} name="ascii-art.txt" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"ASCII Art Generator"}
        description={"ASCII Art Generator draws a word or a short phrase as a large text banner in the FIGlet format, using the figlet library by Patrick Gillespie, the author of patorjk.com. You type up to 60 characters on one line, choose one of ten fonts, and get plain text to paste into a README, a code comment or a terminal greeting. When the chosen font lacks a character, a note names it instead of dropping it silently. It draws text only, not pictures, and it all happens in your browser."}
        example={{
          caption: "The text Hi! in the Standard font, exactly as the tool returns it. It lines up only in a monospaced font.",
          inputLabel: "Text (Font: Standard)",
          input: "Hi!",
          outputLabel: "Result",
          output: "  _   _ _ _ \n | | | (_) |\n | |_| | | |\n |  _  | |_|\n |_| |_|_(_)\n            ",
        }}
        howToTitle={"How to make ASCII art from text"}
        howTo={[
          "Type your text in the box; it takes up to 60 characters on one line.",
          "Pick a font in the \"Font\" dropdown: Standard, Big, Slant, Small, Banner, Block, Doom, Shadow, ANSI Shadow or 3-D.",
          "Click \"Generate\"; if the font lacks a character, a note above the button starts with \"Not in this font, left out\".",
          "Click \"Copy\" to paste the banner where a monospaced font is used, or \"Download\" to save it as ascii-art.txt."
        ]}
        specs={[
          { label: "Input", value: "Text typed on one line, up to 60 characters" },
          { label: "Fonts", value: "Standard, Big, Slant, Small, Banner, Block, Doom, Shadow, ANSI Shadow, 3-D" },
          { label: "Accented letters", value: "Standard: the French, German, Spanish, Portuguese and Scandinavian accented letters we tried, Ÿ and œ included; Big, Slant, Small, Block, Shadow: the same except œ, Œ and Ÿ; Banner, Doom: only Ä Ö Ü ä ö ü ß; ANSI Shadow, 3-D: none" },
          { label: "ANSI Shadow", value: "Capitals only, drawn with Unicode block characters such as █ and ╗, and it lacks nine punctuation signs, among them + = { } and ~" },
          { label: "Output", value: "A multi-line text banner; Copy, or Download as ascii-art.txt" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"The banner is drawn by JavaScript running in this page. Each of the ten fonts is a file of this site, fetched the first time you generate with it; your text is not part of that request and is never sent anywhere. If copying to the clipboard fails, our error log receives the message \"Copy to the clipboard failed.\" with the tool name and your browser's name and version, never your text."}
        faqs={[
          { q: "Does every font support accented letters?", a: "No. Standard draws every French, German, Spanish, Portuguese and Scandinavian accented letter we tried; Big, Slant, Small, Block and Shadow lack œ, Œ and Ÿ; Banner and Doom have just the German Ä, Ö, Ü, ä, ö, ü and ß; ANSI Shadow and 3-D have none. Any character the font lacks is named above the Generate button." },
          { q: "Will the banner line up in an email or a Word document?", a: "No, not in a proportional font such as Arial or Calibri, where letters have different widths. Paste it into a code block, a terminal, or text set in Courier, Consolas or Menlo. ANSI Shadow also needs a font that has Unicode block characters." },
          { q: "Can I make the banner narrower?", a: "Yes. Pick a narrower font or shorten the text, since every character widens each line. In our test on the words HELLO WORLD, Small gave the narrowest banner of the ten fonts, and Block and 3-D the widest." }
        ]}
        tips={[
          "In a Markdown README, put the banner between two lines of three backticks so it keeps its spacing."
        ]}
      />
    </div>
  );
}