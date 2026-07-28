'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function GifCompressorPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => { setFile(e.target.files[0]); setResult(null); };

  const compress = async () => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        setResult({ url: URL.createObjectURL(blob), originalSize: file.size, newSize: blob.size });
      }, 'image/png', quality / 100);
    };
    img.src = url;
  };

  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(1) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Compressor</h1>
        <p className="text-neutral-500 text-center mb-8">Compress GIF files</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={compress} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Compress</button>
          {result && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">After</div><div className="font-bold text-indigo-400">{formatSize(result.newSize)}</div></div>
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3"><div className="text-neutral-500 text-xs">Saved</div><div className="font-bold text-green-400">{Math.round((1-result.newSize/result.originalSize)*100)}%</div></div>
              </div>
              <a href={result.url} download="compressed.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="GIF Compressor"
        description="This tool loads your GIF and re-exports it in your browser. Note: it currently captures only the GIF's first frame and outputs a static PNG image, not a compressed animated GIF — and because PNG is a lossless format, the quality slider doesn't reduce its file size the way it would for a JPG."
        howTo={[
          "Click the upload area and select a GIF file.",
          "Adjust the quality slider if you like (see the FAQ below for why it may not change the result much).",
          "Click \"Compress\" to process the file.",
          "Review the before/after size comparison and download the result."
        ]}
        faqs={[
          { q: "Does this reduce my GIF's file size?", a: "Not reliably in its current form — it captures only the first frame of the GIF and re-exports it as a PNG. PNG is lossless, so the quality slider has little to no effect on its size." },
          { q: "Does the output stay animated?", a: "No — the current output is a static PNG of the GIF's first frame, not an animated file." },
          { q: "Is GIF Compressor free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Processing happens entirely in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "Since the output loses animation, use this only if you want a static thumbnail from your GIF's first frame — not to shrink an animated GIF's file size.",
          "For true GIF compression that preserves animation, use a dedicated animated-GIF optimizer.",
          "If the before/after sizes look nearly identical, that's expected given PNG's lossless encoding.",
          "Keep your original GIF, since the output here isn't an equivalent animated replacement."
        ]}
      />
    </div>
  );
}