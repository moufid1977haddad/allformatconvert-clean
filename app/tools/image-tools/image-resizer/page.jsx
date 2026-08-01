'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageResizerPage() {
  const [image, setImage] = useState(null);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setError(''); const url = URL.createObjectURL(f); setImage(url); const img = new Image(); img.onload = () => { setWidth(img.width); setHeight(img.height); }; img.onerror = () => setError('Could not load image file'); img.src = url; setResult(null); } };
  const resize = () => {
    setError('');
    const img = new Image();
    img.onerror = () => setError('Could not load image file');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Resizer</h1>
        <p className="text-neutral-500 text-center mb-8">Resize images to specific dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Width (px)</label><input type="number" value={width} onChange={e => setWidth(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Height (px)</label><input type="number" value={height} onChange={e => setHeight(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
          </div>
          <button onClick={resize} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Resize</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="resized.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Image Resizer"
        description="Image Resizer lets you set an exact pixel width and height and redraws your image at that size, entirely in your browser using the canvas element — your image is never uploaded to a server. It pre-fills the fields with your image's original dimensions, which you can then edit."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Edit the width and height fields to your target pixel dimensions.",
          "Click 'Resize' to process the image.",
          "Click the download button to save your resized PNG image."
        ]}
        faqs={[
          { q: "What image formats does Image Resizer support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is there a limit to how large an image I can resize?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Does it have preset sizes for Instagram, Twitter, or Facebook?", a: "No, there are no built-in presets — you enter the exact width and height in pixels yourself." },
          { q: "Do you store my images after I resize them?", a: "No, Image Resizer processes everything locally and never uploads your file to a server." }
        ]}
        tips={[
          "There's no aspect-ratio lock, so calculate proportional dimensions yourself if you want to avoid stretching or squashing the image.",
          "For common social sizes, enter the target dimensions manually — for example 1080x1080 for a square Instagram post.",
          "Resizing to smaller dimensions reduces the pixel count but the output is still saved as an uncompressed PNG, which may be larger than the original file.",
          "Resize one image at a time — there's no batch or queue feature."
        ]}
      />
    </div>
  );
}