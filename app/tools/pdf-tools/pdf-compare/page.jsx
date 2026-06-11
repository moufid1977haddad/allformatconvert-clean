'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const file1Ref = useRef();
  const file2Ref = useRef();

  const extractText = async (file) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  };

  const compare = async () => {
    if (!file1 || !file2) return;
    setLoading(true);
    setError('');
    try {
      const [t1, t2] = await Promise.all([extractText(file1), extractText(file2)]);
      setText1(t1);
      setText2(t2);
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Compare PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Compare two PDF documents side by side</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => file1Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file1 ? <p className="text-neutral-700 text-sm font-medium">{file1.name}</p> : <p className="text-neutral-400 text-sm">Click to upload PDF 1</p>}
            </div>
            <div onClick={() => file2Ref.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 transition">
              {file2 ? <p className="text-neutral-700 text-sm font-medium">{file2.name}</p> : <p className="text-neutral-400 text-sm">Click to upload PDF 2</p>}
            </div>
          </div>
          <input ref={file1Ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile1(e.target.files[0])} />
          <input ref={file2Ref} type="file" accept=".pdf" className="hidden" onChange={e => setFile2(e.target.files[0])} />
          <button onClick={compare} disabled={!file1 || !file2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Comparing...' : 'Compare PDFs'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {text1 && text2 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file1.name}</p>
                <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text1} readOnly />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">{file2.name}</p>
                <textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs h-64 resize-none" value={text2} readOnly />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
