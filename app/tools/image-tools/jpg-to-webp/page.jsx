'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA, encodeWebpWasm } from '../../../lib/bigImage';
import { canEncodeImageType, checkedDataURL, assertCanvasSize } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { RASTER_MAX_PIXELS } from '../../../lib/imageOutput';
import { WEBP_MAX_SIDE } from '../../../lib/bigImage';
import { PHONE_MAX_MP } from '../../../lib/reduceImage';
export default function JPGtoWebPPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2">JPG to WebP</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG to WebP in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".jpg,.jpeg" className="hidden" onChange={handleFile} />
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input id="webp-lossless" type="checkbox" checked={lossless} onChange={(e) => { setLossless(e.target.checked); setResult(null); }} /> Lossless (pixel-exact for an opaque image; larger file)</label>
            {!lossless && <label className="block"><span className="block text-neutral-500 mb-1">Quality: {quality}</span>
              <input id="webp-quality" aria-label="Quality" type="range" min="1" max="100" value={quality} onChange={(e) => { setQuality(Number(e.target.value)); setResult(null); }} className="w-full" /></label>}
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><p className="text-center text-sm text-neutral-600">{(file.size / 1024).toFixed(0)} KB → {(result.bytes / 1024).toFixed(0)} KB</p><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="JPG to WebP"
        description={`JPG to WebP re-encodes a JPG or JPEG photo as a WebP image. Choose a quality from 1 to 100 (it starts at 80), or tick "Lossless", which stores the decoded JPEG pixels exactly but makes a larger file. After converting, the page shows the old and the new size in KB, so you can try another quality and compare. On a computer, Chrome, Edge and Firefox use their own WebP encoder for the lossy mode; Safari and every browser on iPhone and iPad have none, so there libwebp compiled to WebAssembly makes the file, and lossless mode always uses libwebp. One photo per conversion.`}
        howToTitle="How to convert JPG to WebP"
        howTo={[
          `Open a .jpg or .jpeg photo in the upload area.`,
          `Move the "Quality" slider, or tick "Lossless" for an exact copy of the pixels.`,
          `Click "Convert" and compare the two sizes shown in KB.`,
          `Click "Download" to keep the WebP, which takes the photo's name.`
        ]}
        specs={[
          { label: 'Input format', value: `JPG, JPEG (.jpg, .jpeg)` },
          { label: 'Output format', value: `WebP, lossy (quality 1 to 100) or lossless` },
          { label: 'Largest photo', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer, and at most ${WEBP_MAX_SIDE.toLocaleString('en-US')} px on each side (a limit of WebP)` },
          { label: 'On iPhone and iPad', value: `The whole photo is encoded by libwebp in memory; ${PHONE_MAX_MP} megapixels is the largest photo size confirmed on a real iPhone` }
        ]}
        privacy={`The photo is not uploaded. It is decoded by your browser and encoded to WebP on this page, by the browser's encoder or by libwebp, a WebAssembly file downloaded from our site the first time it is needed. If an error message is shown, its cleaned text, the tool's name and your browser's name and version are logged so that we can fix the cause.`}
        faqs={[
          { q: "Is lossless WebP a good choice for a photo?", a: `No, not for saving space. Lossless keeps the decoded JPEG pixels exactly, but the file is larger than a lossy WebP of the same photo. Use it only when the pixels must not change at all.` },
          { q: "Why is my photo refused?", a: `It is too long or too large. ${WEBP_MAX_SIDE.toLocaleString('en-US')} pixels is the widest or tallest a WebP image can be, and a longer photo gets a message asking for JPG, PNG or AVIF instead; on a computer, a photo over ${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels is refused as too large for a browser.` },
          { q: "Can Safari make a real WebP file?", a: `Yes. Safari cannot encode WebP itself, so the page loads libwebp, the encoder Squoosh uses, as WebAssembly and makes a real WebP file with it, not a PNG renamed.` }
        ]}
        tips={[
          `If the WebP comes out larger than the JPG, lower "Quality" and convert again; the KB figures show the difference right away.`
        ]}
      />
    </div>
  );
}