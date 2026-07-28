'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function GifToApngPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = URL.createObjectURL(f);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">GIF to APNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to APNG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download PNG</a></div>}
        </div>
      </div>
      <SeoContent
        title="GIF to APNG"
        description="This tool loads your GIF file in your browser and lets you preview and download it as a PNG. Note: it currently captures a single static frame rather than producing a true multi-frame APNG animation — for a fully animated result, you'll need a dedicated GIF-to-APNG converter that decodes and re-encodes every frame."
        howTo={[
          "Click the upload area and select a GIF file from your device.",
          "The tool loads the image and draws it onto a canvas.",
          "Preview the resulting image.",
          "Click \"Download PNG\" to save it."
        ]}
        faqs={[
          { q: "Does this tool produce a real APNG animation?", a: "Not currently — it captures a single static frame from your GIF and exports it as a PNG image, not an animated APNG." },
          { q: "Is GIF to APNG free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "What file types can I upload?", a: "GIF image files." },
          { q: "Is my file uploaded anywhere?", a: "No. The image is loaded and rendered entirely in your browser — it's never sent to a server." }
        ]}
        tips={[
          "Since only a single frame is captured, this works best if you just need a static preview image from your GIF.",
          "Use the resulting PNG as a thumbnail or poster image alongside your original animation.",
          "Keep your original GIF file — this tool doesn't preserve the animation, so you'll need the source for a real animated APNG.",
          "For a true multi-frame GIF-to-APNG conversion, use dedicated desktop software or a server-side conversion tool."
        ]}
      />
    </div>
  );
}