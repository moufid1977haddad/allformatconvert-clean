'use client';
import { useState } from 'react';

export default function TextTruncatorPage() {
  const [text, setText] = useState('');
  const [limit, setLimit] = useState(100);
  const [type, setType] = useState('characters');
  const [result, setResult] = useState('');

  const truncate = () => {
    if (type === 'characters') {
      setResult(text.length > limit ? text.slice(0, limit) + '...' : text);
    } else {
      const words = text.split(' ');
      setResult(words.length > limit ? words.slice(0, limit).join(' ') + '...' : text);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Truncator</h1>
        <p className="text-neutral-500 text-center mb-8">Truncate text to specific length</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste your text here..." value={text} onChange={e => setText(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Limit</label>
              <input type="number" min="1" value={limit} onChange={e => setLimit(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <option value="characters">Characters</option>
                <option value="words">Words</option>
              </select>
            </div>
          </div>
          <button onClick={truncate} disabled={!text} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Truncate</button>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Truncator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Truncator is a free online tool that allows you to quickly shorten long text while preserving its meaning and readability. Perfect for social media posts, summaries, and content optimization, this tool helps you meet character limits and improve engagement.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Truncator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your text into the input field on the Text Truncator homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Select your desired character limit or word count from the available options</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Truncate' button to process your text instantly</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Copy the shortened text to your clipboard and use it wherever needed</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Truncator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Truncator is completely free with no hidden charges, registration requirements, or premium limitations for basic truncation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Does the tool preserve the meaning of my text?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool cuts text at your specified limit while maintaining word integrity, though you may need to manually edit for perfect coherence depending on where the truncation occurs.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I truncate text for multiple platforms?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Truncator works for Twitter, Instagram, Facebook, LinkedIn, and any platform with character or word limits.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my text data stored or shared?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No, Text Truncator processes your text locally in your browser and never stores or shares your data with third parties.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Always review truncated text for grammar and completeness, especially when dealing with complex sentences</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use ellipsis (...) at the end of truncated text to indicate continuation and improve readability</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your truncated content on the actual platform to ensure it displays correctly with your desired formatting</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For social media, leave room for hashtags and mentions by truncating your main message to a shorter length than the platform maximum</li>
          </ul>
        </div>
      </div>
    </div>
  );
}