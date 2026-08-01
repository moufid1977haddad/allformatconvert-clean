'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageMetadataPage() {
  const [metadata, setMetadata] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const analyze = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setMetadata(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    const img = new Image();
    img.onload = () => {
      setMetadata({ name: file.name, size: (file.size/1024).toFixed(2) + ' KB', type: file.type, width: img.width + ' px', height: img.height + ' px', lastModified: new Date(file.lastModified).toLocaleString() });
    };
    img.onerror = () => setError('Could not load image file');
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
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {metadata && <div className="space-y-2">{Object.entries(metadata).map(([k,v]) => <div key={k} className="flex justify-between bg-neutral-50 rounded-lg border border-neutral-200 p-3"><span className="text-neutral-500 capitalize">{k}</span><span className="text-indigo-400 font-mono">{v}</span></div>)}</div>}
        </div>
      </div>
      <SeoContent
        title="Image Metadata Viewer"
        description="Image Metadata Viewer reads basic file information from an image you upload — file name, file size, MIME type, pixel dimensions, and last-modified date — entirely in your browser. It does not parse embedded EXIF data, so it can't show camera settings, GPS location, or other camera-recorded metadata."
        howTo={[
          "Click the upload area and select an image from your device.",
          "The tool reads the file's properties automatically once selected.",
          "View the extracted information — name, size, type, dimensions, and last-modified date.",
          "Upload a different image to view its properties instead."
        ]}
        faqs={[
          { q: "Is my image data stored on your servers?", a: "No, the file's properties are read directly in your browser. Your image is never uploaded to a server." },
          { q: "Does this tool show EXIF data like camera settings or GPS location?", a: "No. It only reads basic browser-accessible file properties (name, size, type, dimensions, last-modified date) — it does not parse the image's embedded EXIF metadata." },
          { q: "Can I remove metadata from my images with this tool?", a: "No, this tool only displays basic file properties — it doesn't offer a way to strip EXIF data from a file." },
          { q: "What file formats does the tool support?", a: "It accepts common image formats your browser can open, such as JPG, PNG, GIF, and WebP." }
        ]}
        tips={[
          "If you need to inspect actual EXIF data — like GPS coordinates or camera settings — use a dedicated EXIF viewer, since this tool doesn't read that data.",
          "The 'last modified' date reflects your local file's timestamp, not necessarily when the photo was taken.",
          "Use this tool for a quick check of an image's pixel dimensions and file size before uploading it elsewhere.",
          "Check one image at a time — there's no batch view for comparing multiple files."
        ]}
      />
    </div>
  );
}