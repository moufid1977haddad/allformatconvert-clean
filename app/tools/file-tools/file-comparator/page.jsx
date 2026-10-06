'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { formatBytes } from '../../../lib/formatBytes';
import { useToolError } from '../../../lib/useToolError';
export default function FileComparatorPage() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const ref1 = useRef();
  const ref2 = useRef();
  const compare = async () => {
    if (!file1 || !file2) return;
    setError('');
    try {
      // Read 8 MiB at a time (29/09): both files used to be loaded whole, which fails on large files (two
      // 1.5 GB videos); the first differing byte is now reported, as cmp does.
      setBusy(true);
      const CHUNK = 8 * 1024 * 1024;
      const common = Math.min(file1.size, file2.size);
      let firstDiff = -1;
      for (let off = 0; off < common && firstDiff < 0; off += CHUNK) {
        const end = Math.min(off + CHUNK, common);
        const [a, b] = await Promise.all([file1.slice(off, end).arrayBuffer(), file2.slice(off, end).arrayBuffer()]);
        const x = new Uint8Array(a), y = new Uint8Array(b);
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) { firstDiff = off + i; break; }
        setProgress(Math.round((end / Math.max(common, 1)) * 100));
      }
      if (firstDiff < 0 && file1.size !== file2.size) firstDiff = common; // one file is the other plus extra bytes
      setResult({ identical: firstDiff < 0, firstDiff, size1: file1.size, size2: file2.size, name1: file1.name, name2: file2.name });
    } catch (err) {
      setError('Failed to compare files: ' + (err?.message || 'unknown error'));
      setResult(null);
    }
    setBusy(false);
  };
  const formatSize = formatBytes;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Comparator</h1>
        <p className="text-neutral-500 text-center mb-8">Check whether two files are identical, byte for byte</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref1.current.click()}>
              <p className="text-neutral-500 text-sm">{file1 ? file1.name : 'File 1'}</p>
              <input ref={ref1} type="file" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile1(f); setResult(null); }} />
            </div>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref2.current.click()}>
              <p className="text-neutral-500 text-sm">{file2 ? file2.name : 'File 2'}</p>
              <input ref={ref2} type="file" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile2(f); setResult(null); }} />
            </div>
          </div>
          <button onClick={compare} disabled={!file1 || !file2 || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{busy ? `Comparing… ${progress}%` : 'Compare Files'}</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className={result.identical ? 'text-green-600 text-2xl font-bold' : 'text-red-600 text-2xl font-bold'}>{result.identical ? 'Files are identical' : 'Files are different'}</div>
              {!result.identical && <p className="text-sm text-neutral-700" data-first-diff>{result.firstDiff >= Math.min(result.size1, result.size2) ? `Identical up to byte ${result.firstDiff.toLocaleString()}, then the ${result.size1 > result.size2 ? 'first' : 'second'} file continues (${Math.abs(result.size1 - result.size2).toLocaleString()} more bytes).` : `First difference at byte ${(result.firstDiff + 1).toLocaleString()} (offset 0x${result.firstDiff.toString(16).toUpperCase()}).`}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-neutral-500">{result.name1}</div><div className="text-indigo-400">{formatSize(result.size1)}</div></div>
                <div><div className="text-neutral-500">{result.name2}</div><div className="text-indigo-400">{formatSize(result.size2)}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="File Comparator"
        description="File Comparator tells you whether two files are exactly the same, byte for byte, and if not, where the first difference is: its byte number, counted from 1 as the cmp command counts it, and its hexadecimal offset. If one file is the other with extra bytes at the end, it says so. Both files are read in pieces of 8 MiB with a progress percentage, so large files are never loaded whole. It does not show a line-by-line diff or list every difference. Typical uses: checking a download, a copy or a backup against its original."
        howToTitle="How to compare two files"
        howTo={[
          "Click \"File 1\" and choose the first file.",
          "Click \"File 2\" and choose the second one.",
          "Click \"Compare Files\" and follow the percentage on the button.",
          "Read the verdict, \"Files are identical\" or \"Files are different\", with the first differing byte and the name and size of each file."
        ]}
        specs={[
          { label: "Files", value: "Two, of any type" },
          { label: "Comparison", value: "Exact, byte by byte, stopping at the first difference" },
          { label: "Reading", value: "8 MiB of each file at a time, with a progress percentage" },
          { label: "Size limit", value: "None set in the tool; the files are never loaded whole" },
          { label: "Result", value: "Verdict, first differing byte (decimal position and hex offset), both names and sizes" }
        ]}
        privacy="Both files are read from your device by this page and compared there; neither file is uploaded and no copy of either is made. Large files are read in pieces, so they are never held whole in memory. If the comparison fails, our error log receives the cleaned message, the tool name and your browser, never the files or their names."
        faqs={[
          { q: "Does it show what changed between two text files?", a: "No. It only answers whether the bytes are identical and where the first difference is. To see the lines that changed between two texts, use Diff Viewer in Developer Tools." },
          { q: "Can it compare very large files?", a: "Yes, the tool sets no size limit: it reads both files 8 MiB at a time and stops at the first difference, so it never holds a whole file in memory. The time it takes grows with the size of the identical part." },
          { q: "Does it tell me where the files differ?", a: "Yes, the first place only: \"First difference at byte\" gives its position counted from 1, followed by the offset in hexadecimal counted from 0. When one file simply continues past the other, it says they are identical up to that byte." },
          { q: "Do different names or dates matter?", a: "No. Only the contents are compared; names and modification dates are ignored, so a renamed copy of a file shows as identical to the original." }
        ]}
        tips={[
          "Two files of different sizes are always different; the tool still shows where they first diverge."
        ]}
      />
    </div>
  );
}