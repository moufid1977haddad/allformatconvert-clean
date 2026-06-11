'use client';
import { useState, useRef } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default function PdfNumberPagesPage() {
  const [file, setFile] = useState(null);
  const [position, setPosition] = useState('bottom-center');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setStatus('');
    setDownloadUrl(null);
  };

  const addNumbers = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Processing...');
    setDownloadUrl(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      const total = pages.length;
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const text = (i + 1) + ' / ' + total;
        const fontSize = 12;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        let x, y;
        if (position === 'bottom-center') { x = (width - textWidth) / 2; y = 20; }
        else if (position === 'bottom-right') { x = width - textWidth - 20; y = 20; }
        else if (position === 'bottom-left') { x = 20; y = 20; }
        else if (position === 'top-center') { x = (width - textWidth) / 2; y = height - 30; }
        else if (position === 'top-right') { x = width - textWidth - 20; y = height - 30; }
        else { x = 20; y = height - 30; }
        page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Number PDF Pages</h1>
        <p className="text-neutral-500 text-center mb-8">Add page numbers to your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Position</label>
            <div className="grid grid-cols-3 gap-2">
              {['top-left','top-center','top-right','bottom-left','bottom-center','bottom-right'].map(pos => (
                <button key={pos} onClick={() => setPosition(pos)} className={`py-2 rounded-lg text-sm font-semibold transition ${position === pos ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>{pos}</button>
              ))}
            </div>
          </div>
          <button onClick={addNumbers} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Add Page Numbers'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={file.name.replace('.pdf', '-numbered.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
