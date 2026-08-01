'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function AddVignettePage() {
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(50);
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
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height)/2);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, `rgba(0,0,0,${intensity/100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        <h1 className="text-3xl font-bold text-center mb-2">Add Vignette</h1>
        <p className="text-neutral-500 text-center mb-8">Add vignette effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}%</label><input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Add Vignette</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="vignette.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Add Vignette"
        description="Add Vignette darkens the edges of your image with a radial gradient to draw focus toward the center, entirely in your browser. Adjust the intensity with a single slider — your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the intensity slider to control how dark the edges become.",
          "Click 'Add Vignette' to apply the effect.",
          "Click the download button to save your image with the vignette applied."
        ]}
        faqs={[
          { q: "What image formats does Add Vignette support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Is there a file size limit for uploading images?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Can I control how far the darkening extends from the edges?", a: "No, there's a single intensity slider — the radial gradient always spans from the image's edges to its center, with no separate size control." },
          { q: "Will the vignette effect reduce image quality?", a: "No, the effect is drawn on top of your original image at full resolution, so no quality is lost in the process." }
        ]}
        tips={[
          "Start with a lower intensity and increase it gradually to avoid an overdone look.",
          "Vignettes work especially well on portraits, naturally drawing the eye toward the subject's face.",
          "Combine with the Sepia Filter or Brightness/Contrast tools for a more stylized final look.",
          "Since nothing is uploaded, download your result right away — it isn't saved anywhere after you leave the page."
        ]}
      />
    </div>
  );
}