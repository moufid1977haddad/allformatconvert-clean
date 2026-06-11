'use client';
import { useState, useRef } from 'react';
export default function ImageMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setMetadata({ name: file.name, size: (file.size/1024).toFixed(2) + ' KB', type: file.type, width: img.width + ' px', height: img.height + ' px', lastModified: new Date(file.lastModified).toLocaleString() });
    };
    img.src = url;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Metadata Viewer</h1>
        <p className="text-neutral-500 text-center mb-8">View image metadata and EXIF data</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {preview ? <img src={preview} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={analyze} />
          </div>
          {metadata && <div className="space-y-2">{Object.entries(metadata).map(([k,v]) => <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 capitalize">{k}</span><span className="text-indigo-400 font-mono">{v}</span></div>)}</div>}
        </div>
      </div>
    </div>
  );
}