'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function AddBorderToImagePage() {
  const [image, setImage] = useState(null);
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState('#000000');
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
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width + borderWidth * 2;
      canvas.height = img.height + borderWidth * 2;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, borderWidth, borderWidth);
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
        <h1 className="text-3xl font-bold text-center mb-2">Add Border to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Add decorative borders to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Border Width: {borderWidth}px</label><input type="range" min="1" max="100" value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Border Color</label><input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Add Border</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="bordered.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Add Border to Image"
        description="Add Border to Image lets you add a solid-color border of any width around a photo, entirely in your browser using the HTML canvas — your image is never uploaded to a server. Choose a border width and color, and download the result as a PNG."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the border width slider and pick a border color.",
          "Click 'Add Border' to apply it.",
          "Click the download button to save your bordered PNG image."
        ]}
        faqs={[
          { q: "What image formats does Add Border to Image support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is there a limit to the image size I can upload?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Can I adjust the border thickness?", a: "Yes, use the border width slider (1–100px) to set the thickness before applying." },
          { q: "Can I choose different border styles, like dashed or double?", a: "No, only a solid-color border is available — there's no dashed, dotted, or multi-layer style option." }
        ]}
        tips={[
          "Pick a border color that complements your image's dominant colors for a cleaner look.",
          "Use thicker borders for smaller images and thinner borders for larger images to keep the proportions balanced.",
          "Run your bordered image through the Round Corners tool afterward if you want rounded edges too.",
          "Since nothing is uploaded, download your result right away — it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}