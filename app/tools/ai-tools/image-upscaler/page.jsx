'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function ImageUpscalerPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => { setImage(URL.createObjectURL(e.target.files[0])); setResult(null); setInfo(null); };

  const upscale = () => {
    if (!image) return;
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setResult(canvas.toDataURL('image/png'));
      setInfo({ original: img.width + 'x' + img.height, upscaled: canvas.width + 'x' + canvas.height });
      setLoading(false);
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Upscaler</h1>
        <p className="text-neutral-500 text-center mb-8">Upscale images up to 8x resolution</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <div><p className="text-neutral-400 text-sm">Click to upload an image</p><p className="text-neutral-300 text-xs mt-1">JPG, PNG, WEBP supported</p></div>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Scale Factor</label>
            <div className="flex gap-2">
              {[2, 3, 4, 6, 8].map(s => (
                <button key={s} onClick={() => setScale(s)} className={"flex-1 py-2 rounded-lg font-semibold text-sm transition " + (scale === s ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200')}>
                  {s}x
                </button>
              ))}
            </div>
          </div>
          <button onClick={upscale} disabled={!image || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Upscaling...' : 'Upscale Image'}
          </button>
          {info && (
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3">
                <div className="text-neutral-500 text-xs mb-1">Original</div>
                <div className="font-bold text-neutral-800">{info.original}</div>
              </div>
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-3">
                <div className="text-neutral-500 text-xs mb-1">Upscaled</div>
                <div className="font-bold text-indigo-600">{info.upscaled}</div>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-2">
              <img src={result} className="max-h-48 mx-auto rounded" />
              <a href={result} download="upscaled.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image Upscaler"
        description="Image Upscaler is a free online tool that enlarges your images entirely in your browser using the HTML canvas element with high-quality smoothing. Choose a scale factor from 2x to 8x and get a larger PNG instantly — everything runs locally on your device, so your image is never uploaded to a server. Note that this resizes and smooths the image rather than using AI to invent new detail, so very large scale factors will look softer than the original."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Choose your desired scale factor: 2x, 3x, 4x, 6x, or 8x.",
          "Click the 'Upscale Image' button to resize it instantly in your browser.",
          "Download your enlarged PNG image to your device."
        ]}
        faqs={[
          { q: "Is Image Upscaler really free to use?", a: "Yes, Image Upscaler is completely free with no hidden charges, subscriptions, or watermarks on your upscaled images." },
          { q: "What image formats are supported?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Does this use AI to add detail?", a: "No. Image Upscaler enlarges your image using the browser's built-in canvas smoothing rather than an AI super-resolution model, so it won't invent new detail — it's best for moderate enlargements rather than recovering fine detail from a very small source image." },
          { q: "Is my image uploaded to a server?", a: "No, everything happens locally in your browser. Your image is never sent to a server, which also means processing is instant." }
        ]}
        tips={[
          "For best results, start with the highest quality original image available.",
          "Use smaller scale factors like 2x or 3x for the sharpest-looking results; higher factors like 8x will look noticeably softer.",
          "Since processing happens in your browser, very large images at high scale factors may take a moment or use significant memory.",
          "Download your upscaled image right away, since it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}