'use client';
import { useState, useRef } from 'react';
export default function FileComparatorPage() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [result, setResult] = useState(null);
  const ref1 = useRef();
  const ref2 = useRef();
  const compare = async () => {
    if (!file1 || !file2) return;
    const [buf1, buf2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()]);
    const bytes1 = new Uint8Array(buf1);
    const bytes2 = new Uint8Array(buf2);
    const identical = bytes1.length === bytes2.length && bytes1.every((b, i) => b === bytes2[i]);
    setResult({ identical, size1: file1.size, size2: file2.size, name1: file1.name, name2: file2.name });
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
              <input ref={ref1} type="file" className="hidden" onChange={e => setFile1(e.target.files[0])} />
            </div>
            <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => ref2.current.click()}>
              <p className="text-neutral-500 text-sm">{file2 ? file2.name : 'File 2'}</p>
              <input ref={ref2} type="file" className="hidden" onChange={e => setFile2(e.target.files[0])} />
            </div>
          </div>
          <button onClick={compare} disabled={!file1 || !file2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compare Files</button>
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className={result.identical ? 'text-green-400 text-2xl font-bold' : 'text-red-400 text-2xl font-bold'}>{result.identical ? 'Files are identical' : 'Files are different'}</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-neutral-500">{result.name1}</div><div className="text-indigo-400">{formatSize(result.size1)}</div></div>
                <div><div className="text-neutral-500">{result.name2}</div><div className="text-indigo-400">{formatSize(result.size2)}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}