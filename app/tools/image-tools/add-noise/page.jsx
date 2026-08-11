'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';

export default function AddNoisePage() {
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(30);
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
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const noise = (Math.random() - 0.5) * intensity * 2;
        data.data[i] = Math.min(255, Math.max(0, data.data[i] + noise));
        data.data[i+1] = Math.min(255, Math.max(0, data.data[i+1] + noise));
        data.data[i+2] = Math.min(255, Math.max(0, data.data[i+2] + noise));
      }
      ctx.putImageData(data, 0, 0);
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
        <h1 className="text-3xl font-bold text-center mb-2">Add Noise</h1>
        <p className="text-neutral-500 text-center mb-8">Add film grain effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}</label><input type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Add Noise</button>
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="noisy.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Add Noise"
        description="Add Noise applies a random film-grain effect to your image by adding random variation to each pixel's brightness, entirely in your browser. It's a single adjustable-intensity effect — not a choice of different noise types — and your image never leaves your device."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the intensity slider to control how much grain is added.",
          "Click 'Add Noise' to apply the effect.",
          "Click the download button to save your noisy PNG image."
        ]}
        faqs={[
          { q: "Is Add Noise completely free to use?", a: "Yes, Add Noise is completely free with no watermarks or subscriptions required." },
          { q: "What image formats does Add Noise support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The output is always a PNG file." },
          { q: "Can I choose between different noise types like Gaussian or salt-and-pepper?", a: "No, there's a single grain effect with an adjustable intensity slider — no separate noise-type selector." },
          { q: "Is my image data secure and private?", a: "Yes — everything happens locally in your browser. Your image is never uploaded to a server." }
        ]}
        tips={[
          "Start with a lower intensity and increase it gradually to find the right balance for your image.",
          "Add Noise works well on photos with good lighting and clear subjects, since grain can obscure fine detail on darker images.",
          "Re-upload your original image if you want to try a different intensity from scratch.",
          "Use a lighter touch on portraits and a heavier one on landscapes or artistic shots for a more dramatic effect."
        ]}
      />
    </div>
  );
}