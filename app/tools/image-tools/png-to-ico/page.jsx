'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function PngToIcoPage() {
  const [file, setFile] = useState(null);
  const [size, setSize] = useState(32);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const convert = () => {
    if (!file) return;
    setStatus('Converting...');
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(blob => {
        setResult(URL.createObjectURL(blob));
        setStatus('');
      }, 'image/png');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to ICO</h1>
        <p className="text-neutral-500 text-center mb-8">Create favicon ICO from PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PNG file here'}</p>
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Size</label>
            <div className="grid grid-cols-4 gap-2">
              {[16, 32, 48, 64].map(s => (
                <button key={s} onClick={() => setSize(s)} className={`py-2 rounded-lg font-semibold transition ${size === s ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-100'}`}>{s}x{s}</button>
              ))}
            </div>
          </div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to ICO</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-400 text-xl font-bold">Done!</div>
              <a href={result} download="favicon.ico" className="inline-block bg-green-600 hover:bg-green-500 rounded-xl px-6 py-2 font-semibold transition">Download ICO</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PNG to ICO"
        description="PNG to ICO resizes your PNG to a chosen icon size (16, 32, 48, or 64px) and downloads it with a .ico file extension, entirely in your browser — your file is never uploaded to a server. Note that the downloaded file contains PNG-encoded image data renamed to .ico, rather than a true multi-resolution Windows ICO container; this works as a favicon in modern browsers but may not be recognized by software that expects the native Windows ICO binary format."
        howTo={[
          "Click the upload area and select a PNG file from your device.",
          "Choose an icon size: 16x16, 32x32, 48x48, or 64x64.",
          "Click 'Convert to ICO' to process the image.",
          "Click the download button to save your favicon.ico file."
        ]}
        faqs={[
          { q: "What is an ICO file?", a: "An ICO file is an image format traditionally used for website favicons and application icons, often containing multiple embedded resolutions. This tool produces a single-resolution PNG saved with a .ico extension, which works as a favicon in modern browsers." },
          { q: "Do I need to install any software to use this tool?", a: "No, it's completely web-based and works directly in your browser." },
          { q: "Is there a file size limit for PNG uploads?", a: "There's no fixed limit — processing happens locally, and favicon source images are typically small anyway." },
          { q: "Can I convert multiple PNG files at once?", a: "No, only one file can be converted at a time." }
        ]}
        tips={[
          "For best results, start with a square PNG image at least as large as your chosen output size.",
          "Use a PNG with a transparent background if you want the icon to have transparency.",
          "Test the downloaded file in your browser's favicon slot to confirm it displays correctly.",
          "If you need a true multi-resolution Windows ICO file (for desktop app icons, for example), use a dedicated ICO-authoring tool instead."
        ]}
      />
    </div>
  );
}