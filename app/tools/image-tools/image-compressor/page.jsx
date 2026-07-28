'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageCompressorPage() {
  const [image, setImage] = useState(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const compress = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const url = canvas.toDataURL('image/jpeg', quality / 100);
      setResult(url);
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress images without losing quality</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compress</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="compressed.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Image Compressor"
        description="Image Compressor reduces an image's file size by re-encoding it as a JPEG at an adjustable quality level, entirely in your browser using the canvas element — your image is never uploaded to a server. Note that the output is always converted to JPEG, even if you upload a PNG or other format."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the quality slider (10–100%) to set the compression level.",
          "Click 'Compress' to process the image.",
          "Click the download button to save your compressed JPG file."
        ]}
        faqs={[
          { q: "Is Image Compressor really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Compressor support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP, for upload. The output is always a JPG file." },
          { q: "Will compression affect image quality?", a: "Yes — lowering the quality slider reduces file size but also introduces JPEG compression artifacts. Higher settings preserve more quality at a larger file size." },
          { q: "Can I compress multiple images at once?", a: "No, only one image at a time — there's no batch upload or ZIP download." }
        ]}
        tips={[
          "If you need to keep transparency, don't use this tool — JPEG output doesn't support transparent backgrounds.",
          "Start around 70-80% quality and adjust based on the result to find your ideal balance of size and clarity.",
          "Compress images one at a time and download each before moving to the next.",
          "Keep your original file as a backup in case you need a higher-quality version later."
        ]}
      />
    </div>
  );
}