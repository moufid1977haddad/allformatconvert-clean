'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function PNGtoWebPPage() {
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
      setResult(canvas.toDataURL('image/webp'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to WebP</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PNG to WebP in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.webp" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="PNG to WebP"
        description="PNG to WebP converts a PNG image to WebP format entirely in your browser using the HTML canvas — your file is never uploaded to a server. Transparency is preserved, since WebP supports an alpha channel just like PNG."
        howTo={[
          "Click the upload area and select a PNG file from your device.",
          "Click 'Convert' to render it to WebP.",
          "Preview the converted image.",
          "Click the download button to save your WebP file."
        ]}
        faqs={[
          { q: "Is PNG to WebP completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "What file size limits does the tool have?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Will conversion affect image quality or transparency?", a: "Transparency is preserved. The browser's default WebP encoding is used, and there's no quality slider to adjust." },
          { q: "Do I need to download or install software?", a: "No, it's entirely web-based and works in any modern browser." }
        ]}
        tips={[
          "WebP images are typically smaller than PNG at similar visual quality, which helps page load speed.",
          "Convert files one at a time — there's no batch upload option.",
          "WebP is supported by all current major browsers, so it's safe to use for most web projects.",
          "Use WebP for product photos and thumbnails to reduce bandwidth and improve mobile load times."
        ]}
      />
    </div>
  );
}