'use client';
import { useState, useRef } from 'react';

export default function ImageUpscalerPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); setInfo(null); };

  const upscale = () => {
    if (!image) return;
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setResult(canvas.toDataURL('image/png'));
      setInfo({ original: img.width + 'x' + img.height, upscaled: canvas.width + 'x' + canvas.height });
      setLoading(false);
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Upscaler</h1>
        <p className="text-neutral-500 text-center mb-8">Upscale images up to 8x resolution</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <div><p className="text-neutral-400 text-sm">Click to upload an image</p><p className="text-neutral-300 text-xs mt-1">JPG, PNG, WEBP supported</p></div>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Scale Factor</label>
            <div className="flex gap-2">
              {[2, 3, 4, 6, 8].map(s => (
                <button key={s} onClick={() => setScale(s)} className={"flex-1 py-2 rounded-lg font-semibold text-sm transition " + (scale === s ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <button onClick={upscale} disabled={!image || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Upscaling...' : 'Upscale Image'}
          </button>
          {info && (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3">
                <div className="text-neutral-500 text-xs mb-1">Original</div>
                <div className="font-bold text-neutral-800">{info.original}</div>
              </div>
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3">
                <div className="text-neutral-500 text-xs mb-1">Upscaled</div>
                <div className="font-bold text-indigo-600">{info.upscaled}</div>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download="upscaled.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
    </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Upscaler</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Image Upscaler tool. No signup required, no watermark, works on all devices.</p>
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