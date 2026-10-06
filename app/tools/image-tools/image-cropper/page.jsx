'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { FileDownload } from '../../../components/FileDownload';
import { emptyImageProblem, unreadableImageMessage } from '../../../lib/fileChecks';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ImageCropperPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 });
  // P24: aspect presets, as ezgif's crop (square, 4:3, 3:2, 16:9, 2:1…): the largest centred box of that shape
  const [ratio, setRatio] = useState('free');
  const RATIOS = [['free', 'Free'], ['1:1', '1:1 (square)'], ['4:3', '4:3'], ['3:2', '3:2'], ['16:9', '16:9'], ['9:16', '9:16 (story)'], ['4:5', '4:5 (portrait post)'], ['2:1', '2:1']];
  const applyRatio = (r) => {
    setRatio(r); setResult(null);
    if (r === 'free' || !imgDims.width) return;
    const [a, b] = r.split(':').map(Number), W = imgDims.width, H = imgDims.height;
    const w = Math.min(W, Math.round(H * a / b)), h = Math.min(H, Math.round(w * b / a));
    setCrop({ x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h });
  };
  const inputRef = useRef();
  const imgRef = useRef();
  const currentRef = useRef(null); // the file being shown: a slow message for an older one is dropped
  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setResult(null);
    // P23: an empty file is said at once; an image this browser cannot open is said by onImageError below (it was
    // blamed on the size, or shown as Firefox's raw 'Passed-in image is "broken"', at the Crop click).
    const empty = emptyImageProblem(f);
    if (empty) { currentRef.current = null; setImage(null); setFile(null); setError(empty); return; }
    currentRef.current = f;
    setImage(URL.createObjectURL(f)); setSrcType(f.type); setFile(f);
    setError('');
    setImgDims({ width: 0, height: 0 });
    setCrop({ x: 0, y: 0, w: 100, h: 100 });
  };
  const onImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    // P24 (03/10): real pixels of the picture (iLoveIMG: W/H/X/Y in px). The sliders worked in the pixels of the small
    // preview (about 192 px high): on a 4000 px photo each step was ~20 real pixels, and the sizes shown were not the
    // picture's. The crop starts as the whole picture.
    const W = img.naturalWidth, H = img.naturalHeight;
    setImgDims({ width: W, height: H });
    setCrop({ x: 0, y: 0, w: W, h: H });
    setRatio('free');
  };
  const onImageError = async () => {
    const f = file;
    setImage(null); setFile(null);
    const why = await unreadableImageMessage(f);
    if (currentRef.current === f) setError(why);
  };
  const applyCrop = async () => {
    setError('');
    setResult(null);
    const img = imgRef.current;
    if (!img || !file) return;
    const scaleX = 1, scaleY = 1; // crop values are real pixels (P24)
    const x = Math.max(0, Math.min(crop.x, img.naturalWidth));
    const y = Math.max(0, Math.min(crop.y, img.naturalHeight));
    const w = Math.max(0, Math.min(crop.w, img.naturalWidth - x));
    const h = Math.max(0, Math.min(crop.h, img.naturalHeight - y));
    if (w <= 0 || h <= 0) {
      setError('Crop area is outside the image bounds. Adjust X/Y/Width/Height.');
      return;
    }
    // 30/09 (owner's iPhone): a crop of a 24/48 MP photo can exceed the 16.7 MP a canvas may hold on iOS: drawn in
    // bands there (lib/imageOutput.js drawToRaster); the result is a Blob named after the original, not a data: URL.
    const ow = Math.round(w * scaleX), oh = Math.round(h * scaleY);
    try {
      const out = await drawToRaster(ow, oh, (ctx, by) => ctx.drawImage(img, x * scaleX, y * scaleY, w * scaleX, h * scaleY, 0, -by, ow, oh));
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'cropped'));
    } catch (e) { setError(e?.message || 'The image could not be cropped.'); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Cropper</h1>
        <p className="text-neutral-500 text-center mb-8">Crop images with custom dimensions</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <div className="relative inline-block"><img alt="Preview of your image" ref={imgRef} src={image} onLoad={onImageLoad} onError={onImageError} className="max-h-48 mx-auto rounded block" />{imgDims.width > 0 && <div aria-hidden="true" className="absolute border-2 border-indigo-500 bg-indigo-500/15 pointer-events-none" style={{ left: `${100 * crop.x / imgDims.width}%`, top: `${100 * crop.y / imgDims.height}%`, width: `${100 * Math.min(crop.w, imgDims.width - crop.x) / imgDims.width}%`, height: `${100 * Math.min(crop.h, imgDims.height - crop.y) / imgDims.height}%` }} />}</div> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {image && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="block"><span className="block text-neutral-500 mb-1">Aspect ratio</span>
                <select id="crop-ratio" value={ratio} onChange={e => applyRatio(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">{RATIOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <p className="text-neutral-500 sm:self-end">Image: {imgDims.width} × {imgDims.height} px · Crop: {crop.w} × {crop.h} px</p>
            </div>
          )}
          {image && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-neutral-500 mb-1">X: {crop.x}px</label><input aria-label="X (px)" type="range" min="0" max={Math.max(imgDims.width, 1)} value={crop.x} onChange={e => setCrop(p => ({...p, x: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Y: {crop.y}px</label><input aria-label="Y (px)" type="range" min="0" max={Math.max(imgDims.height, 1)} value={crop.y} onChange={e => setCrop(p => ({...p, y: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Width: {crop.w}px</label><input aria-label="Width (px)" type="range" min="1" max={Math.max(imgDims.width, 1)} value={crop.w} onChange={e => setCrop(p => ({...p, w: parseInt(e.target.value)}))} className="w-full" /></div>
              <div><label className="block text-sm text-neutral-500 mb-1">Height: {crop.h}px</label><input aria-label="Height (px)" type="range" min="1" max={Math.max(imgDims.height, 1)} value={crop.h} onChange={e => setCrop(p => ({...p, h: parseInt(e.target.value)}))} className="w-full" /></div>
            </div>
          )}
          <button onClick={applyCrop} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Crop Image</button>
          {error && <p role="alert" className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Cropper"
        description={"Image Cropper cuts a rectangle out of a picture and discards the rest. Position and size are set in the picture's real pixels with four sliders, X, Y, Width and Height, and a blue box on the preview shows the area that will be kept. Aspect ratio presets (1:1, 4:3, 3:2, 16:9, 9:16, 4:5 and 2:1) place the largest centered box of that shape in one step. There are no handles to drag on the image and no rotation. The crop is made in your browser."}
        howToTitle={"How to crop an image"}
        howTo={[
          "Click the upload box and choose the picture; the crop box starts as the whole image.",
          "Optionally pick a shape in \"Aspect ratio\" to set the largest centered box of that ratio.",
          "Adjust \"X\", \"Y\", \"Width\" and \"Height\"; the blue box and the crop size above the sliders follow.",
          "Click \"Crop Image\", then \"Download\"; a cropped JPG, PNG or WebP keeps its format, any other format is saved as PNG.",
        ]}
        specs={[
          { label: "Controls", value: "X, Y, Width and Height sliders in real pixels; presets Free, 1:1, 4:3, 3:2, 16:9, 9:16, 4:5, 2:1" },
          { label: "Input formats", value: "Pictures the browser can display: JPG, PNG, WebP, GIF, BMP, AVIF" },
          { label: "Output format", value: "JPG kept at quality 92, PNG and WebP kept, other formats saved as PNG" },
          { label: "Large crops on iPhone", value: "A crop above 16.7 megapixels is drawn in strips instead of failing" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"Cropping happens on a canvas in this page, and the picture is not sent to a server or a third party. The cropped file sits in the tab until you download it. Should the tool display an error, the cleaned message, the tool's name and the browser's name and version reach us, for debugging."}
        faqs={[
          { q: "Can I type exact numbers?", a: "No. Position and size are set with sliders that move in single pixels of the real image, and each value is shown next to its slider. Click a slider and use the arrow keys for one-pixel steps." },
          { q: "Does a preset keep its ratio when I move the sliders?", a: "No. A preset sets the box once; moving \"Width\" or \"Height\" afterwards changes the shape freely. Pick the preset again to get the exact ratio back, then shift the box with \"X\" or \"Y\" if there is room." },
          { q: "Does the crop keep my format?", a: "Yes for JPG, PNG and WebP: a JPG stays a JPG at quality 92, a PNG keeps its transparency, a WebP stays a WebP. GIF, BMP and other formats are saved as PNG, and only one frame of an animation is kept." },
        ]}
        tips={[
          "For a profile picture, choose \"1:1 (square)\" and shift \"X\" to center the face.",
          "For a phone story or reel cover, \"9:16 (story)\" gives the tallest centered box.",
        ]}
      />
    </div>
  );
}