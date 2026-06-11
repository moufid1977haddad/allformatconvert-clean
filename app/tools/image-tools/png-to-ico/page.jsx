'use client';
import { useState, useRef } from 'react';

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
    </div>
  );
}