'use client';
import { useState, useRef } from 'react';
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
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Gif Compressor</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Gif Compressor tool. No signup required, no watermark, works on all devices.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Why use OnlineConverTools?</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>100% free — no hidden fees</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No signup or account required</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Files processed locally — your data stays private</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Works on all devices — desktop, tablet, mobile</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>No watermarks added to your files</li>
          </ul>
        </div>
      </div>
  );
}