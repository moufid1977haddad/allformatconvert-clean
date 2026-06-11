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
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Pdf Sign</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">PDF Sign is a free online tool that allows you to digitally sign PDF documents without downloading any software or creating an account. Securely add your signature, initials, or stamp to any PDF file and save it instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Pdf Sign</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the PDF Sign website and click 'Upload PDF' to select your document from your computer or drag and drop it onto the page.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click on the PDF where you want to place your signature and choose to draw, type, or upload an image of your signature.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize your signature by adjusting the size, color, and position to match your preferences.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click 'Download' to save your signed PDF file to your device or share it directly with others.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is PDF Sign completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, PDF Sign is 100% free with no hidden fees, subscriptions, or premium plans required to sign your documents.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my PDF file secure when I upload it to PDF Sign?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your files are processed securely and automatically deleted from our servers after a short period. We use encryption to protect your data during upload and processing.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I sign multiple PDFs at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">You can sign multiple PDFs by uploading and processing them one at a time. Each document is handled individually on our platform.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats does PDF Sign support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">PDF Sign specifically works with PDF files. If you have documents in other formats, you'll need to convert them to PDF first before signing.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your signature as an image after creating it so you can quickly reuse it on future documents without redrawing it each time.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the zoom feature to ensure precise signature placement on your PDF, especially for documents with small signature fields.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Test your signature on a sample PDF first to get the size and style exactly right before signing important documents.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Keep a backup copy of your original unsigned PDF before signing, in case you need to refer to the unmodified version later.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}