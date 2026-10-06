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

export default function AddBorderToImagePage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState('#000000');
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
      const W = raster.width, H = raster.height, bw = Number(borderWidth);
      const out = await renderFull(raster, W + bw * 2, H + bw * 2, (ctx, drawSource) => {
        // Paint the border only: the whole canvas used to be filled, so the
        // transparent areas of a logo took the border colour (29/09).
        ctx.fillStyle = borderColor;
        ctx.fillRect(0, 0, W + bw * 2, H + bw * 2);
        ctx.clearRect(bw, bw, W, H);
        drawSource(ctx, bw, bw);
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'border'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Add Border to Image</h1>
        <p className="text-neutral-500 text-center mb-8">Add decorative borders to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div><label className="block text-sm text-neutral-500 mb-1">Border Width: {borderWidth}px</label><input aria-label="Border Width (px)" type="range" min="1" max="100" value={borderWidth} onChange={e => setBorderWidth(parseInt(e.target.value))} className="w-full" /></div>
          <div><label className="block text-sm text-neutral-500 mb-1">Border Color</label><input aria-label="Border Color" type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Add Border</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Add Border to Image"
        description={"Add Border to Image draws a frame of one solid color around a picture: a screenshot that needs an edge on a white page, a product photo, a logo. The width is counted in pixels of the real image, from 1 to 100 px, and the frame is added outside the picture, so nothing is covered or cropped. Transparent areas of a PNG or WebP logo stay transparent; only the frame is painted. A JPG comes back as a JPG, a WebP as a WebP, a PNG as a PNG, and any other format as PNG. There is one style, a plain solid band: no dashes, shadow or rounded frame. Your browser does all the work."}
        howToTitle={"How to add a border to an image"}
        howTo={[
          "Click the upload box and pick the picture to frame.",
          "Move the \"Border Width\" slider (1 to 100 px) and choose a color with \"Border Color\".",
          "Click \"Add Border\"; the framed picture appears under the button.",
          "Click \"Download\": the framed copy keeps the format of a JPG, PNG or WebP, and any other picture becomes a PNG (on iPhone and iPad, \"Save / Share\" opens the share sheet).",
        ]}
        specs={[
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF, or any other picture your browser can open" },
          { label: "Output format", value: "JPG in, JPG out (quality 92); PNG and WebP keep their format; anything else is written as PNG" },
          { label: "Border width", value: "1 to 100 px of the full-size image, added on the left, right, top and bottom" },
          { label: "Largest picture", value: "Pictures above 268 megapixels are refused with a message" },
          { label: "Animated files", value: "A GIF, APNG or WebP animation keeps its first frame; a note says so before you start" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The frame is painted by this page on a canvas in your own browser, and the picture is not sent anywhere. The framed copy lives only in this tab until you download it; closing the tab discards it. When the tool shows an error, we receive the cleaned wording of that message with the tool's name and your browser's name and version, never the image or its file name."}
        faqs={[
          { q: "Does the border make the image bigger?", a: "Yes. The border is added outside the picture, so the result grows by the border width on the left, the right, the top and the bottom. No part of the original picture is covered, scaled or cropped." },
          { q: "Can I make a dashed, double or rounded border?", a: "No. The only style is a plain band of one color. For rounded edges, add the border here first, then open the result in Round Corners, which can make the corners transparent or fill them with a color." },
          { q: "Does a transparent logo stay transparent?", a: "Yes. Only the band around the picture is painted, so a PNG or WebP logo keeps its see-through background inside the frame and stays in its own format." },
          { q: "Will a JPG lose quality?", a: "Yes, a little: a JPG is written again as a JPG at quality 92, a lossy step, while a PNG stays lossless. The picture keeps its full size in pixels and is never scaled down." },
        ]}
        tips={[
          "Each click on \"Add Border\" starts again from your original file: change the width or the color and click again, no need to reload the picture.",
          "For a frame with rounded corners, run the bordered picture through Round Corners afterwards.",
        ]}
      />
    </div>
  );
}