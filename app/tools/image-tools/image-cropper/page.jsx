'use client';
import { useState, useRef } from 'react';
export default function ImageCropperPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  const inputRef = useRef();
  const imgRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const applyCrop = () => {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement('canvas');
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    canvas.width = crop.w * scaleX;
    canvas.height = crop.h * scaleY;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, 0, 0, canvas.width, canvas.height);
    setResult(canvas.toDataURL('image/png'));
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Cropper</h1>
        <p className="text-neutral-500 text-center mb-8">Crop images with custom dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img ref={imgRef} src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {image && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-neutral-500 mb-1">X: {crop.x}px</label><input type="range" min="0" max="500" value={crop.x} onChange={e => setCrop(p => ({...p, x: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Y: {crop.y}px</label><input type="range" min="0" max="500" value={crop.y} onChange={e => setCrop(p => ({...p, y: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Width: {crop.w}px</label><input type="range" min="10" max="1000" value={crop.w} onChange={e => setCrop(p => ({...p, w: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Height: {crop.h}px</label><input type="range" min="10" max="1000" value={crop.h} onChange={e => setCrop(p => ({...p, h: parseInt(e.target.value)}))} className="w-full" /></div>
            </div>
          )}
          <button onClick={applyCrop} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Crop Image</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="cropped.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}