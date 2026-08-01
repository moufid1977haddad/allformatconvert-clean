'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageInverterPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setResult(null); setError(''); } };
  const invert = () => {
    setError('');
    const img = new Image();
    img.onerror = () => setError('Could not load image file');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        data.data[i] = 255 - data.data[i];
        data.data[i+1] = 255 - data.data[i+1];
        data.data[i+2] = 255 - data.data[i+2];
      }
      ctx.putImageData(data, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Inverter</h1>
        <p className="text-neutral-500 text-center mb-8">Invert image colors</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={invert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Invert Colors</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="inverted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Image Inverter"
        description="Image Inverter creates a photo-negative effect by subtracting each pixel's red, green, and blue values from 255, entirely in your browser. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Click 'Invert Colors' to process the image.",
          "Preview the inverted result.",
          "Click the download button to save your inverted PNG image."
        ]}
        faqs={[
          { q: "What file formats does Image Inverter support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is there a file size limit for uploading images?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Do I need to create an account to use Image Inverter?", a: "No, it's completely free and requires no account or login." },
          { q: "Can I invert multiple images at once?", a: "No, the tool processes one image at a time — there's no batch upload." }
        ]}
        tips={[
          "Inverted images can make for striking, high-contrast visuals for social posts or graphics.",
          "Try inverting black-and-white photos for unusual, artistic results.",
          "Download both the original and inverted versions if you want to compare them side by side.",
          "Invert one image at a time and download each before starting the next."
        ]}
      />
    </div>
  );
}