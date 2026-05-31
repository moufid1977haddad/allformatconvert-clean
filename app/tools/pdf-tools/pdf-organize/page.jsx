'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [order, setOrder] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    setFile(f);
    setResult(null);
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const arrayBuffer = await f.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const n = pdf.numPages;
    setNumPages(n);
    setOrder(Array.from({ length: n }, (_, i) => i + 1));
  };

  const moveUp = (i) => {
    if (i === 0) return;
    const newOrder = [...order];
    [newOrder[i-1], newOrder[i]] = [newOrder[i], newOrder[i-1]];
    setOrder(newOrder);
  };

  const moveDown = (i) => {
    if (i === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[i], newOrder[i+1]] = [newOrder[i+1], newOrder[i]];
    setOrder(newOrder);
  };

  const removePage = (i) => setOrder(order.filter((_, idx) => idx !== i));

  const reorganize = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument } = await import('pdf-lib');
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();
      for (const pageNum of order) {
        const [page] = await newDoc.copyPages(srcDoc, [pageNum - 1]);
        newDoc.addPage(page);
      }
      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Organize PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Reorder and remove PDF pages</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name} ({numPages} pages)</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          {order.length > 0 && (
            <div className="space-y-2">
              {order.map((pageNum, i) => (
                <div key={i} className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-neutral-700 flex-1">Page {pageNum}</span>
                  <button onClick={() => moveUp(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Up</button>
                  <button onClick={() => moveDown(i)} className="text-xs px-2 py-1 bg-neutral-200 hover:bg-neutral-300 rounded transition">Down</button>
                  <button onClick={() => removePage(i)} className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded transition">Remove</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={reorganize} disabled={!file || loading || order.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Apply Changes'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="organized.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PDF</a>}
        </div>
      </div>
    </div>
  );
}
