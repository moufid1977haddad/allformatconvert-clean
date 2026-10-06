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
        description="Image to GIF is the simple way to turn a handful of pictures into a looping GIF: add them, set one delay, click once. The first image sets the shape and size of the GIF, scaled down to 1920 px on its longest side if needed. Pictures of another shape are fitted with transparent borders, cropped to fill, or stretched. Unlike GIF Maker, transparency is kept: mostly transparent pixels stay transparent. The GIF loops forever and every frame lasts the same time. An animated GIF or WebP you add counts as its first frame only. gifenc encodes the GIF in this tab."
        howToTitle="How to turn images into a GIF"
        howTo={[
          "Click \"Click to add images\" and choose at least two pictures, in the order they should play.",
          "Remove a picture with the x on its thumbnail; the others keep their order.",
          "Choose \"Images of another shape than the first\" and set \"Frame Delay\" with the slider.",
          "Click \"Create GIF\" and check the preview and the frame count.",
          "Click \"Download\" to keep the looping GIF, named animated.gif."
        ]}
        specs={[
          { label: "Input", value: "JPG, PNG, WebP, BMP, GIF (first frame only) and other images your browser opens" },
          { label: "Output", value: "Looping GIF, saved as animated.gif" },
          { label: "GIF size", value: "That of the first image, at most 1920 px on the longest side" },
          { label: "Each picture", value: "Up to 100 megapixels" },
          { label: "Delay", value: "One delay for every frame, 50 to 1000 ms" },
          { label: "Transparency", value: "Kept as 1-bit: each pixel fully transparent or fully opaque" }
        ]}
        privacy="Your pictures are decoded by the browser and the GIF is encoded with gifenc on this page, so they are not uploaded. Should an error appear, we receive its cleaned text, the tool name and the browser name and version, but no picture and no file name."
        faqs={[
          { q: "Can I use a transparent PNG?", a: "Yes. Transparency is kept the way GIF allows it: a pixel is either fully transparent or fully opaque, so mostly transparent pixels become transparent and soft edges turn hard. The borders added around a picture of another shape are transparent too." },
          { q: "Can I use an animated GIF as input?", a: "No, only its first frame is used here. To split an animated GIF into its frames and mix them with photos, use GIF Maker, which takes up to 300 frames from each GIF." },
          { q: "Can I change the order or give frames different durations?", a: "No. Pictures play in the order you added them and share one \"Frame Delay\"; removing one keeps the others in order. GIF Maker has reordering, per-frame durations, a background color and a repeat setting." },
          { q: "Will photos look smooth?", a: "No, not always. Each frame is reduced to a palette of up to 256 colors without dithering, so skies, skin and gradients can show bands, while logos, icons and flat drawings usually come out clean." }
        ]}
        tips={[
          "Put the picture with the shape you want first: it decides the size of the GIF."
        ]}
      />
    </div>
  );
}