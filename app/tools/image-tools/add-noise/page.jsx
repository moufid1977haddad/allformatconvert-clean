'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';

export default function AddNoisePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(30);
  const [colour, setColour] = useState(false); // P24 (03/10): colour noise, as pinetools ("Monochromatic" off)
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type);
    setResult(null);
    setError('');
  };

  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = await renderFull(raster, raster.width, raster.height, (ctx, drawSource, band) => {
        drawSource(ctx);
        const data = ctx.getImageData(0, 0, band.width, band.rows);
        // P17: Math.random() per pixel took most of the time; xorshift32 (seeded from the system's generator) gives
        // uniform whole-number noise in [-intensity, +intensity] -- the values the old version rounded to -- in
        // integer arithmetic only. The clamped array keeps each value in 0-255 as Math.min/Math.max did.
        const d = data.data, n = intensity * 2 + 1;
        let s = crypto.getRandomValues(new Uint32Array(1))[0] | 1;
        for (let i = 0; i < d.length; i += 4) {
          s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
          const noise = (((s >>> 16) * n) >>> 16) - intensity;
          if (!colour) { d[i] = d[i] + noise; d[i + 1] = d[i + 1] + noise; d[i + 2] = d[i + 2] + noise; }
          else {
            d[i] = d[i] + noise;
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5; d[i + 1] = d[i + 1] + ((((s >>> 16) * n) >>> 16) - intensity);
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5; d[i + 2] = d[i + 2] + ((((s >>> 16) * n) >>> 16) - intensity);
          }
        }
        ctx.putImageData(data, 0, 0);
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'noise'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
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
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}</label><input aria-label="Intensity" type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <label className="flex items-center gap-2 text-sm text-neutral-600"><input id="noise-colour" type="checkbox" checked={colour} onChange={(e) => setColour(e.target.checked)} /> Colour noise (each colour channel its own grain)</label>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Add Noise</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
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
          { q: "What image formats does Add Noise support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
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