'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { diffLines } from '../../../lib/codeTools';
import TextArea from '@/app/components/TextArea';

export default function TextComparatorPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [result, setResult] = useState(null);
  // P24 (03/10): diffchecker highlights the changed words inside a changed line, and can ignore case and spaces
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWs, setIgnoreWs] = useState(false);
  // Myers line diff, then removed/added runs paired side by side. The old
  // version compared line N with line N: one inserted line marked every line
  // after it as different (29/09).
  const compare = async () => {
    const d = await diffLines(text1, text2, { ignoreWhitespace: ignoreWs, ignoreCase });
    const { diffWordsWithSpace, diffWords } = await import('diff');
    const rows = [];
    for (let i = 0; i < d.length;) {
      if (d[i].type === 'same') { rows.push({ l1: d[i].line, l2: d[i].newLine ?? d[i].line, same: true }); i++; continue; } // each side as written
      const rem = [], add = [];
      while (i < d.length && d[i].type === 'removed') rem.push(d[i++].line);
      while (i < d.length && d[i].type === 'added') add.push(d[i++].line);
      for (let k = 0; k < Math.max(rem.length, add.length); k++) {
        const l1 = rem[k] ?? '', l2 = add[k] ?? '';
        // a changed pair: the words that differ are marked (a lone added or removed line is marked whole)
        const words = l1 && l2 ? (ignoreWs ? diffWords : diffWordsWithSpace)(l1, l2, { ignoreCase }) : null;
        rows.push({ l1, l2, same: false, words });
      }
    }
    setResult(rows);
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
              <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste first text here..." value={text1} onChange={e => setText1(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-neutral-500 mb-1">Text 2</label>
              <TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none" placeholder="Paste second text here..." value={text2} onChange={e => setText2(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
            <label className="flex items-center gap-2"><input id="cmp-case" type="checkbox" checked={ignoreCase} onChange={e => setIgnoreCase(e.target.checked)} /> Ignore case</label>
            <label className="flex items-center gap-2"><input id="cmp-ws" type="checkbox" checked={ignoreWs} onChange={e => setIgnoreWs(e.target.checked)} /> Ignore spaces</label>
          </div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Compare</button>
          {result && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-500 text-center">{result.filter(r => !r.same).length} difference(s) found</p>
              {result.map((r, i) => (
                <div key={i} className={`grid grid-cols-2 gap-2 p-2 rounded-lg ${r.same ? 'bg-neutral-800 text-neutral-100' : 'bg-red-900/30'}`}>
                  <div className="text-sm font-mono whitespace-pre-wrap break-words">{r.words ? r.words.filter((w) => !w.added).map((w, k) => <span key={k} className={w.removed ? 'bg-red-300 text-red-950 rounded-sm' : ''}>{w.value}</span>) : (r.l1 || <span className="text-neutral-600">empty</span>)}</div>
                  <div className="text-sm font-mono whitespace-pre-wrap break-words">{r.words ? r.words.filter((w) => !w.removed).map((w, k) => <span key={k} className={w.added ? 'bg-green-300 text-green-950 rounded-sm' : ''}>{w.value}</span>) : (r.l2 || <span className="text-neutral-600">empty</span>)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Text Comparator"}
        description={"Text Comparator puts two versions of a text side by side and marks what changed. Lines are matched with the Myers diff algorithm of the jsdiff library; inside a changed line, the words that differ are highlighted, red in the first text and green in the second. An inserted or deleted line is shown on its own row and the rest stays aligned. It suits drafts, contract clauses and edited lists. It compares pasted text, not files, gives no line numbers, and runs in your browser."}
        example={{
          caption: "The ≠ sign stands for a red-tinted row and brackets for the words highlighted in red (left) and green (right); the page shows 2 difference(s) found.",
          inputLabel: "Text 1 / Text 2",
          input: "Text 1:\nDear Anna,\nThe meeting is on Monday.\nPlease bring the report.\nThanks,\n\nText 2:\nDear Anna,\nThe meeting is on Tuesday.\nPlease bring the report.\nSee you there.\nThanks,",
          outputLabel: "Rows shown",
          output: "  Dear Anna,                  | Dear Anna,\n≠ The meeting is on [Monday]. | The meeting is on [Tuesday].\n  Please bring the report.    | Please bring the report.\n≠ empty                       | See you there.\n  Thanks,                     | Thanks,",
        }}
        howToTitle={"How to compare two texts"}
        howTo={[
          "Put the older wording in \"Text 1\" and the newer one in \"Text 2\".",
          "Tick \"Ignore case\" when one version was retyped with other capitals, or \"Ignore spaces\" when only the spacing changed.",
          "Click \"Compare\"; the button works once both boxes hold text.",
          "Read the number of differences, then the rows: dark grey rows match, red-tinted rows differ, with changed words marked."
        ]}
        specs={[
          { label: "Input", value: "Two pasted texts; Windows, Mac and Unix line breaks compare as equal" },
          { label: "Ignore spaces", value: "Ignores spaces at both ends of a line and the number of spaces between words; a b and ab still differ" },
          { label: "Ignore case", value: "Lines compared in lower case; each side is still shown as written" },
          { label: "Result", value: "Rows on screen only, with no copy, download or line numbers" }
        ]}
        privacyTitle={"Where your text is processed"}
        privacy={"Both texts are compared in this tab by the jsdiff library, which the page fetches from this site the first time you click Compare. The texts themselves are never transmitted, and nothing is kept once you leave the page. This page offers no copy or download of the comparison, so it exists only on your screen."}
        faqs={[
          { q: "Does one inserted line make every following line different?", a: "No. Only the inserted line is marked, opposite an empty cell, and the lines after it stay paired with their counterparts. Each changed or unmatched row adds one to the difference count shown above the rows." },
          { q: "Can it ignore extra spaces?", a: "Yes, partly. \"Ignore spaces\" ignores spaces at the start and end of each line and treats several spaces as one, but a space present on one side only still counts: a b and ab differ. Inside changed lines, the word highlighting then skips spacing changes." },
          { q: "Can I compare two Word or PDF files?", a: "No. Paste the text of each version instead. To check that two files of any type are byte-for-byte identical, use File Comparator; to compare code with line numbers, use Diff Viewer." }
        ]}
        tips={[
          "Text pasted from a PDF often breaks lines differently in each version; join each version into one line with Whitespace Remover first, then compare the words."
        ]}
      />
    </div>
  );
}