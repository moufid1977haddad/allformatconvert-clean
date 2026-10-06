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

export default function AddNoisePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(30);
  const [colour, setColour] = useState(false); // P24 (03/10): colour noise, as pinetools ("Monochromatic" off)
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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}</label><input aria-label="Intensity" type="range" min="1" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <label className="flex items-center gap-2 text-sm text-neutral-600"><input id="noise-colour" type="checkbox" checked={colour} onChange={(e) => setColour(e.target.checked)} /> Color noise (each color channel its own grain)</label>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Add Noise</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Add Noise"
        description={"Add Noise sprinkles random grain over a picture, like the texture of film or of an old print. Each pixel is shifted up or down by a random whole number between minus and plus the intensity you set, on the 0-255 scale. By default the same shift goes to red, green and blue, which gives gray grain; with the color option each channel gets its own shift, which gives colored speckles. The noise is uniform: there is no Gaussian or salt-and-pepper mode. The grain is computed in your browser."}
        howToTitle={"How to add grain to a photo"}
        howTo={[
          "Click the upload box and choose the photo to texture.",
          "Move the \"Intensity\" slider: it starts at 30, 1 is barely visible and 100 is very coarse.",
          "Tick \"Color noise (each color channel its own grain)\" for colored speckles, or leave it off for gray grain.",
          "Click \"Add Noise\", look at the preview, then click \"Download\"; a grainy JPG, PNG or WebP keeps its format, while other files come back as PNG.",
        ]}
        specs={[
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and other images the browser opens; an animation gives its first frame" },
          { label: "Output format", value: "JPG stays JPG (quality 92), WebP stays WebP, everything else becomes PNG" },
          { label: "Intensity", value: "From 1 to 100, the largest shift up or down on the 0-255 scale; default 30" },
          { label: "Size limit", value: "At most 268 megapixels per photo; on iPhone and iPad, photos above 16.7 megapixels are handled in strips" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"Grain is generated inside this tab, with a random sequence seeded by the browser's own secure generator, and the photo never leaves your device. The result is a temporary file held by the page until you save it. Should an error message appear, its cleaned wording is sent to us for debugging, together with the tool and the browser's name and version; the photo and its name are not part of it."}
        faqs={[
          { q: "Is this Gaussian noise?", a: "No. Each pixel is moved by a whole number picked evenly between minus and plus the intensity, so the noise is uniform. There is no Gaussian, Poisson or salt-and-pepper option; the only choice is gray grain or colored grain." },
          { q: "Does colored noise change the hue of pixels?", a: "Yes, slightly. With \"Color noise\" ticked, red, green and blue each get their own random amount, which scatters small colored specks. Without it, the same amount goes to all three, so a pixel only gets lighter or darker." },
          { q: "Will I get the same grain twice?", a: "No. The random sequence is seeded again from the browser's secure generator on every click, so each run draws a different pattern, even with the same photo and the same settings." },
          { q: "Does the grain touch transparent areas?", a: "No, not visibly. Only red, green and blue are changed and the alpha channel stays as it was, so fully see-through areas stay see-through; semi-transparent edges get grain like the rest. A PNG stays a PNG and a WebP stays a WebP." },
        ]}
        tips={[
          "Raise \"Intensity\" for a coarser grain and click \"Add Noise\" again: the new grain replaces the previous one instead of piling up on it.",
          "For an old-print look, tone the photo with Sepia Filter first, then add gray grain here.",
        ]}
      />
    </div>
  );
}