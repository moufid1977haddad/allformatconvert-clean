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
export default function SepiaFilterPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [intensity, setIntensity] = useState(100);
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
      const out = await renderFull(raster, raster.width, raster.height, (ctx, drawSource, band) => {
        drawSource(ctx);
        const data = ctx.getImageData(0, 0, band.width, band.rows);
        const f = intensity / 100;
        for (let i = 0; i < data.data.length; i += 4) {
          const r = data.data[i], g = data.data[i+1], b = data.data[i+2];
          data.data[i] = Math.min(255, r*(1-0.607*f) + g*0.769*f + b*0.189*f);
          data.data[i+1] = Math.min(255, r*0.349*f + g*(1-0.314*f) + b*0.168*f);
          data.data[i+2] = Math.min(255, r*0.272*f + g*0.534*f + b*(1-0.869*f));
        }
        ctx.putImageData(data, 0, 0);
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'sepia'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Sepia Filter</h1>
        <p className="text-neutral-500 text-center mb-8">Apply sepia tone effect to images</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Intensity: {intensity}%</label><input aria-label="Intensity (%)" type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(parseInt(e.target.value))} className="w-full" /></div>
          <button onClick={apply} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Apply Sepia</button>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Sepia Filter"
        description={"Sepia Filter gives a picture the warm brown cast of early photographic prints. It uses the color matrix of the CSS sepia() filter: each new red, green and blue value is a weighted mix of the three old ones. The Intensity slider blends between the original colors (0) and full sepia (100, the default), so you can keep a hint of the original color. There is no grain, fading or vignette in this filter. Transparency is untouched. The toning runs in your browser."}
        howToTitle={"How to apply a sepia tone"}
        howTo={[
          "Click the upload box and choose the photo to tone.",
          "Set \"Intensity\": 100 is full sepia, lower values keep part of the original color.",
          "Click \"Apply Sepia\".",
          "Check the preview and click \"Download\"; the toned picture keeps a JPG, PNG or WebP format and turns any other format into PNG.",
        ]}
        specs={[
          { label: "Matrix", value: "Red = 0.393 R + 0.769 G + 0.189 B; green = 0.349 R + 0.686 G + 0.168 B; blue = 0.272 R + 0.534 G + 0.131 B" },
          { label: "Intensity", value: "From 0 (unchanged) to 100 (full sepia), default 100" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF and similar pictures the browser reads" },
          { label: "Output format", value: "JPG back as JPG at quality 92, PNG and WebP unchanged in type, the rest as PNG" },
          { label: "Largest photo", value: "Photos beyond 268 megapixels are refused" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The sepia matrix is applied by this page in your browser and the photo is not uploaded. The toned image stays in the tab until you download it. Error messages shown by the tool reach us as cleaned text, tagged with the tool and with the browser's name and version."}
        faqs={[
          { q: "What does an intensity of 50 do?", a: "50 puts each pixel halfway between its original color and full sepia. At 100, the default, the full sepia matrix is used; at 0 the picture is unchanged." },
          { q: "Is it the same as the CSS sepia filter?", a: "Yes. It uses the matrix of the CSS sepia() function from the Filter Effects specification, so at 100 it gives the same colors as a browser's sepia(1). It adds no grain or vignette." },
          { q: "Does the toned picture keep its transparency?", a: "Yes. Only red, green and blue change; the alpha channel is kept, so a transparent PNG or WebP keeps its see-through areas. A JPG has no transparency to keep." },
        ]}
        tips={[
          "For an aged-photo look, add grain with Add Noise and darken the edges with Add Vignette after the sepia.",
        ]}
      />
    </div>
  );
}