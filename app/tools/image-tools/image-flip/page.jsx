'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ImageFlipPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => flip(true)} disabled={!image || busy} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Flip Horizontal</button>
            <button onClick={() => flip(false)} disabled={!image || busy} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Flip Vertical</button>
            <button onClick={() => flip('both')} disabled={!image || busy} className="col-span-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Flip Both Ways</button>
          </div>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Flip"
        description={"Image Flip mirrors a picture. Flip Horizontal swaps left and right, the usual fix for a front-camera photo whose text reads backwards; Flip Vertical swaps top and bottom; Flip Both Ways does the two at once, which equals a half turn. The pixels are moved, not resampled, so nothing gets blurred. Each button works on the original file, so clicks do not add up. A transparent background stays transparent. To turn a picture by an angle instead, use Image Rotate. The flip runs in your browser."}
        howToTitle={"How to flip an image"}
        howTo={[
          "Click the upload box and choose the picture to mirror.",
          "Click \"Flip Horizontal\", \"Flip Vertical\" or \"Flip Both Ways\"; the flip starts at once.",
          "Check the mirrored preview below the buttons.",
          "Click \"Download\" to keep the mirrored copy; JPG, PNG and WebP keep their format, while any other picture is saved as PNG.",
        ]}
        specs={[
          { label: "Buttons", value: "Flip Horizontal (left and right swapped), Flip Vertical (top and bottom swapped), Flip Both Ways (a half turn)" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF, or any picture the browser can show" },
          { label: "Output format", value: "JPG remains JPG (quality 92), PNG and WebP keep their format, other types turn into PNG" },
          { label: "Largest image", value: "268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The mirror image is produced by this page in your browser, and the picture is never transmitted. The flipped copy is only in the tab until you download it. If an error is displayed, we receive the cleaned text of that message, the tool's name and the browser's name and version, not the picture."}
        faqs={[
          { q: "Can I flip both horizontally and vertically at once?", a: "Yes: click \"Flip Both Ways\". Clicking \"Flip Horizontal\" and then \"Flip Vertical\" does not combine them, because each button starts again from your original file, so the second click gives a vertical flip only." },
          { q: "Are the pixels resampled when flipping?", a: "No. Each pixel is moved to its mirrored place, so nothing is blurred or shifted, and a PNG result is pixel for pixel the mirror of the original." },
          { q: "Can I fix a mirrored selfie?", a: "Yes. \"Flip Horizontal\" reverses left and right, so text and logos that appear backwards in a front-camera photo read normally again. The flip is exact, so flipping the result again restores the original layout." },
          { q: "Is the transparency of a PNG kept?", a: "Yes. Transparent areas stay transparent in PNG and WebP results. Other formats, such as GIF, BMP or AVIF, are saved as PNG, which keeps their transparency too. A JPG has no transparency, so there is nothing to keep." },
        ]}
        tips={[
          "To stand a sideways photo upright rather than mirror it, use Image Rotate.",
        ]}
      />
    </div>
  );
}