'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';

const CHARS = {
  A: ['  #  ',' # # ','#####','#   #','#   #'],
  B: ['#### ','#   #','#### ','#   #','#### '],
  C: [' ####','#    ','#    ','#    ',' ####'],
  D: ['#### ','#   #','#   #','#   #','#### '],
  E: ['#####','#    ','#### ','#    ','#####'],
  F: ['#####','#    ','#### ','#    ','#    '],
  G: [' ####','#    ','#  ##','#   #',' ####'],
  H: ['#   #','#   #','#####','#   #','#   #'],
  I: ['#####','  #  ','  #  ','  #  ','#####'],
  J: ['#####','   # ','   # ','#  # ',' ##  '],
  K: ['#   #','#  # ','###  ','#  # ','#   #'],
  L: ['#    ','#    ','#    ','#    ','#####'],
  M: ['#   #','## ##','# # #','#   #','#   #'],
  N: ['#   #','##  #','# # #','#  ##','#   #'],
  O: [' ### ','#   #','#   #','#   #',' ### '],
  P: ['#### ','#   #','#### ','#    ','#    '],
  Q: [' ### ','#   #','# # #','#  # ',' ## #'],
  R: ['#### ','#   #','#### ','#  # ','#   #'],
  S: [' ####','#    ',' ### ','    #','#### '],
  T: ['#####','  #  ','  #  ','  #  ','  #  '],
  U: ['#   #','#   #','#   #','#   #',' ### '],
  V: ['#   #','#   #','#   #',' # # ','  #  '],
  W: ['#   #','#   #','# # #','## ##','#   #'],
  X: ['#   #',' # # ','  #  ',' # # ','#   #'],
  Y: ['#   #',' # # ','  #  ','  #  ','  #  '],
  Z: ['#####','   # ','  #  ',' #   ','#####'],
  ' ': ['     ','     ','     ','     ','     '],
};

export default function AsciiArtPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  const generate = () => {
    const upper = text.toUpperCase();
    const rows = ['','','','',''];
    upper.split('').forEach(char => {
      const pattern = CHARS[char] || CHARS[' '];
      pattern.forEach((row, i) => { rows[i] += row + ' '; });
    });
    setResult(rows.join('\n'));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ASCII Art Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Convert text to ASCII art</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4" placeholder="Type your text here..." maxLength={10} />
          <button onClick={generate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Generate</button>
          {result && (
            <div className="space-y-2">
              <pre className="w-full bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-xs font-mono overflow-x-auto">{result}</pre>
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="ASCII Art Generator"
        description="ASCII Art Generator turns short typed text into large block-letter banners built from # and space characters, entirely in your browser. Note: this tool converts text, not images — it uses a built-in 5×5 font for uppercase letters A–Z, with a 10-character input limit."
        howTo={[
          "Type up to 10 characters into the input field.",
          "Click \"Generate\" to render your text as block letters.",
          "Review the ASCII banner in the output box.",
          "Click \"Copy\" to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Does this convert images into ASCII art?", a: "No — it converts short typed text into block-letter banners using a built-in font, not photos or images." },
          { q: "What characters are supported?", a: "Letters A–Z (automatically capitalized) and spaces. Numbers and punctuation aren't in the built-in font and will render as blank space." },
          { q: "Is there a length limit?", a: "Yes, input is limited to 10 characters, since each character becomes a 5-row-tall block letter." },
          { q: "Is my data private?", a: "Yes, the banner is generated entirely in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "Keep your text short — 3 to 6 letters produce the clearest, most readable banners.",
          "Use it for quick plain-text headers in code comments, README files, or terminal output.",
          "Numbers and symbols aren't supported yet — stick to letters for a complete result.",
          "Paste the copied banner into a monospace font (like a code editor) so the block-letter alignment displays correctly."
        ]}
      />
    </div>
  );
}