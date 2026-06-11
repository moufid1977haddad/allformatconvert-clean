'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Page() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef();
  const fileRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#3730a3';
    ctx.lineWidth = 2;
  }, []);

  const startDraw = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const addSignature = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');
      const signatureBytes = await fetch(signatureDataUrl).then(r => r.arrayBuffer());
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[pages.length - 1];
      const { width, height } = firstPage.getSize();
      firstPage.drawImage(signatureImage, { x: width - 220, y: 50, width: 200, height: 80 });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Failed to add signature: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Sign PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Draw and add your signature to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Draw your signature below:</label>
            <canvas ref={canvasRef} width={500} height={150} className="w-full border border-neutral-200 rounded-xl cursor-crosshair bg-neutral-50"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} />
            <button onClick={clearSignature} className="mt-2 text-sm text-neutral-500 hover:text-red-500 transition">Clear signature</button>
          </div>
          <button onClick={addSignature} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Adding signature...' : 'Add Signature to PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="signed.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Signed PDF</a>}
        </div>
      </div>
    </div>
  );
}
