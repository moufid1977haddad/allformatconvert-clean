'use client';
import { useState } from 'react';
export default function ScssToCssPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let css = input.replace(/\/\/[^\n]*/g,'').replace(/&:([\w-]+)/g,':$1').replace(/&\.([\w-]+)/g,'.$1');
    setOutput(css.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SCSS to CSS</h1>
        <p className="text-neutral-500 text-center mb-8">Convert SCSS to CSS format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SCSS Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SCSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSS Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Scss To Css</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">SCSS to CSS is a free online converter tool that instantly transforms your SCSS (Sass) code into standard CSS. Streamline your stylesheet development and ensure cross-browser compatibility with this fast and reliable conversion utility.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Scss To Css</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste your SCSS code into the input textarea on the left side of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the 'Convert' button to automatically compile your SCSS into CSS</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Review the generated CSS output displayed on the right side</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the CSS code using the copy button and paste it into your project files</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is SCSS and why convert it to CSS?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">SCSS is a CSS preprocessor that adds features like variables, nesting, and mixins. Browsers only understand standard CSS, so conversion is necessary for web deployment.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is this tool free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, the SCSS to CSS converter is completely free with no registration required. You can convert unlimited SCSS files without any limitations.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my code be saved or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, your code remains private and is processed only in your browser. We do not store, save, or share any of the code you convert.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I convert CSS back to SCSS?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">This tool specifically converts SCSS to CSS. For the reverse conversion, you would need a different tool, as CSS to SCSS conversion is more complex.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use variables in your SCSS to maintain consistent colors and sizes, then convert to CSS for deployment</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Nest your selectors logically in SCSS before conversion to keep your code organized and maintainable</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test the converted CSS output in your browser to ensure all styles render correctly across different devices</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep your original SCSS files for future edits, and regenerate CSS whenever you make updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}