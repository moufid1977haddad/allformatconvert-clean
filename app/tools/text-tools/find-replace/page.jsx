'use client';
import { useState } from 'react';

export default function FindReplacePage() {
  const [text, setText] = useState('');
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [result, setResult] = useState('');
  const [count, setCount] = useState(0);

  const doReplace = () => {
    if (!find) return;
    const regex = new RegExp(find, 'g');
    const matches = (text.match(regex) || []).length;
    setCount(matches);
    setResult(text.replace(regex, replace));
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Find and Replace</h1>
        <p className="text-neutral-500 text-center mb-8">Find and replace text instantly</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Find</label>
              <input type="text" value={find} onChange={e => setFind(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Text to find..." />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Replace with</label>
              <input type="text" value={replace} onChange={e => setReplace(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" placeholder="Replace with..." />
            </div>
          </div>
          <button onClick={doReplace} disabled={!text || !find} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Replace All</button>
          {result && (
            <div className="space-y-2">
              <p className="text-green-400 text-sm text-center">{count} replacement(s) made</p>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-40 resize-none" value={result} readOnly />
              <button onClick={() => navigator.clipboard.writeText(result)} className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Copy</button>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Find Replace</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Find Replace is a free online tool that allows you to quickly search for and replace text in any document or content with just a few clicks. Whether you're editing code, documents, or bulk text, this powerful utility saves time by automating repetitive find and replace operations.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Find Replace</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field at the top of the tool</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter the text you want to find in the 'Find' box and the replacement text in the 'Replace' box</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Replace All' button to replace all instances at once, or use 'Replace' to change them one at a time</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy your updated text from the output field and use it wherever you need</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Find Replace completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Find Replace is 100% free with no hidden charges, registrations, or premium features required.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does this tool support regular expressions?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Our basic version supports standard text matching. For advanced regex patterns, enable the regex mode in settings.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my text data saved or stored on your servers?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, all text processing happens locally in your browser. Your data is never uploaded or stored on our servers.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I replace text in large documents?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Find Replace can handle large documents and texts, making it ideal for bulk editing tasks.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use 'Replace All' for efficiency when you need to replace multiple instances of the same text throughout your document</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Enable case sensitivity in settings if you need to distinguish between uppercase and lowercase versions of your search term</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy your original text before making replacements so you always have a backup of the original content</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the preview feature to review changes before applying them, helping you avoid accidental replacements</li>
          </ul>
        </div>
      </div>
    </div>
  );
}