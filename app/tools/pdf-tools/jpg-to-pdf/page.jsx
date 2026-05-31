'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { PDFDocument } from 'pdf-lib';

export default function Page() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFiles = (e) => { setFiles(Array.from(e.target.files)); setResult(null); };

  const convert = async () => {
    if (!files.length) return;
    setLoading(true);
    setError('');
    try {
      const pdfDoc = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const ext = file.name.split('.').pop().toLowerCase();
        let image;
        if (ext === 'jpg' || ext === 'jpeg') image = await pdfDoc.embedJpg(arrayBuffer);
        else if (ext === 'png') image = await pdfDoc.embedPng(arrayBuffer);
        else continue;
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Conversion failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">JPG to PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG/PNG images to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {files.length > 0 ? <p className="text-neutral-700 font-medium">{files.length} image(s) selected</p> : <p className="text-neutral-400 text-sm">Click to upload JPG or PNG images</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleFiles} />
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {files.map((f, i) => <div key={i} className="text-xs text-neutral-600 bg-neutral-50 rounded p-2 truncate border border-neutral-200">{f.name}</div>)}
            </div>
          )}
          <button onClick={convert} disabled={!files.length || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="converted.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PDF</a>}
        </div>
      </div>
    </div>
  );
}
