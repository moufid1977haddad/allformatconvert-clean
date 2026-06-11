'use client';
import { useState, useRef } from 'react';
export default function GifMakerPage() {
  const [images, setImages] = useState([]);
  const [delay, setDelay] = useState(200);
  const [result, setResult] = useState(null);
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

  const createGif = async () => {
    if (images.length < 2) return;
    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      await new Promise(r => { img.onload = r; img.src = images[0].src; });
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      const frames = [];
      for (const image of images) {
        const im = new Image();
        await new Promise(r => { im.onload = r; im.src = image.src; });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/png'));
      }
      setResult({ frames, delay });
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF Maker</h1>
        <p className="text-neutral-500 text-center mb-8">Create animated GIF from images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images for GIF frames</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.src} className="w-full h-20 object-cover rounded" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  <p className="text-xs text-neutral-500 text-center">{i+1}</p>
                </div>
              ))}
            </div>
          )}
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input type="range" min="50" max="1000" value={delay} onChange={e => setDelay(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={createGif} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Preview GIF'}</button>
          {result && (
            <div className="text-center space-y-3">
              <p className="text-green-400">Preview frames ({result.frames.length} frames at {result.delay}ms)</p>
              <div className="grid grid-cols-4 gap-2">
                {result.frames.map((f, i) => <img key={i} src={f} className="w-full rounded" />)}
              </div>
              <p className="text-neutral-500 text-sm">Note: Download individual frames and use an online GIF assembler for the final GIF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}