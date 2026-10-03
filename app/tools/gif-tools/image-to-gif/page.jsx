'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { writeRgbaFrame, hasTransparency } from '../../../lib/gifEncode';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';

// Audit 2 (29/09): transparent PNGs came out on black (gifenc's default quantizer ignores alpha), and every image was
// stretched to the size of the first. Now transparency is kept (1-bit, as GIF allows) and, as on ezgif and in our
// GIF Maker, an image of another shape is fitted inside the GIF (transparent around it) or cropped to fill it;
// stretching stays available on request.
const FITS = [['fit', 'Fit (keep proportions, transparent around)'], ['fill', 'Crop to fill (keep proportions)'], ['stretch', 'Stretch to the first image']];
function place(w, h, W, H, fit) {
  if (fit === 'stretch') return { dx: 0, dy: 0, dw: W, dh: H };
  const k = fit === 'fill' ? Math.max(W / w, H / h) : Math.min(W / w, H / h);
  const dw = w * k, dh = h * k;
  return { dx: (W - dw) / 2, dy: (H - dh) / 2, dw, dh };
}
export default function ImageToGifPage() {
  const [images, setImages] = useState([]);
  const [delay, setDelay] = useState(200);
  const [fit, setFit] = useState('fit');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = '';
    setError('');
    // P21 (robustness): each picture is opened first; an empty or unreadable one is named, never added silently.
    const readers = files.map(f => new Promise(resolve => {
      if (!f.size) { resolve({ name: f.name, bad: 'empty (0 bytes)' }); return; }
      const reader = new FileReader();
      reader.onerror = () => resolve({ name: f.name, bad: 'could not be read' });
      reader.onload = () => {
        const im = new Image();
        im.onload = () => resolve(im.naturalWidth * im.naturalHeight > 100_000_000 ? { name: f.name, bad: `too large (${im.naturalWidth} × ${im.naturalHeight} pixels)` } : { name: f.name, src: reader.result });
        im.onerror = () => resolve({ name: f.name, bad: 'is not an image this browser can open' });
        im.src = reader.result;
      };
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(imgs => {
      const bad = imgs.filter((x) => x.bad);
      if (bad.length) setError(bad.map((x) => `${x.name}: ${x.bad}.`).join(' ') + ' Choose JPG, PNG, WebP or GIF pictures.');
      setImages(prev => [...prev, ...imgs.filter((x) => !x.bad)]);
    });
  };

  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const createGif = async () => {
    setError('');
    if (images.length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const gifenc = await import('gifenc');
      const load = (src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('One of the images could not be read.')); im.src = src; });
      const imgs = [];
      for (const image of images) imgs.push(await load(image.src));
      const canvas = document.createElement('canvas');
      // Never above 1920 px on a side (ezgif's limit, as GIF Maker): a phone photo as the first frame made a 24-48 Mpx
      // GIF, which iOS cannot even hold on a canvas (16.7 Mpx), and no GIF viewer needs (30/09).
      const k0 = Math.min(1, 1920 / Math.max(imgs[0].naturalWidth, imgs[0].naturalHeight));
      canvas.width = Math.max(1, Math.round(imgs[0].naturalWidth * k0));
      canvas.height = Math.max(1, Math.round(imgs[0].naturalHeight * k0));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const frames = imgs.map((im) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const p = place(im.naturalWidth, im.naturalHeight, canvas.width, canvas.height, fit);
        ctx.drawImage(im, p.dx, p.dy, p.dw, p.dh);
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      });
      const dispose = frames.some(hasTransparency) ? 2 : -1;
      const gif = gifenc.GIFEncoder();
      for (const data of frames) writeRgbaFrame(gif, gifenc, data, canvas.width, canvas.height, { delay, dispose });
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: images.length });
    } catch(e) { setError((e && e.message) || 'This file could not be converted. It may be damaged.'); } // P21: a message on the page, not a blocking alert()
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
                  <img alt="Preview of your image" src={img.src} className="w-full h-20 object-cover rounded border border-neutral-200" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">x</button>
                  <p className="text-xs text-neutral-500 text-center">{i+1}</p>
                </div>
              ))}
            </div>
          )}
          <label className="block text-sm"><span className="block text-neutral-500 mb-1">Images of another shape than the first</span>
            <select value={fit} onChange={e => { setFit(e.target.value); setResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2">{FITS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <div><label className="block text-sm text-neutral-500 mb-1">Frame Delay: {delay}ms</label><input aria-label="Frame Delay (ms)" type="range" min="50" max="1000" value={delay} onChange={e => setDelay(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={createGif} disabled={images.length < 2 || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Creating...' : 'Create GIF'}</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && (
            <div className="space-y-3 text-center">
              <p className="text-green-600 font-semibold">GIF created ({result.frameCount} frames)</p>
              <img alt="Preview of your image" src={result.url} className="max-w-full mx-auto rounded-xl border border-neutral-200" />
              <FileDownload href={result.url} name="animated.gif" />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Image to GIF"
        description="Image to GIF turns a batch of photos already sitting on your device into one animated GIF file, processed entirely client-side with the gifenc library so nothing leaves your browser. Playback uses a single adjustable delay you control with a slider, and colors are quantized per-frame to a 256-color palette. The GIF takes the size of your first image; an image of another shape is fitted inside it without distortion (transparent around it), cropped to fill it, or stretched, as you choose. Transparent areas of PNG images stay transparent."
        howTo={[
          "Click the upload area and add two or more images.",
          "Remove any image you don't want with the \"x\" on its thumbnail — the rest keep their order.",
          "Set your frame delay using the slider.",
          "Click \"Create GIF\", then preview and download the resulting animated GIF file."
        ]}
        faqs={[
          { q: "Does this create a downloadable GIF file directly?", a: "Yes — click \"Create GIF\" and a \"Download\" button appears with the finished, real animated GIF file." },
          { q: "What image formats can I upload?", a: "Any format your browser supports, including JPG, PNG, BMP, GIF, and WebP." },
          { q: "Will photos look as good as flat graphics or icons?", a: "Simple, flat-color images tend to look best. The underlying encoder doesn't apply dithering, so photos or gradients with fine color detail may show some visible color banding after being reduced to a 256-color palette." },
          { q: "Is Image to GIF free to use?", a: "Yes, it's completely free with no account creation or login required." },
          { q: "Is my data private?", a: "Yes. Everything happens locally in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "The GIF takes the first image's shape and size (at most 1920 px on a side, like ezgif): put the image with the shape you want first, and choose \"Crop to fill\" if you don't want transparent borders.",
          "High-resolution photos and large batches take longer to quantize and encode; downscale first if the conversion feels slow.",
          "Expect some color banding on photos with smooth gradients or skin tones, since the 256-color palette is applied per frame without dithering.",
          "The finished GIF and its frame count are shown before you download, so you can re-run with a different delay if the timing feels off."
        ]}
      />
    </div>
  );
}