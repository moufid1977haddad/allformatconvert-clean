'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { checkedBlob, flattenOntoWhite } from '../../../lib/mediaSupport';
const formatSize = (bytes) => (bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(2) + ' MB');
export default function ImageCompressorPage() {
  const [image, setImage] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setOriginalSize(f.size); setResult(null); setError(''); } };
  const compress = () => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      flattenOntoWhite(ctx, canvas.width, canvas.height);
      try {
        const blob = await checkedBlob(canvas, 'image/jpeg', quality / 100);
        // Measured 2026-09-22: a JPEG already saved at quality 40 came out of this
        // tool 9% HEAVIER at 80%, still named "compressed.jpg". Never hand over a
        // "compressed" file that is not smaller than what the visitor brought.
        if (blob.size >= originalSize) {
          setResult(null);
          setError(`At ${quality}% quality the result would be ${formatSize(blob.size)}, not smaller than your original (${formatSize(originalSize)}): this image is already well compressed. Lower the quality to shrink it further.`);
          return;
        }
        setResult({ url: URL.createObjectURL(blob), size: blob.size });
        setError('');
      } catch (e) { setResult(null); setError(e.message); }
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Reduce image file size in your browser — you choose the quality</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Compress</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><p className="text-center text-sm text-neutral-600">{formatSize(originalSize)} → <span className="font-bold text-indigo-600">{formatSize(result.size)}</span> <span className="text-green-600 font-semibold">(−{Math.round((1 - result.size / originalSize) * 100)}%)</span></p><a href={result.url} download="compressed.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
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
          "If you need to keep transparency, don't use this tool — JPEG output doesn't support transparent backgrounds, so transparent areas are filled with white.",
          "If your image is already heavily compressed, the tool tells you instead of handing back a larger file — lower the quality to shrink it further.",
          "Start around 70-80% quality and adjust based on the result to find your ideal balance of size and clarity.",
          "Compress images one at a time and download each before moving to the next.",
          "Keep your original file as a backup in case you need a higher-quality version later."
        ]}
      />
    </div>
  );
}