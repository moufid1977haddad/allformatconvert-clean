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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-2 justify-center">{[90,180,270].map(a => <button key={a} onClick={() => setAngle(a)} className={`px-4 py-2 rounded-lg font-semibold transition ${angle===a?'bg-indigo-600 text-white':'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{a}°</button>)}</div>
          <div><label className="block text-sm text-neutral-500 mb-1">Custom angle: {angle}°</label><input aria-label="Custom angle (degrees)" type="range" min="0" max="360" value={angle} onChange={e => setAngle(parseInt(e.target.value))} className="w-full" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Angle (degrees, clockwise)</span>
              <input id="rot-angle" type="number" min="-360" max="360" step="0.5" value={angle} onChange={e => { const v = Number(e.target.value); if (Number.isFinite(v)) setAngle(((v % 360) + 360) % 360); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2" /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Background (any angle other than 90° steps)</span>
              <span className="flex gap-2 items-center">
                <select id="rot-bg" value={bg} onChange={e => setBg(e.target.value)} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg p-2"><option value="transparent">Transparent (PNG)</option><option value="color">Color (fills the corners and any transparency; JPG, PNG and WebP keep their format)</option></select>
                {bg === 'color' && <input id="rot-bg-color" type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} aria-label="Corner color" />}
              </span></label>
          </div>
          <button onClick={rotate} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Rotate</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Rotate"
        description={"Image Rotate turns a picture clockwise. The 90, 180 and 270 degree presets move the pixels exactly, with no resampling, and keep the format of a JPG, PNG or WebP. Any other angle, set with the slider or typed to the half degree, makes the canvas larger so the whole picture fits, and fills the new corners either with transparency (saved as PNG) or with a color you pick, which keeps a JPG, PNG or WebP in its format. Those angles are resampled bilinearly, which softens the picture slightly. Every format other than JPG, PNG and WebP is saved as PNG. The rotation runs in your browser."}
        howToTitle={"How to rotate an image"}
        howTo={[
          "Click the upload box and pick the photo you want to straighten or turn.",
          "Click a preset (90, 180 or 270 degrees), move \"Custom angle\", or type the value in \"Angle (degrees, clockwise)\".",
          "For an angle that is not a quarter turn, set \"Background\" to transparent or to a color.",
          "Click \"Rotate\", then click \"Download\".",
        ]}
        specs={[
          { label: "Angles", value: "Presets 90, 180 and 270 degrees; slider 0 to 360; typed −360 to 360 in steps of 0.5; always clockwise" },
          { label: "Corners (other angles)", value: "Transparent, saved as PNG, or a color that also fills existing transparency; JPG, PNG and WebP then keep their format" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF, or other pictures the browser handles" },
          { label: "Output format", value: "Quarter turns: JPG (quality 92), PNG or WebP as the original; other angles: PNG, or the JPG, PNG or WebP format with colored corners; other formats always PNG" },
          { label: "Size limit", value: "Pictures of up to 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The turn is computed by this page on your own device, and the picture is not uploaded. The rotated copy remains in the tab until you download it. For a displayed error, we get the message once cleaned, which tool raised it and which browser and version you use; we do not get the picture."}
        faqs={[
          { q: "Does rotating by 90 degrees resample the picture?", a: "No. Quarter turns move the pixels exactly. Any other angle is resampled bilinearly on a larger canvas, which softens the picture slightly. The 90, 180 and 270 presets always take this exact path." },
          { q: "Does the image get bigger at other angles?", a: "Yes. For any angle other than a quarter turn, the canvas grows so the whole tilted picture fits, and the four new corners are filled with transparency or the color you chose. Trim them afterwards with Image Cropper." },
          { q: "Does it turn clockwise?", a: "Yes. A typed negative angle turns the other way: −90 gives the same result as 270. The angle box accepts −360 to 360 in steps of 0.5 degree." },
          { q: "Can I straighten a tilted horizon?", a: "Yes. Type the small angle needed, such as 2, or 358 for a slight turn the other way, choose a background, click \"Rotate\", then trim the corners with Image Cropper." },
        ]}
        tips={[
          "To mirror a picture instead of turning it, use Image Flip.",
        ]}
      />
    </div>
  );
}