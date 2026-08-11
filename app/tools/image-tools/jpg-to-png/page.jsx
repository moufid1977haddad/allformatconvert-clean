'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function JPGtoPNGPage() {
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
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JPG to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".jpg,.jpeg" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="JPG to PNG"
        description="JPG to PNG converts a JPG image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. Note that since a JPG has no transparency to begin with, the PNG output is fully opaque, just like the source."
        howTo={[
          "Click the upload area and select a JPG file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is JPG to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "Will the image quality be affected during conversion?", a: "No, the pixels are copied as-is. Note that JPG compression artifacts already present in the source image aren't removed by converting to PNG." },
          { q: "Can I convert multiple images at once?", a: "No, only one file can be converted at a time — there's no batch upload." },
          { q: "Is my uploaded image data secure?", a: "Yes. Conversion happens entirely in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "PNG is a good target format when you need lossless output for further editing.",
          "Since JPGs have no transparency, converting to PNG won't add an alpha channel — the image stays fully opaque.",
          "PNG files are generally larger than JPGs, so expect a bigger file size after conversion.",
          "Convert one file at a time and download each result before starting the next."
        ]}
      />
    </div>
  );
}