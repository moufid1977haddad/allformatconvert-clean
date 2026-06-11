'use client';
import { useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const compress = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Processing...');
    setResult(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const compressed = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      const originalSize = file.size;
      const newSize = compressed.byteLength;
      const ratio = (((originalSize - newSize) / originalSize) * 100).toFixed(1);
      const blob = new Blob([compressed], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResult({ url, originalSize, newSize, ratio, name: file.name });
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF Compression</h1>
        <p className="text-neutral-500 text-center mb-8">Reduce PDF file size in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">Original: {formatSize(file.size)}</p>}
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={compress} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Processing...' : 'Compress PDF'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done!</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><div className="text-neutral-500">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div><div className="text-neutral-500">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                <div><div className="text-neutral-500">Saved</div><div className="font-bold text-green-400">{result.ratio}%</div></div>
              </div>
              <a href={result.url} download={result.name.replace('.pdf', '-compressed.pdf')} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
