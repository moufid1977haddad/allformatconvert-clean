'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { FileDownload } from '../../../components/FileDownload';
export default function ImageRotatePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [angle, setAngle] = useState(90);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const rotate = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = await rotateRaster(raster, angle);
      setResult(resultOf(await (angle % 90 === 0 ? encodeRasterLike(out, sourceTypeOf(file)) : encodeRaster(out, 'image/png')), file.name, 'rotated'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Rotate</h1>
        <p className="text-neutral-500 text-center mb-8">Rotate images by any angle</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={`px-4 py-2 rounded-lg font-semibold transition ${angle===a?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{a}°</button>)}</div>
          <div><label className="block text-sm text-neutral-500 mb-1">Custom angle: {angle}°</label><input aria-label="Custom angle: °" type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={rotate} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Rotate</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Rotate"
        description="Image Rotate turns your image by a preset (90°, 180°, 270°) or custom angle, entirely in your browser using the canvas element — your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Pick a preset angle (90°, 180°, 270°) or drag the slider for a custom angle.",
          "Click 'Rotate' to process the image.",
          "Click the download button to save your rotated PNG image."
        ]}
        faqs={[
          { q: "Is Image Rotate really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Rotate support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. A rotation by 90, 180 or 270 degrees keeps your image's format (JPG stays JPG); any other angle gives a PNG, because the corners around the tilted image are transparent." },
          { q: "Will rotating my image reduce its quality?", a: "No, the pixels are redrawn at the same resolution with no compression applied." },
          { q: "Can I rotate multiple images at once?", a: "No, the tool processes one image at a time — there's no batch upload." }
        ]}
        tips={[
          "Preview the rotated result before downloading to confirm the angle is what you wanted.",
          "For a quick landscape-to-portrait swap, use the 90° or 270° preset rather than the custom slider.",
          "Keep your original file as a backup before rotating, in case you want to start over.",
          "Use the custom-angle slider for fine adjustments beyond the standard 90° increments."
        ]}
      />
    </div>
  );
}