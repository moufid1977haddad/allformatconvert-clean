'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
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
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
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
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="PNG to JPG"
        description="PNG to JPG converts a PNG image to JPG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. If your PNG has transparency, transparent areas are filled with white in the JPG output (JPG has no alpha channel), as iLoveIMG and CloudConvert do."
        howTo={[
          "Click the upload area and select a PNG file from your device.",
          "Click 'Convert' to render it to JPG.",
          "Preview the converted image — check transparent areas rendered correctly.",
          "Click the download button to save your JPG file."
        ]}
        faqs={[
          { q: "Is PNG to JPG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "Will converting PNG to JPG reduce image quality?", a: "JPG uses lossy compression, so there is some quality loss compared to PNG, though it's usually minor at default encoder settings." },
          { q: "What happens to transparent areas in my PNG?", a: "They become white, since JPG doesn't support transparency. Keep the PNG if you need the transparency." },
          { q: "Do you store my images after conversion?", a: "No, conversion happens entirely in your browser — nothing is uploaded to a server." }
        ]}
        tips={[
          "Transparent backgrounds become white in the JPG; for another color, flatten the image in an editor first.",
          "JPG works best for photographs and complex images; keep using PNG for graphics that need transparency.",
          "Keep your original PNG as a backup, since converting to JPG discards the alpha channel.",
          "Convert one file at a time — there's no batch upload option."
        ]}
      />
    </div>
  );
}