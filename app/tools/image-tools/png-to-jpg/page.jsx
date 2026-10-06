'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { RASTER_MAX_PIXELS } from '../../../lib/imageOutput';
import { PHONE_MAX_MP } from '../../../lib/reduceImage';
export default function PNGtoJPGPage() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  // P24 (03/10): JPG quality and the colour transparent areas become (ezgif: quality factor and background colour)
  const [quality, setQuality] = useState(92);
  const [background, setBackground] = useState('#ffffff');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setError(''); } };
  const convert = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = raster;
      setResult(resultOf(await encodeRaster(out, 'image/jpeg', Number(quality), { background }), file.name, ''));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PNG to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert PNG to JPG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".png" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="text-neutral-600">JPG quality: {quality}
              <input id="jpg-quality" type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full" />
            </label>
            <label className="text-neutral-600 flex items-center gap-2">Transparent areas become
              <input id="jpg-background" type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="w-10 h-8" aria-label="Background colour" />
            </label>
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="PNG to JPG"
        description={`PNG to JPG turns a PNG image into a JPG file. JPG has no transparency, so the page asks which color the transparent areas should become (white at first) and paints it under the image before encoding. The "JPG quality" slider, from 10 to 100, sets how much detail the compression keeps; it starts at 92. An animated PNG gives its first frame only, and the page says so before you convert. One image per conversion. The JPG is encoded in your browser; for very large images on an iPhone or iPad, by MozJPEG in WebAssembly.`}
        howToTitle="How to convert PNG to JPG"
        howTo={[
          `Choose the PNG to flatten; it appears in the upload area.`,
          `Set the "JPG quality" slider.`,
          `Next to "Transparent areas become", pick the color for the transparent parts.`,
          `Click "Convert", then "Download" to get the JPG with the PNG's name.`
        ]}
        specs={[
          { label: 'Input format', value: `PNG (.png), one file` },
          { label: 'Output format', value: `JPG, quality 10 to 100, transparent areas filled with the color you pick` },
          { label: 'Largest image', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer` },
          { label: 'On iPhone and iPad', value: `MozJPEG needs several times the image's memory, so very large images may not fit; ${PHONE_MAX_MP} megapixels is the largest size confirmed on a real iPhone` }
        ]}
        privacy={`Conversion happens inside this tab: the browser decodes the PNG, fills the transparent areas and writes the JPG. The image is never transferred to a server. If an error appears, a cleaned report (message, tool name, browser name and version) is logged so that we can fix problems.`}
        faqs={[
          { q: "Can I choose the colour of the transparent parts?", a: `Yes. They take the color chosen next to "Transparent areas become", white unless you change it. Half-transparent edges are blended with that color, so pick the color of the page or document the JPG will sit on.` },
          { q: "Will I lose quality converting PNG to JPG?", a: `Yes, some. JPG is lossy, so fine detail and sharp edges get slightly blurred. The slider starts at 92; lower values make a smaller file with more visible artifacts.` },
          { q: "Can I convert many PNG files at once?", a: `No. Every click on "Convert" handles one PNG. Image Converter takes a batch and writes JPG files with transparency flattened onto white.` }
        ]}
        tips={[
          `To keep the transparency in a smaller file, convert with PNG to WebP instead: WebP has an alpha channel.`
        ]}
      />
    </div>
  );
}