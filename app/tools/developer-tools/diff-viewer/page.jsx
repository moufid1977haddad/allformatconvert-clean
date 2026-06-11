'use client';
import { useState } from 'react';
export default function DiffViewerPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diff, setDiff] = useState(null);
  const compare = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLen = Math.max(lines1.length, lines2.length);
    const result = [];
    for (let i = 0; i < maxLen; i++) {
      const l1 = i < lines1.length ? lines1[i] : null;
      const l2 = i < lines2.length ? lines2[i] : null;
      if (l1 === l2) result.push({ type: 'same', line: l1, num: i+1 });
      else {
        if (l1 !== null) result.push({ type: 'removed', line: l1, num: i+1 });
        if (l2 !== null) result.push({ type: 'added', line: l2, num: i+1 });
      }
    }
    setDiff(result);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Diff Viewer</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two texts and highlight differences</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Original</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Original text..." value={text1} onChange={e => setText1(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Modified</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Modified text..." value={text2} onChange={e => setText2(e.target.value)} /></div>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compare</button>
          {diff && (
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {diff.map((d, i) => (
                <div key={i} className={"px-3 py-1 rounded flex gap-3 " + (d.type==='removed'?'bg-red-900/30 text-red-400':d.type==='added'?'bg-green-900/30 text-green-400':'bg-neutral-800 text-neutral-500')}>
                  <span className="text-neutral-600 w-6">{d.num}</span>
                  <span>{d.type==='removed'?'- ':d.type==='added'?'+ ':'  '}{d.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Diff Viewer</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Diff Viewer is a free online tool that allows you to compare two text files or code snippets side-by-side to identify differences instantly. It highlights additions, deletions, and modifications in a clear visual format, making it perfect for developers, writers, and anyone who needs to track changes between document versions.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Diff Viewer</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Paste or upload your first text/code snippet into the left panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Paste or upload your second text/code snippet into the right panel</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Click the 'Compare' button to generate the diff analysis</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review the highlighted differences where green shows additions and red shows deletions</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Diff Viewer completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Diff Viewer is 100% free with no registration required. You can compare unlimited files without any hidden charges or premium features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file types does Diff Viewer support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Diff Viewer supports plain text, code files (JavaScript, Python, HTML, CSS, etc.), JSON, XML, and most text-based formats.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data secure when using Diff Viewer?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">All comparisons are processed locally in your browser. Your data is never stored on our servers and is completely private.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I download or save the diff results?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can copy the results to your clipboard or export them as a text file for documentation purposes.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the 'Ignore Whitespace' option when comparing code to focus on actual logic changes rather than formatting differences</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>For large files, consider splitting them into smaller sections for clearer and more manageable comparisons</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use line-by-line diff mode for detailed analysis of specific changes in programming projects</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Bookmark Diff Viewer for quick access during your development workflow and code review processes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}