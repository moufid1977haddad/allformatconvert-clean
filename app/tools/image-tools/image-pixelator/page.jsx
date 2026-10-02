'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf, pixelateImageData } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';

export default function ImagePixelatorPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [pixelSize, setPixelSize] = useState(10);
  // P24 (03/10): the block size can follow the picture (a % of its shorter side): 50 px was little on a 48 MP photo
  const [unit, setUnit] = useState('px');
  const [percent, setPercent] = useState(2);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type);
    setResult(null);
    setError('');
  };

  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      // Block AVERAGE, as the page says (it used to copy each block's top-left pixel, 29/09). Done on the whole
      // image's pixels at once (blocks must not be cut by bands).
      const img = raster.imageData();
      const block = unit === '%' ? Math.max(2, Math.round(Math.min(img.width, img.height) * percent / 100)) : pixelSize;
      pixelateImageData(img, block);
      let out;
      if (raster.canvas) { raster.canvas.getContext('2d').putImageData(new ImageData(img.data, img.width, img.height), 0, 0); out = raster; }
      else out = rasterFromRGBA(img.data, img.width, img.height);
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'pixelated'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Pixelator</h1>
        <p className="text-neutral-500 text-center mb-8">Add pixelate/mosaic effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-3 text-sm text-neutral-600"><label className="flex items-center gap-1"><input type="radio" name="px-unit" checked={unit === 'px'} onChange={() => setUnit('px')} /> In pixels</label><label className="flex items-center gap-1"><input id="px-percent-mode" type="radio" name="px-unit" checked={unit === '%'} onChange={() => setUnit('%')} /> % of the picture</label></div>
          {unit === '%' ? <div><label className="block text-sm text-neutral-500 mb-1">Block size: {percent}% of the shorter side</label><input id="px-percent" aria-label="Block size (% of the picture)" type="range" min="1" max="20" value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full" /></div> : (
          <div><label className="block text-sm text-neutral-500 mb-1">Pixel Size: {pixelSize}px</label><input aria-label="Pixel Size (px)" type="range" min="2" max="50" value={pixelSize} onChange={e => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
          )}
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply Pixelate</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Pixelator"
        description="Image Pixelator applies a mosaic effect across your entire image by averaging blocks of pixels at a size you choose, entirely in your browser using the canvas element. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select an image from your device.",
          "Adjust the pixel size slider (2–50px) to set the block size.",
          "Click 'Apply Pixelate' to process the image.",
          "Click the download button to save your pixelated PNG image."
        ]}
        faqs={[
          { q: "Is Image Pixelator really free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "What image formats does Image Pixelator support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
          { q: "Is my image data secure and private?", a: "Yes, all processing happens locally in your browser — your image is never uploaded to a server." },
          { q: "Can I pixelate only a specific area, like a face?", a: "No, the effect is applied uniformly across the whole image — there's no selection tool for pixelating a specific region." }
        ]}
        tips={[
          "Use a larger pixel size for stronger privacy protection on sensitive details, and a smaller size for a subtler mosaic look.",
          "Since the effect applies to the whole image, crop out just the area you want obscured first if you don't want the rest pixelated.",
          "Try a couple of pixel sizes on a copy of your image to find the right balance between privacy and visibility.",
          "Pixelate one image at a time — there's no batch processing option."
        ]}
      />
    </div>
  );
}