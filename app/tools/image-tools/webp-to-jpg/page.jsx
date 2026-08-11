'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function WebPtoJPGPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setResult(null); setError(''); } };
  const convert = () => {
    setError('');
    const img = new Image();
    img.onerror = () => setError('Could not load image file');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/jpeg'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">WebP to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert WebP to JPG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".webp" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="WebP to JPG"
        description="WebP to JPG converts a WebP image to JPG format entirely in your browser using the HTML canvas — your file is never uploaded to a server, and nothing is stored anywhere."
        howTo={[
          "Click the upload area and select a WebP file from your device.",
          "Click 'Convert' to render it to JPG.",
          "Preview the converted image.",
          "Click the download button to save your JPG file."
        ]}
        faqs={[
          { q: "Is WebP to JPG completely free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Will my images be stored or shared after conversion?", a: "No. Conversion happens entirely in your browser — your file is never uploaded anywhere." },
          { q: "What is the maximum file size I can convert?", a: "There's no fixed size limit — processing happens locally, so it's limited only by your device's available memory." },
          { q: "Can I convert multiple WebP files at once?", a: "No, only one file can be converted at a time — there's no batch upload." }
        ]}
        tips={[
          "Converting can't add detail beyond what's in the original WebP file, so start with the highest-quality source you have.",
          "There's no quality slider here — the browser's default JPEG encoding is used.",
          "JPG doesn't support transparency, so any transparent areas in your WebP will render as black.",
          "Convert one file at a time and download each result before starting the next."
        ]}
      />
    </div>
  );
}