'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA, encodeWebpWasm } from '../../../lib/bigImage';
import { canEncodeImageType, checkedDataURL, assertCanvasSize } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { RASTER_MAX_PIXELS } from '../../../lib/imageOutput';
import { WEBP_MAX_SIDE } from '../../../lib/bigImage';
import { PHONE_MAX_MP } from '../../../lib/reduceImage';
export default function PNGtoWebPPage() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  // P24 (03/10): ezgif's WebP converter offers a quality from 0 to 100 and lossless; ours was fixed at 80
  const [quality, setQuality] = useState(80);
  const [lossless, setLossless] = useState(false);
  const inputRef = useRef();
  // Safari has no WebP encoder of its own (it hands back a PNG): there libwebp in WebAssembly makes the file (30/09).
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setError(''); } };
  const convert = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = raster;
      const blob = lossless ? await encodeWebpWasm(out.rgba(), out.width, out.height, 100, { lossless: true }) : await encodeRaster(out, 'image/webp', quality);
      setResult({ ...resultOf(blob, file.name, ''), bytes: blob.size });
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to WebP</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PNG to WebP in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input id="webp-lossless" type="checkbox" checked={lossless} onChange={(e) => { setLossless(e.target.checked); setResult(null); }} /> Lossless (pixel-exact for an opaque image; larger file)</label>
            {!lossless && <label className="block"><span className="block text-neutral-500 mb-1">Quality: {quality}</span>
              <input id="webp-quality" aria-label="Quality" type="range" min="1" max="100" value={quality} onChange={(e) => { setQuality(Number(e.target.value)); setResult(null); }} className="w-full" /></label>}
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><p className="text-center text-sm text-neutral-600">{(file.size / 1024).toFixed(0)} KB → {(result.bytes / 1024).toFixed(0)} KB</p><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="PNG to WebP"
        description={`PNG to WebP converts a PNG image to WebP and keeps its transparency, since WebP has an alpha channel like PNG. Two modes are offered. Lossy WebP, with a quality from 1 to 100 (80 to start), suits photos and large pictures. "Lossless" keeps an opaque image as your browser displays it and suits screenshots, logos and flat graphics; partly transparent pixels can shift slightly, more so the more transparent they are. The page shows both sizes in KB after converting. An animated PNG gives its first frame only, and a note says so. Safari and the other browsers on iPhone and iPad have no WebP encoder, so libwebp in WebAssembly is used there.`}
        howToTitle="How to convert PNG to WebP"
        howTo={[
          `Select the PNG, for example a screenshot or a logo, in the upload area.`,
          `Tick "Lossless" for graphics, or leave it off and set "Quality".`,
          `Click "Convert" and check the KB figures for the PNG and the WebP.`,
          `Click "Download"; the WebP keeps the name of your PNG.`
        ]}
        specs={[
          { label: 'Input format', value: `PNG (.png), one file` },
          { label: 'Output format', value: `WebP with transparency, lossy or lossless` },
          { label: 'Largest image', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer, at most ${WEBP_MAX_SIDE.toLocaleString('en-US')} px per side` },
          { label: 'On iPhone and iPad', value: `libwebp encodes the whole image in memory; ${PHONE_MAX_MP} megapixels is the largest image size confirmed on a real iPhone` }
        ]}
        privacy={`The PNG is read and the WebP written inside your browser. Lossless files, and every WebP made on Safari, iPhone or iPad, come from libwebp, which your browser fetches from our site once. The image itself is never sent. A failed WebP encode sends us its cleaned error wording along with the tool's name and your browser's name and version.`}
        faqs={[
          { q: "Does the WebP keep the transparent background?", a: `Yes. Transparent and half-transparent pixels of the PNG stay transparent in the WebP, in both lossy and lossless mode, so a logo on a transparent background can be placed on any colour.` },
          { q: "Is lossless mode an exact copy of the PNG?", a: `Yes for an opaque image: every pixel is identical to the PNG as your browser displays it. Partly transparent pixels pass through the browser's canvas and can change slightly; the nearer to fully transparent, the larger the change.` },
          { q: "Why does my PNG fail to convert?", a: `It is too wide, too tall or too large. ${WEBP_MAX_SIDE.toLocaleString('en-US')} pixels is the longest side WebP allows, so a longer PNG is refused with a message; on a computer, an image above ${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels is too large for a browser to process.` }
        ]}
        tips={[
          `Lossless mode keeps the text of a screenshot exactly as it is; compare its KB figure with a lossy try before choosing.`
        ]}
      />
    </div>
  );
}