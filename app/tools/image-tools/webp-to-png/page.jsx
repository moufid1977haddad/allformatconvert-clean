'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function WebPtoPNGPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2">WebP to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert WebP to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".webp" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="WebP to PNG"
        description="WebP to PNG converts a WebP image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. Transparency in the WebP file is preserved in the PNG output."
        howTo={[
          "Click the upload area and select a WebP file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is WebP to PNG completely free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Will the conversion affect my image quality?", a: "No, the pixels are copied as-is with no additional compression applied." },
          { q: "How many images can I convert at once?", a: "One at a time — there's no batch conversion feature." },
          { q: "Is my uploaded data secure and private?", a: "Yes, conversion happens entirely in your browser and your file is never uploaded to a server." }
        ]}
        tips={[
          "PNG files are typically larger than WebP at the same visual quality, so expect a bigger file size after conversion.",
          "Use this tool to prepare images for websites or apps that don't yet support WebP.",
          "Convert one file at a time and download each result before starting the next.",
          "Download your PNG right away, since nothing is stored anywhere after you leave the page."
        ]}
      />
    </div>
  );
}