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
        description={"Brightness and Contrast corrects a picture with three sliders: Brightness to lighten or darken it, Contrast to widen or narrow the gap between light and dark, and Saturation to make colors richer or move them toward gray. Each goes from 0 to 200%, and 100 leaves the picture as it is. The formulas are those of the CSS brightness(), contrast() and saturate() filters; where the browser has no canvas filter (Safari), the page applies the same formulas pixel by pixel. There is no curves, levels or auto-fix control. The three sliders are applied in your browser."}
        howToTitle={"How to adjust brightness and contrast"}
        howTo={[
          "Click the upload box and choose the photo to correct.",
          "Set \"Brightness\", \"Contrast\" and \"Saturation\"; 100 means unchanged, lower values darken or flatten, higher ones brighten or strengthen.",
          "Click \"Apply\" to see the result under the sliders.",
          "If it looks right, click \"Download\"; if not, move a slider and click \"Apply\" again.",
        ]}
        specs={[
          { label: "Sliders", value: "Brightness, Contrast and Saturation, each from 0 to 200%, starting at 100" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF, and other pictures the browser decodes" },
          { label: "Output format", value: "A JPG is saved as JPG (quality 92), PNG and WebP keep theirs, the rest becomes PNG" },
          { label: "Biggest photo", value: "268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The corrections are calculated by this page on your own device, through the browser's canvas, and the photo is never sent to us. The corrected copy disappears with the tab unless you download it. If an error message is displayed, its cleaned text is reported to us with the tool's name and your browser's name and version."}
        faqs={[
          { q: "Is there a live preview?", a: "No. The preview updates when you click \"Apply\". Every click starts again from your original file, so you can try other values as often as you like without loading the photo again." },
          { q: "Does it work in Safari?", a: "Yes. Safari has no canvas filter, so there the page computes brightness, contrast and saturation on the pixels with the CSS formulas. Chrome and Firefox use the browser's own filter; both paths follow the same formulas." },
          { q: "What does 0 do on each slider?", a: "0 removes the quantity entirely: Brightness at 0 gives a black picture, Contrast at 0 a flat mid-gray, and Saturation at 0 a gray picture. Values above 100 go the other way, up to 200." },
          { q: "Can strong settings lose detail?", a: "Yes. Pushing brightness or contrast far turns the lightest or darkest tones into pure white or pure black, and that detail cannot be brought back from the saved file. The size in pixels never changes." },
        ]}
        tips={[
          "For black and white with a choice of method, use Grayscale Converter rather than setting \"Saturation\" to 0.",
          "Compare the corrected file with the original in Image Comparison to check the change.",
        ]}
      />
    </div>
  );
}