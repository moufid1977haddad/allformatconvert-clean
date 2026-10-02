'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
export default function AddVignettePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(50);
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
      const W = raster.width, H = raster.height;
      const out = await renderFull(raster, W, H, (ctx, drawSource) => {
        drawSource(ctx);
        const gradient = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W, H)/2);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${intensity/100})`);
        ctx.fillStyle = gradient;
        // P24 review (03/10): drawn only where the picture is (source-atop) — on a transparent PNG the dark veil used to
        // cover the empty areas too (a logo got a black halo)
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'vignette'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
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
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}%</label><input aria-label="Intensity (%)" type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Add Vignette</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
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
          { q: "What image formats does Add Vignette support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
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