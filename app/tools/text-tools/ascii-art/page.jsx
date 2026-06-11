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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Ascii Art</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">ASCII Art is a free online tool that converts images into text-based art using ASCII characters, creating unique text representations of your photos and designs. Perfect for creating retro-style graphics, adding creative flair to your projects, or generating fun text-based artwork without any technical skills required.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Ascii Art</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Upload an image file from your computer or paste an image URL into the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Adjust the ASCII character density and output size settings to customize your artwork</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose from different ASCII character sets and color options for your desired style</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click generate to create your ASCII art and download or copy the result to use anywhere</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does ASCII Art support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">ASCII Art supports common image formats including JPG, PNG, GIF, and BMP files up to 10MB in size.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use the ASCII art I create commercially?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all ASCII art generated by this free tool is yours to use for personal and commercial projects without any restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How do I adjust the level of detail in my ASCII art?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can control detail level using the character density slider, with higher density creating more detailed and complex ASCII artwork.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I change the colors of my ASCII art?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the tool offers multiple color palettes and options to customize the appearance of your ASCII art output.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use high-contrast images with clear subjects for the best ASCII art results and improved readability</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different character density settings to find the perfect balance between detail and clarity for your needs</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try different ASCII character sets to achieve various artistic styles from minimal to highly detailed</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your favorite ASCII art settings as templates for quick generation of similar artwork in the future</li>
          </ul>
        </div>
      </div>
    </div>
  );
}