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
import UploadPrompt from '@/app/components/UploadPrompt';

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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div className="flex gap-3 text-sm text-neutral-600"><label className="flex items-center gap-1"><input type="radio" name="px-unit" checked={unit === 'px'} onChange={() => setUnit('px')} /> In pixels</label><label className="flex items-center gap-1"><input id="px-percent-mode" type="radio" name="px-unit" checked={unit === '%'} onChange={() => setUnit('%')} /> % of the picture</label></div>
          {unit === '%' ? <div><label className="block text-sm text-neutral-500 mb-1">Block size: {percent}% of the shorter side</label><input id="px-percent" aria-label="Block size (% of the picture)" type="range" min="1" max="20" value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full" /></div> : (
          <div><label className="block text-sm text-neutral-500 mb-1">Pixel Size: {pixelSize}px</label><input aria-label="Pixel Size (px)" type="range" min="2" max="50" value={pixelSize} onChange={e => setPixelSize(parseInt(e.target.value))} className="w-full" /></div>
          )}
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply Pixelate</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Pixelator"
        description={"Image Pixelator turns a picture into a mosaic of square blocks. Each block takes the average color of the pixels it covers, weighted by their transparency. The block size is set either in pixels, from 2 to 50, or as a share of the shorter side, from 1 to 20 percent, which keeps the same look on a small screenshot and on a large phone photo. The whole picture is pixelated: there is no area selection. The mosaic is computed in your browser."}
        howToTitle={"How to pixelate an image"}
        howTo={[
          "Click the upload box and choose the picture to pixelate.",
          "Choose \"In pixels\" and set \"Pixel Size\", or choose \"% of the picture\" and set the block size.",
          "Click \"Apply Pixelate\".",
          "Check the mosaic and click \"Download\"; JPG, PNG and WebP originals keep their format, all others come back as PNG.",
        ]}
        specs={[
          { label: "Block size", value: "2 to 50 px (default 10), or 1 to 20% of the shorter side (default 2, never under 2 px)" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and other pictures a browser opens" },
          { label: "Output format", value: "JPG at quality 92 if the original is JPG, PNG or WebP as the original, PNG for other formats" },
          { label: "Image size", value: "Limited to 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"Blocks are averaged by this page in your browser and the picture is not uploaded. The pixelated copy is kept only in the tab until you download it. If an error message appears on screen, its cleaned text, the tool's name and the browser's name and version are reported to us, never the picture."}
        faqs={[
          { q: "Can I pixelate only a face or a license plate?", a: "No. The whole picture is pixelated; there is no brush or rectangle. For one area, use a photo editor with a selection tool, or crop that area with Image Cropper if the rest is not needed." },
          { q: "Does the percent mode adapt to the picture size?", a: "Yes. Percent follows the shorter side, so the mosaic looks alike on a small screenshot and on a large phone photo, where even the 50 px maximum of the pixel mode would look fine-grained. Pixels give the same block size on every picture." },
          { q: "Can a pixelated image be reversed?", a: "No. Each block is replaced by one average color, so the detail inside it is gone from the saved file. Your original file is never changed, so keep it if you may need it." },
        ]}
        tips={[
          "For a soft look instead of square blocks, use Image Blur.",
        ]}
      />
    </div>
  );
}