'use client';
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
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Duplicate Image Finder</h1>
        <p className="text-neutral-500 text-center mb-8">Find duplicate images in your collection</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{images.length > 0 ? images.length + ' images loaded' : 'Click to select multiple images'}</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => <div key={i} className="relative"><img src={img.data} className="w-full h-16 object-cover rounded" /><p className="text-xs text-neutral-500 truncate">{img.name}</p></div>)}
            </div>
          )}
          <button onClick={findDuplicates} disabled={images.length < 2} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Find Duplicates</button>
          {duplicates.length === 0 && images.length > 0 && <p className="text-green-400 text-center">No duplicates found!</p>}
          {duplicates.map(([a, b], i) => <div key={i} className="bg-red-900/30 rounded-xl p-3 text-sm"><span className="text-red-400">Duplicate: </span>{a} = {b}</div>)}
        </div>
      </div>
    </div>
  );
}