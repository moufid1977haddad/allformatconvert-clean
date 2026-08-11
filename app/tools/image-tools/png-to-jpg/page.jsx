'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function PNGtoJPGPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2">PNG to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PNG to JPG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="PNG to JPG"
        description="PNG to JPG converts a PNG image to JPG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. If your PNG has transparency, the canvas renders transparent areas as black in the JPG output, since JPG has no alpha channel."
        howTo={[
          "Click the upload area and select a PNG file from your device.",
          "Click 'Convert' to render it to JPG.",
          "Preview the converted image — check transparent areas rendered correctly.",
          "Click the download button to save your JPG file."
        ]}
        faqs={[
          { q: "Is PNG to JPG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "Will converting PNG to JPG reduce image quality?", a: "JPG uses lossy compression, so there is some quality loss compared to PNG, though it's usually minor at default encoder settings." },
          { q: "What happens to transparent areas in my PNG?", a: "They render as black, since JPG doesn't support transparency and this tool doesn't fill transparent pixels with a custom background color first." },
          { q: "Do you store my images after conversion?", a: "No, conversion happens entirely in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "If your PNG has a transparent background, consider flattening it onto a white background in an image editor before converting, to avoid black areas in the JPG.",
          "JPG works best for photographs and complex images; keep using PNG for graphics that need transparency.",
          "Keep your original PNG as a backup, since converting to JPG discards the alpha channel.",
          "Convert one file at a time — there's no batch upload option."
        ]}
      />
    </div>
  );
}