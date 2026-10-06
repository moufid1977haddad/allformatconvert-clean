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
export default function ImageInverterPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const invert = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = await renderFull(raster, raster.width, raster.height, (ctx, drawSource, band) => {
        drawSource(ctx);
        const data = ctx.getImageData(0, 0, band.width, band.rows);
        for (let i = 0; i < data.data.length; i += 4) {
          data.data[i] = 255 - data.data[i];
          data.data[i+1] = 255 - data.data[i+1];
          data.data[i+2] = 255 - data.data[i+2];
        }
        ctx.putImageData(data, 0, 0);
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'inverted'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Image Inverter</h1>
        <p className="text-neutral-500 text-center mb-8">Invert image colors</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={invert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Invert Colors</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Image Inverter"
        description={"Image Inverter makes the color negative of a picture. Every red, green and blue value is subtracted from 255, so black becomes white, blue becomes yellow and a dark screenshot turns light. Transparency is not touched, so a logo keeps its see-through background. There is one button and no settings. The pixel size never changes. Inverting the result again gives the original colors back, exactly for an opaque PNG. The inversion is done in your browser."}
        howToTitle={"How to invert the colors of an image"}
        howTo={[
          "Click the upload box and choose the picture to turn into a negative.",
          "Click \"Invert Colors\"; there is nothing to set.",
          "Look at the negative in the preview.",
          "Click \"Download\"; the negative keeps the format of a JPG, PNG or WebP original and is a PNG for any other format.",
        ]}
        specs={[
          { label: "Formula", value: "New value = 255 − old value for red, green and blue; alpha unchanged" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and others the browser decodes" },
          { label: "Output format", value: "Unchanged for JPG (re-saved at quality 92), PNG and WebP; PNG for the other formats" },
          { label: "Maximum image", value: "No more than 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The negative is calculated by this page in your browser, pixel by pixel, and the picture is not uploaded. The inverted file stays in the tab until you save it. The cleaned words of an error message, should one appear, are reported to us with the tool and the browser's name and version."}
        faqs={[
          { q: "Can I undo the inversion?", a: "Yes. Inverting the result again gives back the original colors; with an opaque PNG the pixels come back exactly. A JPG goes through lossy compression at each save, so after a round trip it is very close to the original but not identical." },
          { q: "Does a transparent logo stay transparent after inverting?", a: "Yes. Only red, green and blue are inverted; the alpha channel is left as it is. A transparent PNG logo keeps its see-through background and stays a PNG, and a WebP stays a WebP." },
          { q: "Can I invert only some colors or one area?", a: "No. All three color channels of every pixel are inverted. For a gray negative, convert the picture with Grayscale Converter first, then invert the result here." },
        ]}
        tips={[
          "Open the original and the negative in Image Comparison to sweep from one to the other.",
        ]}
      />
    </div>
  );
}