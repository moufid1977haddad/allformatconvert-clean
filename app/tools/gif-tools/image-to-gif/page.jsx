'use client';
import { useState, useRef } from 'react';
export default function ImageToGifPage() {
  const [images, setImages] = useState([]);
  const [delay, setDelay] = useState(200);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: f.name, src: reader.result });
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => setImages(prev => [...prev, ...imgs]));
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const createPreview = async () => {
    if (images.length < 2) return;
    setLoading(true);
    const canvas = document.createElement('canvas');
    const img = new Image();
    await new Promise(r => { img.onload = r; img.src = images[0].src; });
    canvas.width = img.width; canvas.height = img.height;
    setPreview(images.map(i => i.src));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Image to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Create animated GIF from multiple images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.src} className="w-full h-20 object-cover rounded border border-neutral-200" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  <p className="text-xs text-neutral-500 text-center">{i+1}</p>
                </div>
              ))}
            </div>
          )}
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input type="range" min="50" max="1000" value={delay} onChange={e => setDelay(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={createPreview} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create GIF Preview'}</button>
          {preview && (
            <div className="space-y-3 text-center">
              <p className="text-green-600 font-semibold">Preview frames ready ({preview.length} frames)</p>
              <div className="grid grid-cols-4 gap-2">
                {preview.map((src, i) => <img key={i} src={src} className="w-full rounded border border-neutral-200" />)}
              </div>
              <p className="text-neutral-500 text-xs">Download each frame and use an online GIF assembler</p>
              <div className="grid grid-cols-2 gap-2">
                {preview.map((src, i) => <a key={i} href={src} download={"frame-" + (i+1) + ".png"} className="block text-center bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg py-1 text-sm transition text-neutral-600">Download Frame {i+1}</a>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}