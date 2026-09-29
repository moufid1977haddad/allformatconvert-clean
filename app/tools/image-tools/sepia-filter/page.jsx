'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
export default function SepiaFilterPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(100);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = await renderFull(raster, raster.width, raster.height, (ctx, drawSource, band) => {
        drawSource(ctx);
        const data = ctx.getImageData(0, 0, band.width, band.rows);
        const f = intensity / 100;
        for (let i = 0; i < data.data.length; i += 4) {
          const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
          data.data[i] = Math.min(255, r*(1-0.607*f) + g*0.769*f + b*0.189*f);
          data.data[i+1] = Math.min(255, r*0.349*f + g*(1-0.314*f) + b*0.168*f);
          data.data[i+2] = Math.min(255, r*0.272*f + g*0.534*f + b*(1-0.869*f));
        }
        ctx.putImageData(data, 0, 0);
      });
      setResult(resultOf(await encodeRasterLike(out, file.type), file.name, 'sepia'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Sepia Filter</h1>
        <p className="text-neutral-500 text-center mb-8">Apply sepia tone effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}%</label><input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Apply Sepia</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><a href={result.url} download={result.name} className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download</a></div>}
        </div>
      </div>
      <SeoContent
        title="Sepia Filter"
        description="Sepia Filter applies a warm, vintage brown tone to your photo using a standard sepia color matrix, with an adjustable intensity slider, entirely in your browser. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the intensity slider to set how strong the sepia effect is.",
          "Click 'Apply Sepia' to process the image.",
          "Click the download button to save your sepia-toned PNG image."
        ]}
        faqs={[
          { q: "Is Sepia Filter completely free to use?", a: "Yes, it's 100% free with no subscriptions required." },
          { q: "What image formats are supported?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
          { q: "Do you store my uploaded images?", a: "No, your images are processed directly in your browser and are never uploaded to a server." },
          { q: "Can I upload an image by pasting a URL?", a: "No, only file upload from your device is supported — there's no URL input option." }
        ]}
        tips={[
          "Use high-resolution source images since the sepia effect preserves the original resolution.",
          "Try different intensity levels to find the balance between original color and sepia tone that suits your photo.",
          "Sepia works especially well on portraits and landscapes for a nostalgic look.",
          "Download a few versions at different intensities if you want to compare before picking a favorite."
        ]}
      />
    </div>
  );
}