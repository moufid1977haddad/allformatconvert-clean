'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ImagePixelatorPage() {
  const [image, setImage] = useState(null);
  const [pixelSize, setPixelSize] = useState(10);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };

  const apply = () => {
    setError('');
    const img = new Image();
    img.onerror = () => setError('Could not load image file');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const data = ctx.getImageData(x, y, 1, 1).data;
          ctx.fillStyle = `rgba(${data[0]},${data[1]},${data[2]},${data[3]/255})`;
          ctx.fillRect(x, y, pixelSize, pixelSize);
        }
      }
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Pixelator</h1>
        <p className="text-neutral-500 text-center mb-8">Add pixelate/mosaic effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Pixel Size: {pixelSize}px</label><input type="range" min="2" max="50" value={pixelSize} onChange={e => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Pixelate</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="pixelated.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Image Pixelator"
        description="Image Pixelator applies a mosaic effect across your entire image by averaging blocks of pixels at a size you choose, entirely in your browser using the canvas element. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the pixel size slider (2–50px) to set the block size.",
          "Click 'Apply Pixelate' to process the image.",
          "Click the download button to save your pixelated PNG image."
        ]}
        faqs={[
          { q: "Is Image Pixelator really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Pixelator support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is my image data secure and private?", a: "Yes, all processing happens locally in your browser — your image is never uploaded to a server." },
          { q: "Can I pixelate only a specific area, like a face?", a: "No, the effect is applied uniformly across the whole image — there's no selection tool for pixelating a specific region." }
        ]}
        tips={[
          "Use a larger pixel size for stronger privacy protection on sensitive details, and a smaller size for a subtler mosaic look.",
          "Since the effect applies to the whole image, crop out just the area you want obscured first if you don't want the rest pixelated.",
          "Try a couple of pixel sizes on a copy of your image to find the right balance between privacy and visibility.",
          "Pixelate one image at a time — there's no batch processing option."
        ]}
      />
    </div>
  );
}