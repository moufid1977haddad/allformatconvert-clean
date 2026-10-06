'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA, canvasBeyondSafariCap, CANVAS_MAX_PIXELS } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { supportsCanvasFilter, gaussianBlurSupport } from '../../../lib/canvasFilters';
import { applyGaussianBlurParallel } from '../../../lib/blurParallel';
import { applyGaussianBlurGL } from '../../../lib/glBlur';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ImageBlurPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [blur, setBlur] = useState(5);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const apply = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      // Blur reads neighbours: bands overlap so their seams are invisible (3 sigma for the browser's filter; the
      // computed blur needs gaussianBlurSupport rows, fewer, and is then exact).
      // P24 review (03/10): the browser's blur filter treats the outside of the picture as transparent — the edges came out
      // half transparent (a whitish frame once flattened to JPG) on Chrome and Firefox, while Safari's computed blur repeats
      // the edge pixels. The computed blur (graphics processor, else all cores) is used everywhere: one result in every
      // browser, no frame.
      const native = false && supportsCanvasFilter();
      const sigma = Number(blur);
      let out;
      // Same test as mapBands: does the whole image fit one canvas here?
      const oneCanvas = !!raster.canvas && (raster.width * raster.height <= CANVAS_MAX_PIXELS || (await canvasBeyondSafariCap()));
      if (!native && !oneCanvas) {
        // Safari beyond one canvas (iPhone, over 16.7 MP): the pixels are blurred directly, in strips, without
        // copying them through canvas bands (P17: that copying cost more than the blur itself).
        const px = raster.imageData();
        if (!applyGaussianBlurGL(px, sigma)) await applyGaussianBlurParallel(px, sigma);
        out = rasterFromRGBA(px.data, raster.width, raster.height);
      } else {
        out = await mapBands(raster, async (ctx, band) => {
          // Safari has no ctx.filter: it used to return the image unchanged (29/09).
          if (native) { ctx.filter = `blur(${blur}px)`; ctx.drawImage(band.source, 0, 0); }
          else {
            // P17: on the graphics processor (the reference editors' way), else on all processor cores -- same blur.
            ctx.drawImage(band.source, 0, 0);
            const px = ctx.getImageData(0, 0, band.width, band.rows);
            if (!applyGaussianBlurGL(px, sigma)) await applyGaussianBlurParallel(px, sigma);
            ctx.putImageData(px, 0, 0);
          }
        }, { margin: Math.max(Math.ceil(sigma * 3) + 2, gaussianBlurSupport(sigma)) });
      }
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'blurred'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Blur</h1>
        <p className="text-neutral-500 text-center mb-8">Add blur effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Blur: {blur}px</label><input aria-label="Blur (px)" type="range" min="1" max="20" value={blur} onChange={e => setBlur(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply Blur</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Blur"
        description={"Image Blur softens an entire picture with a Gaussian blur. The slider sets the blur radius (the standard deviation) from 1 to 20 px of the full-size image. The blur is computed on your graphics chip through WebGL2, or, when that is not available, on the processor, split across up to six background workers when the picture is large enough, in every browser, with the edge pixels repeated so no pale frame appears around the result. It blurs everything: there is no brush, rectangle or face detection. The photo stays in your browser."}
        howToTitle={"How to blur an image"}
        howTo={[
          "Click the upload box and choose the photo to soften.",
          "Set \"Blur\" anywhere from 1 to 20 px; it starts at 5.",
          "Click \"Apply Blur\" and wait for the preview.",
          "Click \"Download\": a blurred JPG, PNG or WebP is saved in its own format, any other picture as a PNG.",
        ]}
        specs={[
          { label: "Blur radius", value: "1 to 20 px (standard deviation of the Gaussian), measured on the full-size image" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and other pictures the browser can decode" },
          { label: "Output format", value: "Same format for JPG (quality 92), PNG and WebP; PNG for the rest" },
          { label: "Photo size", value: "Up to 268 megapixels; 48 megapixel photos were tested in a simulated iPhone on 30 September 2026" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The blur runs on this device, on its graphics chip through WebGL2 or else on its processor, and the photo is not sent to a server. The blurred file exists only in the tab until you save it. When an error message is shown, its cleaned text, the tool and the browser's name and version are reported to us; the picture is not."}
        faqs={[
          { q: "Can I blur only a face or one area?", a: "No. The blur covers the whole picture; there is no brush, rectangle or face detection. Cropping first would only keep the part you blur, so for a partial blur use a photo editor that has a selection tool." },
          { q: "Does the blur leave a light border?", a: "No. Edge pixels are repeated outward before blurring, so the borders keep the colors of the picture instead of fading to transparent or white. Chrome, Firefox and Safari all use this same computed blur here." },
          { q: "Can it blur large phone photos?", a: "Yes, up to 268 megapixels. Full-size 48 megapixel photos were blurred in a simulated iPhone during our tests; on iPhone and iPad, pictures above 16.7 megapixels are blurred directly in memory instead of on one canvas." },
        ]}
        tips={[
          "For a soft background behind a caption, blur the photo here, then write on it with Add Text to Image.",
        ]}
      />
    </div>
  );
}