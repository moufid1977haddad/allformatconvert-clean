'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ICOtoPNGPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setResult(null); setError(''); } };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
      setError('');
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ICO to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert ICO to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".ico" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="ICO to PNG"
        description="ICO to PNG converts an ICO icon file to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. If the ICO contains multiple embedded sizes, the browser renders the one it picks as the source image; there's no per-size selector."
        howTo={[
          "Click the upload area and select an ICO file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is ICO to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "What is the maximum file size I can upload?", a: "There's no fixed size limit — processing happens locally, and ICO files are typically small anyway." },
          { q: "Will the conversion affect image quality?", a: "No, the pixels are copied as-is. PNG also supports transparency, so any transparent areas in your ICO are preserved." },
          { q: "Do I need to install any software?", a: "No, it works entirely in your browser with no downloads, and your file never leaves your device." }
        ]}
        tips={[
          "PNG files are ideal for web use since they support transparent backgrounds, which works well for logos and icons.",
          "Convert files one at a time — there's no batch upload option.",
          "Download your PNG right away, since nothing is stored after you leave the page.",
          "If your ICO has multiple resolutions embedded, check which one the browser used as the source before relying on the output for a specific size."
        ]}
      />
    </div>
  );
}