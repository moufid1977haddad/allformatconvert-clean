'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function TiffToPngPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
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
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to PNG</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a></div>}
        </div>
      </div>
      <SeoContent
        title="TIFF to PNG"
        description="TIFF to PNG converts a TIFF image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. Note that browser support for TIFF varies, so some TIFF files (particularly multi-page or unusually compressed ones) may not render correctly."
        howTo={[
          "Click the upload area and select a TIFF or TIF file from your device.",
          "Click 'Convert to PNG' to process the image.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is TIFF to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "What file size limits does TIFF to PNG have?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Will the conversion affect image quality?", a: "No, the pixels are copied as-is with no lossy compression applied." },
          { q: "Do I need to download software to use this tool?", a: "No, it works entirely in your browser on any device with a modern browser." }
        ]}
        tips={[
          "If your TIFF is multi-page, only the page the browser renders will be converted.",
          "PNG offers better web compatibility than TIFF, since most browsers can't display TIFF images directly.",
          "Check the converted PNG's dimensions match what you expect before using it in a project.",
          "Convert one file at a time — there's no batch upload option."
        ]}
      />
    </div>
  );
}