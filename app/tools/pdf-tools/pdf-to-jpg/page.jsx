'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setImages([]); };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const imgs = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        imgs.push({ url: canvas.toDataURL('image/jpeg', 0.9), name: `page_${i}.jpg` });
      }
      setImages(imgs);
    } catch(e) { setError('Conversion failed: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PDF pages to JPG images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Converting...' : 'Convert to JPG'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {images.length > 0 && (
            <div className="space-y-4">
              {images.map((img, i) => (
                <div key={i} className="space-y-2">
                  <img src={img.url} className="w-full rounded-xl border border-neutral-200" alt={`Page ${i+1}`} />
                  <a href={img.url} download={img.name} className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Page {i+1}</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF to JPG"
        description="PDF to JPG renders every page onto a canvas at 2x scale and exports each as a separate JPG at a fixed quality setting, using the PDF.js library entirely in your browser — your file is never uploaded to a server. There's no quality slider, no batch upload of multiple PDFs, and no single 'Download All' button — each page downloads individually."
        howTo={[
          "Click the upload area and select a single PDF file.",
          "Click 'Convert to JPG' to render every page.",
          "Preview each page's image as it appears below the button.",
          "Click 'Download Page N' under each image to save it."
        ]}
        faqs={[
          { q: "Is PDF to JPG really free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I convert multiple PDF files at once?", a: "No, only one PDF at a time — but every page inside it is converted." },
          { q: "Can I adjust JPG quality or compression?", a: "No, every image is exported at a fixed quality setting; there's no quality slider." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser using the PDF.js library." }
        ]}
        tips={[
          "Each page downloads separately — there's no single \"Download All\" button, so expect to click through each page for a multi-page PDF.",
          "Images render at 2x scale for reasonably sharp text and detail, good for screen viewing; check the result yourself if you need print quality.",
          "For very long PDFs, converting many pages at once can take a moment and use noticeable browser memory.",
          "Everything happens locally, so there's no upload wait — the limiting factor is your device's available memory."
        ]}
      />
    </div>
  );
}