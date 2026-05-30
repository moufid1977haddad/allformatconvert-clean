const fs = require('fs');
const path = require('path');

const tools = {
  'add-vignette': `'use client';
import { useState, useRef } from 'react';
export default function AddVignettePage() {
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(50);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, \`rgba(0,0,0,\${intensity/100})\`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Add Vignette</h1>
        <p className="text-neutral-400 text-center mb-8">Add vignette effect to images</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Intensity: {intensity}%</label><input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Add Vignette</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="vignette.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'duplicate-image-finder': `'use client';
import { useState, useRef } from 'react';
export default function DuplicateImageFinderPage() {
  const [images, setImages] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const inputRef = useRef();
  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const readers = files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, data: reader.result });
      reader.readAsDataURL(file);
    }));
    Promise.all(readers).then(setImages);
    setDuplicates([]);
  };
  const findDuplicates = () => {
    const seen = {};
    const dups = [];
    images.forEach(img => {
      const key = img.data.slice(0, 100);
      if (seen[key]) dups.push([seen[key], img.name]);
      else seen[key] = img.name;
    });
    setDuplicates(dups);
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Duplicate Image Finder</h1>
        <p className="text-neutral-400 text-center mb-8">Find duplicate images in your collection</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-400">{images.length > 0 ? images.length + ' images loaded' : 'Click to select multiple images'}</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => <div key={i} className="relative"><img src={img.data} className="w-full h-16 object-cover rounded" /><p className="text-xs text-neutral-400 truncate">{img.name}</p></div>)}
            </div>
          )}
          <button onClick={findDuplicates} disabled={images.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Find Duplicates</button>
          {duplicates.length === 0 && images.length > 0 && <p className="text-green-400 text-center">No duplicates found!</p>}
          {duplicates.map(([a, b], i) => <div key={i} className="bg-red-900/30 rounded-xl p-3 text-sm"><span className="text-red-400">Duplicate: </span>{a} = {b}</div>)}
        </div>
      </div>
    </div>
  );
}`,

  'tiff-to-png': `'use client';
import { useState, useRef } from 'react';
export default function TiffToPngPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to PNG</h1>
        <p className="text-neutral-400 text-center mb-8">Convert TIFF images to PNG</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert to PNG</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'tiff-to-jpg': `'use client';
import { useState, useRef } from 'react';
export default function TiffToJpgPage() {
  const [image, setImage] = useState(null);
  const [quality, setQuality] = useState(90);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); };
  const convert = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/jpeg', quality/100));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to JPG</h1>
        <p className="text-neutral-400 text-center mb-8">Convert TIFF images to JPG</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-400 mb-1">Quality: {quality}%</label><input type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Convert to JPG</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.jpg" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download JPG</a></div>}
        </div>
      </div>
    </div>
  );
}`,

  'image-cropper': `'use client';
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Cropper</h1>
        <p className="text-neutral-400 text-center mb-8">Crop images with custom dimensions</p>
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img ref={imgRef} src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-400">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {image && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-neutral-400 mb-1">X: {crop.x}px</label><input type="range" min="0" max="500" value={crop.x} onChange={e => setCrop(p => ({...p, x: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-400 mb-1">Y: {crop.y}px</label><input type="range" min="0" max="500" value={crop.y} onChange={e => setCrop(p => ({...p, y: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-400 mb-1">Width: {crop.w}px</label><input type="range" min="10" max="1000" value={crop.w} onChange={e => setCrop(p => ({...p, w: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-400 mb-1">Height: {crop.h}px</label><input type="range" min="10" max="1000" value={crop.h} onChange={e => setCrop(p => ({...p, h: parseInt(e.target.value)}))} className="w-full" /></div>
            </div>
          )}
          <button onClick={applyCrop} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 rounded-xl py-3 font-semibold transition">Crop Image</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="cropped.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
    </div>
  );
}`,
};

const basePath = 'app/tools/image-tools';
Object.entries(tools).forEach(([name, content]) => {
  const filePath = path.join(basePath, name, 'page.jsx');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Created: ' + filePath);
});
console.log('All remaining image tools created!');