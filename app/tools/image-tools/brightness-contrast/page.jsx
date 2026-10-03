'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { supportsCanvasFilter, applyBrightnessContrast } from '../../../lib/canvasFilters';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function BrightnessContrastPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100); // P24 (03/10): saturation too, as ezgif's adjust tool
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = await renderFull(raster, raster.width, raster.height, (ctx, drawSource, band) => {
        // Safari has no ctx.filter: it used to return the image unchanged (29/09).
        if (supportsCanvasFilter()) { ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`; drawSource(ctx); }
        else {
          drawSource(ctx);
          const img = applyBrightnessContrast(ctx.getImageData(0, 0, band.width, band.rows), brightness, contrast);
          if (saturation !== 100) { // the CSS saturate() matrix (Filter Effects spec), same result as the browser filter
            const k = saturation / 100, d = img.data;
            const m = [0.213 + 0.787 * k, 0.715 - 0.715 * k, 0.072 - 0.072 * k, 0.213 - 0.213 * k, 0.715 + 0.285 * k, 0.072 - 0.072 * k, 0.213 - 0.213 * k, 0.715 - 0.715 * k, 0.072 + 0.928 * k];
            for (let i = 0; i < d.length; i += 4) { const r = d[i], g = d[i + 1], b = d[i + 2]; d[i] = m[0] * r + m[1] * g + m[2] * b; d[i + 1] = m[3] * r + m[4] * g + m[5] * b; d[i + 2] = m[6] * r + m[7] * g + m[8] * b; }
          }
          ctx.putImageData(img, 0, 0);
        }
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'adjusted'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Brightness and Contrast</h1>
        <p className="text-neutral-500 text-center mb-8">Adjust image brightness and contrast</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Brightness: {brightness}%</label><input aria-label="Brightness (%)" type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Contrast: {contrast}%</label><input aria-label="Contrast (%)" type="range" min="0" max="200" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Saturation: {saturation}%</label><input id="bc-saturation" aria-label="Saturation (%)" type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Brightness and Contrast"
        description="Brightness and Contrast lets you adjust an image's brightness and contrast with two sliders, applied via the browser's canvas filter, entirely on your device. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Use the brightness slider to lighten or darken the image.",
          "Use the contrast slider to increase or decrease the difference between light and dark areas.",
          "Click 'Apply' to render the result, then download it."
        ]}
        faqs={[
          { q: "Is Brightness and Contrast free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does this tool support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
          { q: "Will my images be saved or shared?", a: "No, all image processing happens in your browser. Your images are never uploaded to a server." },
          { q: "Can I preview changes before applying them?", a: "No, there's no live preview — move the sliders to your desired values, then click Apply to see and download the result." }
        ]}
        tips={[
          "Start with small adjustments and fine-tune gradually rather than large jumps.",
          "Increase contrast to make a flat, dull photo pop and bring out shadow and highlight detail.",
          "Use the brightness slider to fix underexposed or overexposed photos.",
          "If a result isn't quite right, re-upload the original and try again with different values."
        ]}
      />
    </div>
  );
}