'use client';
import { useState } from 'react';

const LOREM = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum';

export default function LoremIpsumPage() {
  const [count, setCount] = useState(1);
  const [type, setType] = useState('paragraphs');
  const [result, setResult] = useState('');

  const generate = () => {
    const words = LOREM.split(' ');
    if (type === 'words') {
      setResult(words.slice(0, count).join(' '));
    } else if (type === 'sentences') {
      setResult(Array.from({length: count}, (_, i) => LOREM).join('. '));
    } else {
      setResult(Array.from({length: count}, () => LOREM).join('\n\n'));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Lorem Ipsum Generator</h1>
        <p className="text-neutral-500 text-center mb-8">Generate placeholder text</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Amount</label>
              <input type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="paragraphs">Paragraphs</option>
                <option value="sentences">Sentences</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          <button onClick={generate} className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-xl py-3 font-semibold transition">Generate</button>
          {result && (
            <div className="space-y-2">
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Lorem Ipsum</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Lorem Ipsum is a free online tool that generates placeholder text for designers, developers, and content creators who need dummy text for mockups and prototypes. This essential tool helps streamline your workflow by instantly producing customizable filler content in various formats and lengths.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Lorem Ipsum</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Lorem Ipsum tool website and select your desired text format from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Specify the amount of content you need by choosing paragraphs, sentences, or words</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the generate button to instantly create your placeholder text</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the generated text to your clipboard and paste it into your design or development project</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What is Lorem Ipsum text used for?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Lorem Ipsum text is commonly used as placeholder content in web design, graphic design, and software development to demonstrate how text will appear in a layout without using final content.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is the Lorem Ipsum tool completely free?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, our Lorem Ipsum tool is completely free to use with no registration or payment required. You can generate unlimited amounts of placeholder text.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I customize the length of generated text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Absolutely. You can specify exactly how many paragraphs, sentences, or words you need, giving you complete control over the output length.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Why should I use Lorem Ipsum instead of real text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Lorem Ipsum allows designers and developers to focus on layout and visual design without being distracted by actual content, making the design review process more objective.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Lorem Ipsum during the wireframing stage to quickly prototype your layouts without waiting for final content from stakeholders</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Generate different lengths of text to test how your design adapts to varying content amounts and ensures responsive layouts work properly</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy multiple sections of generated text to create a realistic preview of how your full page will look with substantial content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Lorem Ipsum to present design mockups to clients before final copy is ready, allowing them to visualize the design concept clearly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}