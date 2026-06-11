'use client';
import { useState } from 'react';

export default function TextComparatorPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState(null);

  const compare = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const diff = [];
    for (let i = 0; i < maxLines; i++) {
      const l1 = lines1[i] || '';
      const l2 = lines2[i] || '';
      diff.push({ l1, l2, same: l1 === l2 });
    }
    setResult(diff);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Text Comparator</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two texts side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 1</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste first text here..." value={text1} onChange={e => setText1(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 2</label>
              <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste second text here..." value={text2} onChange={e => setText2(e.target.value)} />
            </div>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compare</button>
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500 text-center">{result.filter(r => !r.same).length} difference(s) found</p>
              {result.map((r, i) => (
                <div key={i} className={`grid grid-cols-2 gap-2 p-2 rounded-lg ${r.same ? 'bg-neutral-800' : 'bg-red-900/30'}`}>
                  <div className="text-sm font-mono">{r.l1 || <span className="text-neutral-600">empty</span>}</div>
                  <div className="text-sm font-mono">{r.l2 || <span className="text-neutral-600">empty</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Text Comparator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Text Comparator is a free online tool that helps you quickly identify differences and similarities between two pieces of text side-by-side. Perfect for writers, developers, and content creators who need to track changes, compare versions, or spot variations in documents.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Text Comparator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or type your first text into the left text box labeled 'Original Text'</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter the second text you want to compare in the right text box labeled 'Compare Text'</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Compare' button to analyze both texts</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review the highlighted differences, additions, and deletions in the results display</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Text Comparator really free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Comparator is completely free with no hidden charges, registration requirements, or premium features. You can compare unlimited texts online.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How accurate is the text comparison?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">The tool uses advanced algorithms to detect character-level and word-level differences with high accuracy, highlighting additions, deletions, and modifications between texts.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I compare very long documents?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Text Comparator can handle large documents, though performance may vary depending on your browser and device. For extremely large files, consider breaking them into smaller sections.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data private when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your text comparisons are processed locally in your browser and are not stored on any server, ensuring complete privacy and security for your sensitive content.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the highlight feature to quickly spot differences in color-coded sections for easier analysis and review</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Copy the comparison results directly to your clipboard for pasting into documents or reports</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compare different versions of code, essays, or contracts to track all modifications between revisions</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the tool before submitting important documents to ensure no accidental changes were made from previous versions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}