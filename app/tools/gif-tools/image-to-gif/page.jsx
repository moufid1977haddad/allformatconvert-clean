'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ImageToGifPage() {
  const [images, setImages] = useState([]);
  const [delay, setDelay] = useState(200);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    const readers = files.map(f => new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: f.name, src: reader.result });
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => setImages(prev => [...prev, ...imgs]));
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const createGif = async () => {
    if (images.length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const canvas = document.createElement('canvas');
      const firstImg = new Image();
      await new Promise((res, rej) => { firstImg.onload = res; firstImg.onerror = rej; firstImg.src = images[0].src; });
      canvas.width = firstImg.width;
      canvas.height = firstImg.height;
      const ctx = canvas.getContext('2d');
      const gif = GIFEncoder();
      for (const image of images) {
        const im = new Image();
        await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = image.src; });
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, canvas.width, canvas.height, { palette, delay });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: images.length });
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Image to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Create animated GIF from multiple images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add images</p>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.src} className="w-full h-20 object-cover rounded border border-neutral-200" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  <p className="text-xs text-neutral-500 text-center">{i+1}</p>
                </div>
              ))}
            </div>
          )}
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input type="range" min="50" max="1000" value={delay} onChange={e => setDelay(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={createGif} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create GIF'}</button>
          {result && (
            <div className="space-y-3 text-center">
              <p className="text-green-600 font-semibold">GIF created ({result.frameCount} frames)</p>
              <img src={result.url} className="max-w-full mx-auto rounded-xl border border-neutral-200" />
              <a href={result.url} download="animated.gif" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download GIF</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image to GIF"
        description="Image to GIF assembles your uploaded images into a real, downloadable animated GIF file with an adjustable frame delay, using the gifenc library entirely in your browser — nothing is uploaded to a server. Each frame is quantized to its own 256-color palette; images with different dimensions are scaled to match the first image's size, which can stretch photos with a different aspect ratio."
        howTo={[
          "Click the upload area and add two or more images.",
          "Set your frame delay using the slider.",
          "Click \"Create GIF\", then preview and download the resulting animated GIF file."
        ]}
        faqs={[
          { q: "Does this create a downloadable GIF file directly?", a: "Yes — click \"Create GIF\" and a \"Download GIF\" button appears with the finished, real animated GIF file." },
          { q: "What image formats can I upload?", a: "Any format your browser supports, including JPG, PNG, BMP, GIF, and WebP." },
          { q: "Will photos look as good as flat graphics or icons?", a: "Simple, flat-color images tend to look best. The underlying encoder doesn't apply dithering, so photos or gradients with fine color detail may show some visible color banding after being reduced to a 256-color palette." },
          { q: "Is Image to GIF free to use?", a: "Yes, it's completely free with no account creation or login required." },
          { q: "Is my data private?", a: "Yes. Everything happens locally in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "Use images with the same dimensions to avoid any of them being stretched to fit the first image's size.",
          "For photos or images with smooth gradients, expect some color banding since the encoder doesn't dither — flat-color graphics and icons encode more cleanly.",
          "A shorter delay (50–150ms) creates faster, more fluid-looking motion; longer delays (300ms+) work well for slideshow-style GIFs.",
          "Keep the frame count and image resolution reasonable — a large number of high-resolution images takes longer to quantize and encode."
        ]}
      />
    </div>
  );
}