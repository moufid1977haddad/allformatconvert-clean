'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
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
      <SeoContent
        title="Diff Viewer"
        description="Diff Viewer compares two texts line by line, entirely in your browser — nothing is uploaded to a server. It's a simple positional comparison, not a true diff algorithm: it compares line 1 against line 1, line 2 against line 2, and so on, rather than realigning lines after an insertion or deletion. Inserting or removing a single line near the top will make every line after it show as changed, since positions no longer match up."
        howTo={[
          "Paste your original text into the left box and the modified version into the right box.",
          "Click 'Compare' to run the comparison.",
          "Review the result: red lines were removed, green lines were added, and unchanged lines appear neutral.",
          "Edit either box and click 'Compare' again to re-run the comparison."
        ]}
        faqs={[
          { q: "Is Diff Viewer free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it support file upload, or only pasted text?", a: "Only pasted text — there's no file picker or drag-and-drop upload." },
          { q: "Does it use a real diff algorithm like Git?", a: "No — it compares lines by position (line 1 vs line 1, line 2 vs line 2, etc.) rather than realigning text after insertions or deletions, so a single added or removed line can make everything after it appear changed." },
          { q: "Can I download or copy the diff results?", a: "No, there's no copy or export button for the diff output — you'd need to review it on screen." }
        ]}
        tips={[
          "Best suited for comparing two versions with only a few same-position edits (e.g. changed values on the same lines), not for spotting a single inserted or deleted line in a longer document.",
          "If a single line is added or removed near the top, expect every following line to show as both removed and added — that's this tool's line-by-position comparison, not real content differences.",
          "For a true line-realigning diff (like Git's), use a dedicated diff algorithm-based tool instead.",
          "There's no whitespace-ignoring option, so differing indentation or trailing spaces will show up as a difference."
        ]}
      />
    </div>
  );
}