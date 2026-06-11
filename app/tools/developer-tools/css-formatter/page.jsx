'use client';
import { useState } from 'react';
export default function CssFormatterPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const format = () => {
    let css = input.replace(/\s+/g,' ').replace(/;/g,';\n  ').replace(/{/g,' {\n  ').replace(/}/g,'\n}\n');
    setOutput(css.trim());
  };
  const minify = () => setOutput(input.replace(/\s+/g,' ').replace(/\s*{\s*/g,'{').replace(/\s*}\s*/g,'}').replace(/\s*;\s*/g,';').trim());
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">CSS Formatter</h1>
        <p className="text-neutral-500 text-center mb-8">Format and beautify CSS</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste CSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={format} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Format</button>
            <button onClick={minify} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Minify</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Css Formatter</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">CSS Formatter is a free online tool that automatically beautifies and organizes your CSS code for improved readability and consistency. It removes unnecessary whitespace, fixes indentation, and formats your stylesheets according to industry standards.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Css Formatter</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your CSS code into the input area on the CSS Formatter tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your preferred formatting options such as indentation style and spacing preferences</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the Format button to instantly process and beautify your CSS code</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the formatted output to your clipboard or download it as a file for use in your project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is CSS Formatter completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, CSS Formatter is 100% free to use with no registration required. You can format unlimited CSS files without any limitations or hidden charges.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I format minified CSS code?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely. CSS Formatter can take compressed, minified CSS and expand it into a readable format with proper indentation and line breaks.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does the tool support all CSS versions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, CSS Formatter supports CSS2, CSS3, and modern CSS specifications including variables, grid, flexbox, and other contemporary features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my code secure when using CSS Formatter?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your code is processed locally in your browser and is never stored on our servers, ensuring complete privacy and security of your CSS files.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use CSS Formatter before committing code to maintain consistent formatting standards across your team's codebase</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Customize the indentation settings to match your project's style guide for seamless integration with existing code</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Format your CSS regularly during development to catch syntax errors and improve code maintainability early on</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the formatted output and use it as a reference for learning proper CSS structure and best practices</li>
          </ul>
        </div>
      </div>
    </div>
  );
}