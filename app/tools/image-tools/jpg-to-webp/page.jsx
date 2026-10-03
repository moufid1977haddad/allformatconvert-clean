'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA, encodeWebpWasm } from '../../../lib/bigImage';
import { canEncodeImageType, checkedDataURL, assertCanvasSize } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
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
        description="JPG to WebP converts a JPG image to WebP format entirely in your browser — your file is never uploaded to a server. Choose the quality (80 by default) or lossless mode, which keeps every pixel; in Safari, which has no WebP encoder of its own, the file is made by libwebp compiled to WebAssembly, the encoder Squoosh uses."
        howTo={[
          "Click the upload area and select a JPG file from your device.",
          "Click 'Convert' to render it to WebP.",
          "Preview the converted image.",
          "Click the download button to save your WebP file."
        ]}
        faqs={[
          { q: "Is JPG to WebP really free to use?", a: "Yes, it's completely free with no watermarks added." },
          { q: "What file size limits does this tool support?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Can I adjust the WebP quality or compression level?", a: "Yes — a quality slider from 1 to 100 (80 by default), or 'Lossless', which keeps the decoded JPEG's pixels exactly (a larger file — for a photo, a high quality is usually the better choice)." },
          { q: "Can I convert multiple images at once?", a: "No, only one file can be converted at a time — there's no batch upload." }
        ]}
        tips={[
          "WebP files are typically smaller than JPG at similar visual quality, which helps page load speed.",
          "Keep a backup of your original JPG file before converting, in case you need it later.",
          "WebP is supported by all current major browsers, so it's safe to use for most web projects.",
          "Convert one file at a time and download each result before starting the next."
        ]}
      />
    </div>
  );
}