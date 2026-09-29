'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function FileComparatorPage() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
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
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(2) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Comparator</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two files side by side</p>
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
          <button onClick={compare} disabled={!file1 || !file2 || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{busy ? `Comparing… ${progress}%` : 'Compare Files'}</button>
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
        description="File Comparator is a free online tool that instantly checks whether two files are byte-for-byte identical, entirely in your browser. It's a fast way to verify that a downloaded file matches the original, confirm a backup is intact, or spot accidental duplicates — no upload, no software installation."
        howTo={[
          "Click the first box and select the first file to compare.",
          "Click the second box and select the second file.",
          "Click \"Compare Files\" to check them byte-by-byte.",
          "View the result — \"Files are identical\" or \"Files are different\", with the position of the first differing byte — along with each file's name and size."
        ]}
        faqs={[
          { q: "What does File Comparator actually compare?", a: "It performs an exact byte-for-byte binary comparison — it tells you whether two files match, not a line-by-line text diff." },
          { q: "What file types are supported?", a: "Any file type and any size: the files are read piece by piece, so even multi-gigabyte files can be compared without loading them whole." },
          { q: "Does it show where the files differ?", a: "It gives the position of the first differing byte (as the cmp command does), or says that one file is the other with extra bytes at the end." },
          { q: "Is File Comparator free to use?", a: "Yes, it's completely free with no signup and no limit on how many comparisons you can run." },
          { q: "Is my data private?", a: "Yes. Both files are compared entirely in your browser — neither one is uploaded to a server." }
        ]}
        tips={[
          "Use this to confirm a downloaded file matches the original before deleting your source copy.",
          "If the two files show different sizes, they're guaranteed to be different — no need to dig further.",
          "For text or code files where you need to see exactly which lines changed, use a dedicated text-diff tool instead — this tool only reports whether files match.",
          "Handy for spotting accidental duplicate files saved under different names before cleaning up storage."
        ]}
      />
    </div>
  );
}