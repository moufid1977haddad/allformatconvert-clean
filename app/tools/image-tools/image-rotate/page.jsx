'use client';
import { useState, useRef } from 'react';
export default function ImageRotatePage() {
  const [image, setImage] = useState(null);
  const [angle, setAngle] = useState(90);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; if (f) { setImage(URL.createObjectURL(f)); setResult(null); } };
  const rotate = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const rad = angle * Math.PI / 180;
      const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad));
      canvas.width = img.height * sin + img.width * cos;
      canvas.height = img.height * cos + img.width * sin;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width/2, -img.height/2);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Rotate</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate images by any angle</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={`px-4 py-2 rounded-lg font-semibold transition ${angle===a?'bg-indigo-600':'bg-neutral-800 hover:bg-neutral-100'}`}>{a}°</button>)}</div>
          <div><label className="block text-sm text-neutral-500 mb-1">Custom angle: {angle}°</label><input type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={rotate} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Rotate</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="rotated.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>

      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Rotate</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Free online Image Rotate tool. No signup required, no watermark, works on all devices.</p>
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