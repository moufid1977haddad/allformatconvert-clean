'use client';
import { useState } from 'react';

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
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Ascii Art</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Ascii Art tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
  );
}