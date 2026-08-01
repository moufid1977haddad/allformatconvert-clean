'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageBlurPage() {
  const [image, setImage] = useState(null);
  const [blur, setBlur] = useState(5);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setResult(null); setError(''); } };
  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.filter = `blur(${blur}px)`;
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
      setError('');
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Blur</h1>
        <p className="text-neutral-500 text-center mb-8">Add blur effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Blur: {blur}px</label><input type="range" min="1" max="20" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Blur</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="blurred.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Image Blur"
        description="Image Blur applies a uniform blur effect across your entire image using the browser's built-in canvas blur filter, with an adjustable intensity from 1 to 20 pixels. Everything happens locally on your device — your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the blur slider (1–20px) to set the blur intensity.",
          "Click 'Apply Blur' to process the image.",
          "Click the download button to save your blurred PNG image."
        ]}
        faqs={[
          { q: "Is Image Blur really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Blur support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Will my uploaded images be stored or shared?", a: "No, your images are processed entirely in your browser and are never uploaded to a server." },
          { q: "Can I blur only specific parts of my image, like a face?", a: "No, the blur is applied uniformly across the whole image — there's no selection tool for blurring specific regions or faces." }
        ]}
        tips={[
          "Use a lower blur value (2–6px) for a subtle softening effect, and higher values for a stronger privacy effect.",
          "Since blurring applies to the whole image, crop out the sensitive area first if you only want to obscure part of a photo.",
          "There's a single blur algorithm — try different intensity values rather than looking for a 'blur type' setting.",
          "Download your result before navigating away, since it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}