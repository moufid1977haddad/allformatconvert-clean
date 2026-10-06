'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { diffLines } from '../../../lib/codeTools';
import TextArea from '@/app/components/TextArea';

export default function DiffViewerPage() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [diff, setDiff] = useState(null);
  const [ignoreWs, setIgnoreWs] = useState(false);
  // P24 (03/10): ignore case, and the words that changed inside a changed line (diffchecker, as Text Comparator)
  const [ignoreCase, setIgnoreCase] = useState(false);
  const compare = async () => {
    const d = await diffLines(text1, text2, { ignoreWhitespace: ignoreWs, ignoreCase });
    const { diffWordsWithSpace, diffWords } = await import('diff');
    for (let i = 0; i < d.length;) {
      if (d[i].type === 'same') { i++; continue; }
      const rem = [], add = [];
      while (i < d.length && d[i].type === 'removed') rem.push(d[i++]);
      while (i < d.length && d[i].type === 'added') add.push(d[i++]);
      for (let k = 0; k < Math.min(rem.length, add.length); k++) {
        const words = (ignoreWs ? diffWords : diffWordsWithSpace)(rem[k].line, add[k].line, { ignoreCase }); // diffWords leaves spacing out
        rem[k].parts = words.filter((w) => !w.added);
        add[k].parts = words.filter((w) => !w.removed);
      }
    }
    setDiff(d);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Diff Viewer</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two texts and highlight differences</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Original</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Original text..." value={text1} onChange={e => setText1(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Modified</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="Modified text..." value={text2} onChange={e => setText2(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-600"><label className="flex items-center gap-2"><input type="checkbox" checked={ignoreWs} onChange={e => setIgnoreWs(e.target.checked)} /> Ignore whitespace</label><label className="flex items-center gap-2"><input id="dv-case" type="checkbox" checked={ignoreCase} onChange={e => setIgnoreCase(e.target.checked)} /> Ignore case</label></div>
          <button onClick={compare} disabled={!text1 || !text2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Compare</button>
          {diff && (
            <div className="space-y-1 font-mono text-sm max-h-96 overflow-y-auto">
              {diff.map((d, i) => (
                <div key={i} className={"px-3 py-1 rounded flex gap-3 " + (d.type==='removed'?'bg-red-900/30 text-red-400':d.type==='added'?'bg-green-900/30 text-green-400':'bg-neutral-800 text-neutral-400')}>
                  <span className="text-neutral-600 w-10 text-right">{d.oldNum ?? ''}</span><span className="text-neutral-600 w-10 text-right">{d.newNum ?? ''}</span>
                  <span>{d.type==='removed'?'- ':d.type==='added'?'+ ':'  '}{d.parts ? d.parts.map((w, k) => <span key={k} className={w.removed ? 'bg-red-300/60 text-red-900 rounded' : w.added ? 'bg-green-300/60 text-green-900 rounded' : ''}>{w.value}</span>) : d.line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title={"Diff Viewer"}
        description={"Diff Viewer lists the differences between two texts in a single column, like a patch: each line is marked unchanged, removed (-) or added (+), with its number in the original and in the modified text. It uses the Myers algorithm (jsdiff library), so one inserted line is shown as one addition instead of shifting everything below it. When a line is replaced, the words that changed are highlighted inside both versions. Options ignore letter case, or spaces at line ends and the amount of space between words. Windows and Unix line endings compare as equal. Text Comparator shows the same comparison in two columns."}
        example={{
          caption: "Output of the page’s own comparison code; [-…-] and {+…+} stand for the words highlighted in red and green.",
          inputLabel: "Original, then Modified",
          input: "Original:\nred\nThe cat sat on the mat\nblue\n\nModified:\nred\nThe dog sat on the mat\nblue\ngreen",
          outputLabel: "Result (original line no., modified line no., line)",
          output: " 1  1   red\n 2    - The [-cat-] sat on the mat\n    2 + The {+dog+} sat on the mat\n 3  3   blue\n    4 + green",
        }}
        howToTitle={"How to compare two texts line by line"}
        howTo={[
          "Paste the first version in \"Original\" and the new version in \"Modified\".",
          "Tick \"Ignore whitespace\" so that re-indented lines are not listed as removed and added, and \"Ignore case\" for changes of capitals only.",
          "Click \"Compare\"; the button stays gray until both boxes contain text.",
          "Read the list: a red line was removed, a green line was added, and the two numbers on the left give its line in each text.",
        ]}
        specs={[
          { label: "Input", value: "Two pasted texts; there is no file upload" },
          { label: "Options", value: "Ignore case; Ignore whitespace (trims line ends and treats a run of spaces as one space)" },
          { label: "Line endings", value: "Windows, Unix and old Mac line breaks are treated as the same" },
          { label: "Result", value: "One column with original and modified line numbers and word highlights; no download" },
          { label: "Text size", value: "The tool sets no size cap; above 1,000,000 characters a box shows only its first 20,000 characters, and the comparison still uses all of it" },
        ]}
        privacyTitle={"Where your texts are compared"}
        privacy={"Both texts are compared by code running in this page and are never sent to our servers or stored. The comparison library is downloaded with the page code the first time you click Compare. The result disappears when you reload, so copy what you need from it first."}
        faqs={[
          { q: "Can it ignore indentation changes?", a: "Yes. With \"Ignore whitespace\" ticked, a line whose indentation went from 2 to 4 spaces is listed once as unchanged, with its old and new line numbers, and a tab compares equal to a space. A space inserted inside a word still counts as a change." },
          { q: "Does it show which words changed inside a line?", a: "Yes. When removed lines are followed by added ones, they are paired in order and the words that differ are highlighted inside each pair: red in the old line, green in the new one. Lines added or removed without a partner are shown whole." },
          { q: "Can I see the two texts side by side?", a: "No. Diff Viewer shows one list with both line numbers, the way a patch reads. Text Comparator, in the text tools, uses the same comparison engine and options and shows the two texts in two columns." },
          { q: "Do Windows line endings show up as differences?", a: "No. CRLF, CR and LF line breaks are all turned into the same break before comparing, so a file saved on Windows and the same file saved on Linux compare as identical." },
        ]}
        tips={[
          "Comparing two versions of a JSON file? Format both with JSON Formatter first so that each value sits on its own line.",
        ]}
      />
    </div>
  );
}