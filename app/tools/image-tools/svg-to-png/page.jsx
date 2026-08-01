'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function SvgToPngPage() {
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f);
    setResult(null);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setStatus('Converting...');
    try {
      const text = await file.text();
      const blob = new Blob([text], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setResult(canvas.toDataURL('image/png'));
        setStatus('');
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        setStatus('Error: could not render SVG as an image');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      setStatus('Error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SVG to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Rasterize SVG vectors to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop an SVG file here'}</p>
            <input ref={inputRef} type="file" accept=".svg" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width (px)</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height (px)</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert to PNG</button>
          {status && <p className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="SVG to PNG"
        description="SVG to PNG rasterizes a vector SVG file into a PNG image at the exact pixel width and height you specify, entirely in your browser using the canvas element — your file is never uploaded to a server. Transparency in the SVG is preserved in the PNG output."
        howTo={[
          "Click the upload area and select an SVG file from your device.",
          "Set your desired output width and height in pixels.",
          "Click 'Convert to PNG' to render the image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "What is the maximum file size I can convert?", a: "There's no fixed size limit — processing happens locally, and SVG files are typically small text-based files anyway." },
          { q: "Will the conversion maintain transparency?", a: "Yes, PNG supports transparency, and any transparent areas in your SVG carry over to the output." },
          { q: "Can I convert multiple SVG files at once?", a: "No, only one file can be converted at a time — there's no batch upload." },
          { q: "Can I set a DPI or background color for the output?", a: "No, you only set pixel width and height — there's no DPI or background color option." }
        ]}
        tips={[
          "Set the width and height to match the resolution you actually need — the SVG is rasterized fresh at those dimensions, so there's no quality loss from scaling up within reason.",
          "For print use, calculate the pixel dimensions you need at your target DPI and enter those directly.",
          "Make sure your SVG doesn't rely on external resources (like linked fonts or images) that the browser can't load, since those won't render.",
          "Convert one file at a time and download each result before starting the next."
        ]}
      />
    </div>
  );
}