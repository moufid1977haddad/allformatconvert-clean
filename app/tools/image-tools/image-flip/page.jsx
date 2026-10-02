'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
export default function ImageFlipPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const flip = async (horizontal) => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const W = raster.width, H = raster.height;
      const out = await renderFull(raster, W, H, (ctx, drawSource) => {
        // P24 (03/10): 'both' = horizontal and vertical at once (pinetools: independently or combined), a 180° turn
        if (horizontal === 'both') { ctx.translate(W, H); ctx.scale(-1, -1); }
        else if (horizontal) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        else { ctx.translate(0, H); ctx.scale(1, -1); }
        drawSource(ctx);
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'flipped'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Flip</h1>
        <p className="text-neutral-500 text-center mb-8">Flip images horizontally or vertically</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => flip(true)} disabled={!image || busy} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Flip Horizontal</button>
            <button onClick={() => flip(false)} disabled={!image || busy} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Flip Vertical</button>
            <button onClick={() => flip('both')} disabled={!image || busy} className="col-span-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Flip Both Ways</button>
          </div>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Flip"
        description="Image Flip mirrors your image horizontally or vertically, entirely in your browser using the canvas element — your image is never uploaded to a server. For rotating by a specific angle instead, use the separate Image Rotate tool."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Click 'Flip Horizontal' to mirror left-right, or 'Flip Vertical' to mirror top-bottom.",
          "Preview the flipped result.",
          "Click the download button to save your flipped PNG image."
        ]}
        faqs={[
          { q: "Is Image Flip really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Flip support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
          { q: "Can I rotate by a specific angle here?", a: "No, this tool only mirrors horizontally or vertically. Use the separate Image Rotate tool for custom-angle rotation." },
          { q: "Is my uploaded image data secure and private?", a: "Yes, images are processed entirely in your browser and are never uploaded to a server." }
        ]}
        tips={[
          "Use horizontal flip to create a mirror image for design symmetry or artistic compositions.",
          "Combine a flip with the Image Rotate tool if you need both a mirror and an angle change.",
          "PNG output preserves transparency, so any transparent background in your source image carries over.",
          "Flip one image at a time — there's no batch processing built in."
        ]}
      />
    </div>
  );
}