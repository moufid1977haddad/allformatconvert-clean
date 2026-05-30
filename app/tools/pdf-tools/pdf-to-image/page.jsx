'use client';
import { useState, useRef } from 'react';

export default function PdfToImagePage() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setImages([]);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setImages([]);
    setStatus('Converting...');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const urls = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        urls.push({ url: canvas.toDataURL('image/png'), page: i });
      }
      setImages(urls);
      setStatus('');
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Convert each PDF page to a PNG image</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to Images'}
          </button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {images.length > 0 && (
            <div className="space-y-4">
              <div className="text-green-400 text-xl font-bold text-center">Done! {images.length} page(s)</div>
              {images.map(({ url, page }) => (
                <div key={page} className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 text-center">
                  <img src={url} alt={'Page ' + page} className="max-w-full rounded mb-3" />
                  <a href={url} download={'page-' + page + '.png'} className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download Page {page}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
