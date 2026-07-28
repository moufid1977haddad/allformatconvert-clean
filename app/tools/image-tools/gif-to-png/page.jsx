'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function GIFtoPNGPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const convert = () => {
    const img = new Image();
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
        <h1 className="text-3xl font-bold text-center mb-2">GIF to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="GIF to PNG"
        description="GIF to PNG converts a GIF image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. For an animated GIF, it captures a single static frame (the one shown when the browser renders it) rather than extracting every frame."
        howTo={[
          "Click the upload area and select a GIF file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is GIF to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "Can it extract every frame from an animated GIF?", a: "No, it captures a single static frame — there's no frame-by-frame extraction or frame selector." },
          { q: "Can I convert multiple GIFs at once?", a: "No, only one file can be converted at a time — there's no batch upload." },
          { q: "Will my uploaded files be stored or shared?", a: "No. Conversion happens entirely in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "If you need a specific frame from an animation, pause the GIF at that frame in an image viewer first, then screenshot or export it before converting.",
          "PNG preserves transparency, so it's a good target format if your GIF uses a transparent background.",
          "Convert one GIF at a time and download each result before starting the next.",
          "Keep the original GIF as a backup in case you need the animation again later."
        ]}
      />
    </div>
  );
}