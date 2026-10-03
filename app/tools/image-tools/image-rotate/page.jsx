'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ImageRotatePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [angle, setAngle] = useState(90);
  // P24 (03/10): pinetools rotates by any angle with a transparent OR coloured background; ours forced transparency (PNG)
  const [bg, setBg] = useState('transparent');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const rotate = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      let out = await rotateRaster(raster, angle);
      const right = angle % 90 === 0;
      if (!right && bg === 'color') out = await renderFull(out, out.width, out.height, (ctx, drawSource, band) => { ctx.fillStyle = bgColor; ctx.fillRect(0, band.y, band.width, band.rows); drawSource(ctx); });
      // a coloured background has no transparency left: the photo keeps its format (JPG stays JPG)
      setResult(resultOf(await (right || bg === 'color' ? encodeRasterLike(out, sourceTypeOf(file)) : encodeRaster(out, 'image/png')), file.name, 'rotated'));
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
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={`px-4 py-2 rounded-lg font-semibold transition ${angle===a?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{a}°</button>)}</div>
          <div><label className="block text-sm text-neutral-500 mb-1">Custom angle: {angle}°</label><input aria-label="Custom angle: °" type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Angle (degrees, clockwise)</span>
              <input id="rot-angle" type="number" min="-360" max="360" step="0.5" value={angle} onChange={e => { const v = Number(e.target.value); if (Number.isFinite(v)) setAngle(((v % 360) + 360) % 360); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2" /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Background (any angle other than 90° steps)</span>
              <span className="flex gap-2 items-center">
                <select id="rot-bg" value={bg} onChange={e => setBg(e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-2"><option value="transparent">Transparent (PNG)</option><option value="color">Colour (fills the corners and any transparency; keeps the format)</option></select>
                {bg === 'color' && <input id="rot-bg-color" type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} aria-label="Corner colour" />}
              </span></label>
          </div>
          <button onClick={rotate} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Rotate</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Rotate"
        description="Image Rotate turns your image by a preset (90°, 180°, 270°) or custom angle, entirely in your browser using the canvas element — your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Pick a preset angle (90°, 180°, 270°), drag the slider, or type an exact angle; for a tilted image, choose a transparent or coloured background.",
          "Click 'Rotate' to process the image.",
          "Click the download button to save your rotated PNG image."
        ]}
        faqs={[
          { q: "Is Image Rotate really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Rotate support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. A rotation by 90, 180 or 270 degrees keeps your image's format (JPG stays JPG). For any other angle, choose transparent corners (a PNG) or a background colour, which keeps the format (it also fills any transparency the image had)." },
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