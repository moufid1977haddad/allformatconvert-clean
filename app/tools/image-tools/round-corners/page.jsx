'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function RoundCornersPage() {
  const [image, setImage] = useState(null);
  const [radius, setRadius] = useState(20);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (e) => {
    setImage(URL.createObjectURL(e.target.files[0]));
    setResult(null);
  };

  const apply = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      const r = (radius / 100) * Math.min(img.width, img.height) / 2;
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.lineTo(img.width - r, 0);
      ctx.quadraticCurveTo(img.width, 0, img.width, r);
      ctx.lineTo(img.width, img.height - r);
      ctx.quadraticCurveTo(img.width, img.height, img.width - r, img.height);
      ctx.lineTo(r, img.height);
      ctx.quadraticCurveTo(0, img.height, 0, img.height - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      setResult(canvas.toDataURL('image/png'));
    };
    img.src = image;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Round Corners</h1>
        <p className="text-neutral-500 text-center mb-8">Add rounded corners to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Corner Radius: {radius}%</label><input type="range" min="1" max="50" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Apply Round Corners</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="rounded.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Round Corners"
        description="Round Corners clips your image to a rounded-rectangle shape at a radius you choose, entirely in your browser using the canvas element — your image is never uploaded to a server. The clipped-away areas become transparent, so the output is always a PNG."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the corner radius slider (1–50%) to set how rounded the corners are.",
          "Click 'Apply Round Corners' to process the image.",
          "Click the download button to save your rounded PNG image."
        ]}
        faqs={[
          { q: "What image formats does Round Corners support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file so the rounded corners can be transparent." },
          { q: "Is there a file size limit for uploading images?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Can I adjust the corner radius independently for each corner?", a: "No, the same radius is applied to all four corners — there's no per-corner control." },
          { q: "Do I need to create an account to use Round Corners?", a: "No, it's completely free with no account or login required." }
        ]}
        tips={[
          "Use a radius around 10–15% for subtle rounding on profile pictures and thumbnails.",
          "Try higher radius values (20–30%+) for a softer, more contemporary look.",
          "Preview the result before downloading to make sure the rounding doesn't cut off important content near the edges.",
          "Since the output is a transparent PNG, it layers well on top of colored backgrounds in web or graphic design."
        ]}
      />
    </div>
  );
}