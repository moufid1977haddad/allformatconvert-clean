'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function AddVignettePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(50);
  const [size, setSize] = useState(0); // P24 (03/10): the clear centre's size, % of the radius (pinetools: "Size")
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
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
        if (size > 0) gradient.addColorStop(Math.min(0.95, size / 100), 'rgba(0,0,0,0)');
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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}%</label><input aria-label="Intensity (%)" type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Clear centre: {size}%</label><input id="vig-size" aria-label="Clear centre size (%)" type="range" min="0" max="90" value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Add Vignette</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Add Vignette"
        description={"Add Vignette darkens a picture toward its edges with a smooth black radial gradient, a classic way to draw the eye to the subject. The gradient starts at the center and reaches its full strength at a distance of half the longer side, so the corners of a wide photo are the darkest areas. Intensity sets how dark that is; Clear centre keeps a middle zone untouched before the darkening begins. Transparent areas are not darkened, so a logo gets no black halo. The vignette is painted in your browser."}
        howToTitle={"How to add a vignette to a photo"}
        howTo={[
          "Click the upload box and pick the photo whose edges you want to darken.",
          "Drag \"Intensity\" (1 to 100, default 50) to set how dark the edges become.",
          "Drag \"Clear centre\" (0 to 90, default 0) to keep a larger middle area unchanged.",
          "Click \"Add Vignette\", compare with the original above it, and click \"Download\" to save the result.",
        ]}
        specs={[
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF; animated pictures give their first frame" },
          { label: "Output format", value: "Same as the original for JPG (quality 92), PNG and WebP; PNG otherwise" },
          { label: "Controls", value: "Intensity from 1 to 100; Clear centre from 0 to 90 percent of the radius left untouched" },
          { label: "Maximum size", value: "Photos up to 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The darkened edges are computed on a canvas in this browser tab and the photo is not transmitted to any server. Nothing is kept after you close the page, so download the result first. An error message shown by the tool is reported to us as cleaned text, with the tool and browser names and the browser version, never with the picture."}
        faqs={[
          { q: "Can I change how far the dark edge reaches?", a: "Yes. \"Clear centre\" keeps the middle of the picture untouched over the share of the radius you choose, from 0 to 90 percent, and the darkening happens between that zone and the edge. At 0, the gradient starts right at the center." },
          { q: "Does it work on a transparent PNG logo?", a: "Yes. The gradient is painted only where the picture has pixels, so transparent areas stay transparent and the logo gets no dark halo around it. The result stays a PNG." },
          { q: "Can I use a white or colored vignette?", a: "No. The vignette is always black; only its strength and the size of the clear center change. For a softer effect, lower \"Intensity\" or widen \"Clear centre\" instead." },
          { q: "Is the photo resized?", a: "No. The vignette is drawn over the picture at its full pixel size, so nothing is cropped or scaled. A JPG or WebP is saved again at quality 92, so all of its pixels go through one more lossy step." },
        ]}
        tips={[
          "On a portrait, raise \"Clear centre\" so the face stays untouched and only the corners darken.",
          "For an old-photo look, convert with Sepia Filter or Grayscale Converter first and add the vignette last.",
        ]}
      />
    </div>
  );
}