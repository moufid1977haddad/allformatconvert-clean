'use client';
import { useState } from 'react';

export default function TextRepeaterPage() {
  const [text, setText] = useState('');
  const [count, setCount] = useState(3);
  const [separator, setSeparator] = useState('newline');
  const [result, setResult] = useState('');

  const repeat = () => {
    const sep = separator === 'newline' ? '\n' : separator === 'comma' ? ', ' : separator === 'space' ? ' ' : '';
    setResult(Array.from({length: count}, () => text).join(sep));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Repeater</h1>
        <p className="text-neutral-500 text-center mb-8">Repeat text multiple times</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-32 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Repeat count</label>
              <input type="number" min="1" max="100" value={count} onChange={e => setCount(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Separator</label>
              <select value={separator} onChange={e => setSeparator(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="newline">New Line</option>
                <option value="space">Space</option>
                <option value="comma">Comma</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
          <button onClick={repeat} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Repeat</button>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Repeater</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Repeater is a free online tool that instantly duplicates any text multiple times with just a few clicks. Perfect for creating patterns, generating test data, or producing repetitive content for any project.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Repeater</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Enter or paste your desired text into the input field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Specify how many times you want the text to be repeated using the number input</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Choose your separator option such as new line, space, comma, or custom delimiter</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click the 'Repeat' button and copy your results from the output box</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Repeater really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Repeater is completely free with no hidden charges, sign-ups required, or premium features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many times can I repeat text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can repeat text from 1 to 10,000 times depending on your needs and browser capabilities.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use custom separators between repetitions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can choose from preset separators like new lines and commas, or enter your own custom separator.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data saved or stored when I use this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Text Repeater processes everything locally in your browser and does not store any of your data.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Text Repeater to quickly generate test data for software testing and development projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Combine custom separators with repeated text to create formatted lists or patterns for documents</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the output directly into spreadsheets, code editors, or any text application for seamless integration</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different repetition counts and separators to find the perfect format for your specific use case</li>
          </ul>
        </div>
      </div>
    </div>
  );
}