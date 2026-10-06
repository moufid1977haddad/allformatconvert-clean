'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { roundedRectPath } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

export default function RoundCornersPage() {
  const [image, setImage] = useState(null);
  const [radius, setRadius] = useState(20);
  // P24 (03/10): corners transparent (PNG) or filled with a colour — then the result can stay a JPG, far lighter (pinetools)
  const [fill, setFill] = useState('transparent');
  const [fillColour, setFillColour] = useState('#ffffff');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f)); setFile(f);
    setResult(null);
    setError('');
  };

  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const W = raster.width, H = raster.height;
      const r = (radius / 100) * Math.min(W, H) / 2;
      const out = await renderFull(raster, W, H, (ctx, drawSource) => {
        // True circular arcs (as CSS border-radius); the quadratic curves used before
        // bulged about 6 % of the radius towards the corner (29/09).
        if (fill === 'colour') { ctx.fillStyle = fillColour; ctx.fillRect(0, 0, W, H); }
        ctx.save();
        roundedRectPath(ctx, 0, 0, W, H, r);
        ctx.clip();
        drawSource(ctx);
        ctx.restore();
      });
      const keepJpeg = fill === 'colour' && /jpe?g/i.test(file.type);
      setResult(resultOf(await encodeRaster(out, keepJpeg ? 'image/jpeg' : 'image/png', 92, { background: fillColour }), file.name, 'rounded'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Round Corners</h1>
        <p className="text-neutral-500 text-center mb-8">Add rounded corners to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Corner Radius: {radius}%</label><input aria-label="Corner Radius (%)" type="range" min="1" max="50" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="w-full" /></div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <label className="flex items-center gap-1"><input type="radio" name="rc-fill" checked={fill === 'transparent'} onChange={() => setFill('transparent')} /> Transparent corners (PNG)</label>
            <label className="flex items-center gap-1"><input id="rc-fill-colour" type="radio" name="rc-fill" checked={fill === 'colour'} onChange={() => setFill('colour')} /> Corners in</label>
            <input type="color" value={fillColour} onChange={(e) => { setFillColour(e.target.value); setFill('colour'); }} aria-label="Corner colour" className="w-10 h-8" />
            <span className="text-xs text-neutral-500">(a JPG then stays a JPG)</span>
          </div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply Round Corners</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Round Corners"
        description={"Round Corners clips a picture to a rounded rectangle with true circular arcs, as CSS border-radius draws them. The radius is a percentage of half the shorter side: at 50, the maximum, it equals a quarter of the shorter side, so the result is never a full circle or a pill. The same radius applies to all four corners. The cut corners become transparent, which needs a PNG, or take a color you choose, and then a JPG photo stays a JPG. A WebP or any other format is saved as PNG. The corners are cut in your browser."}
        howToTitle={"How to round the corners of an image"}
        howTo={[
          "Click the upload box and choose the picture whose corners you want to round.",
          "Set \"Corner Radius\" between 1 and 50 (default 20).",
          "Choose \"Transparent corners (PNG)\", or \"Corners in\" and pick the color.",
          "Click \"Apply Round Corners\", then click \"Download\".",
        ]}
        specs={[
          { label: "Radius", value: "1 to 50% of half the shorter side; 50% equals a quarter of the shorter side" },
          { label: "Output format", value: "PNG with transparent corners; JPG (quality 92) only for a JPG with colored corners; PNG in every other case. \"Corners in\" also fills any transparency of the original" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and other pictures your browser opens" },
          { label: "Picture limit", value: "At most 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The corners are cut on a canvas by this page in your browser, and the picture does not leave your device. The rounded copy is kept in the tab until you download it. When an error message is shown, we receive its cleaned text, the tool's name and the browser's name and version."}
        faqs={[
          { q: "Can I make a circle?", a: "No. The largest radius, 50 on the slider, is a quarter of the shorter side, so a square photo gets strongly rounded corners but keeps straight edges between them. A circular crop is not available in this tool." },
          { q: "Can a rounded JPG stay a JPG?", a: "Yes, with \"Corners in\": pick a color that matches the page where the picture will sit, and the JPG stays a JPG at quality 92. With transparent corners it becomes a PNG, because JPG has no transparency." },
          { q: "Can each corner have its own radius?", a: "No. The same radius is applied to all four corners. There is no per-corner control and no option to round only the top corners. The radius, in pixels, is set from the shorter side of the picture." },
          { q: "Is a WebP kept as WebP?", a: "No. A WebP is saved as PNG in both modes. With \"Transparent corners (PNG)\" its transparency is kept; with \"Corners in\" every transparent area is filled with the color." },
        ]}
        tips={[
          "To frame and round a picture, add the border first with Add Border to Image, then round the result here.",
        ]}
      />
    </div>
  );
}