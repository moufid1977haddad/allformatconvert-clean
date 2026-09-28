'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { diffLines } from '../../../lib/codeTools';

export default function DiffViewerPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diff, setDiff] = useState(null);
  const [ignoreWs, setIgnoreWs] = useState(false);
  const compare = async () => setDiff(await diffLines(text1, text2, { ignoreWhitespace: ignoreWs }));
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
          <label className="flex items-center gap-2 text-sm text-neutral-600"><input type="checkbox" checked={ignoreWs} onChange={e => setIgnoreWs(e.target.checked)} /> Ignore whitespace</label>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Compare</button>
          {diff && (
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {diff.map((d, i) => (
                <div key={i} className={"px-3 py-1 rounded flex gap-3 " + (d.type==='removed'?'bg-red-900/30 text-red-400':d.type==='added'?'bg-green-900/30 text-green-400':'bg-neutral-800 text-neutral-400')}>
                  <span className="text-neutral-600 w-10 text-right">{d.oldNum ?? ''}</span><span className="text-neutral-600 w-10 text-right">{d.newNum ?? ''}</span>
                  <span>{d.type==='removed'?'- ':d.type==='added'?'+ ':'  '}{d.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Diff Viewer"}
        description={"Diff Viewer compares two texts line by line with the Myers diff algorithm — the one used by git and diffchecker — entirely in your browser. It finds the smallest set of added and removed lines, so inserting or deleting a line marks only that line, not everything after it. Each line shows its number in the original and in the modified text; Windows (CRLF) and Unix line endings compare as equal, and an option ignores differences in spaces."}
        howTo={[
          "Paste the original text on the left and the modified text on the right.",
          "Optionally tick 'Ignore whitespace'.",
          "Click 'Compare'.",
          "Read the result: red lines were removed, green lines were added, grey lines are unchanged."
        ]}
        faqs={[
          { q: "Is Diff Viewer free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "How does it decide what changed?", a: "It uses the Myers algorithm (as git does) to find the longest common sequence of lines, so a single inserted line shows as one addition." },
          { q: "Do line endings matter?", a: "No — CRLF and LF line endings are treated as the same." },
          { q: "Is my text uploaded?", a: "No — the comparison runs entirely in your browser." }
        ]}
        tips={[
          "Line numbers on each row refer to the original (left) and modified (right) text.",
          "Tick 'Ignore whitespace' to compare code where only indentation changed."
        ]}
      />
    </div>
  );
}