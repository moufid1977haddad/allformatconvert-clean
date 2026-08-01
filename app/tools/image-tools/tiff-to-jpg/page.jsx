'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function TiffToJpgPage() {
  const [image, setImage] = useState(null);
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };
  const convert = () => {
    setError('');
    const img = new Image();
    img.onerror = () => setError('Could not load image file');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/jpeg', quality/100));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to JPG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to JPG</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download JPG</a></div>}
        </div>
      </div>
      <SeoContent
        title="TIFF to JPG"
        description="TIFF to JPG converts a TIFF image to JPG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. Choose a JPEG quality level before converting to balance file size and image quality. Note that browser support for TIFF varies, so some TIFF files (particularly multi-page or unusually compressed ones) may not render correctly."
        howTo={[
          "Click the upload area and select a TIFF or TIF file from your device.",
          "Adjust the quality slider (10–100%) to set the JPEG output quality.",
          "Click 'Convert to JPG' to process the image.",
          "Click the download button to save your JPG file."
        ]}
        faqs={[
          { q: "Is TIFF to JPG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "What is the maximum file size I can convert?", a: "There's no fixed size limit — processing happens locally, so it's limited only by your device's available memory." },
          { q: "Will my uploaded files be stored or shared?", a: "No. Conversion happens entirely in your browser — your file is never uploaded to a server." },
          { q: "Can I convert multiple TIFF files at once?", a: "No, only one file can be converted at a time — there's no batch upload." }
        ]}
        tips={[
          "If your TIFF is multi-page, only the page the browser renders will be converted — extract other pages separately if needed.",
          "Use a quality setting of 85% or higher if you plan to edit or print the resulting JPG.",
          "JPG works best for photographs; if your TIFF has transparency or is a technical scan, PNG may be a better target format.",
          "Keep a backup of your original TIFF file, since converting to JPG discards any layers or extra channels."
        ]}
      />
    </div>
  );
}