'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf, sourceTypeOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { encodeLike, extOf } from '../../../lib/imageOutput';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import AnimatedImageNote from '../../../components/AnimatedImageNote';
// P24 (03/10): pinetools offers several grey methods (luminosity, average, lightness, a single channel); a pure black and
// white (threshold) is the other common need (scans, stencils). Rec. 709 stays the default (the CSS grayscale() filter).
const METHODS = [
  ['rec709', 'Luminance (Rec. 709, as CSS and image editors)'],
  ['rec601', 'Luminance (Rec. 601, older TV / JPEG weights)'],
  ['average', 'Average of red, green and blue'],
  ['lightness', 'Lightness ((brightest + darkest) / 2)'],
  ['red', 'Red channel only'], ['green', 'Green channel only'], ['blue', 'Blue channel only'],
];
const GREY = {
  rec709: (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b,
  rec601: (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b,
  average: (r, g, b) => (r + g + b) / 3,
  lightness: (r, g, b) => (Math.max(r, g, b) + Math.min(r, g, b)) / 2,
  red: (r) => r, green: (r, g) => g, blue: (r, g, b) => b,
};
export default function GrayscaleConverterPage() {
  const [srcType, setSrcType] = useState('image/png');
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('rec709');
  const [bw, setBw] = useState(false);
  const [threshold, setThreshold] = useState(128);
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setSrcType(f.type); setResult(null); setError(''); } };
  const convert = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = await renderFull(raster, raster.width, raster.height, (ctx, drawSource, band) => {
        drawSource(ctx);
        const data = ctx.getImageData(0, 0, band.width, band.rows);
        const grey = GREY[method] || GREY.rec709;
        for (let i = 0; i < data.data.length; i += 4) {
          // Rec. 709 by default (the plain average made blue as light as green, 29/09)
          let v = grey(data.data[i], data.data[i + 1], data.data[i + 2]);
          if (bw) v = v >= threshold ? 255 : 0;
          data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
        }
        ctx.putImageData(data, 0, 0);
      });
      setResult(resultOf(await encodeRasterLike(out, sourceTypeOf(file)), file.name, 'grayscale'));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Grayscale Converter</h1>
        <p className="text-neutral-500 text-center mb-8">Convert images to grayscale</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          <AnimatedImageNote file={file} />
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <div className="space-y-2 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Method</span>
              <select id="gs-method" value={method} onChange={(e) => { setMethod(e.target.value); setResult(null); }} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2">{METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
            <label className="flex items-center gap-2"><input id="gs-bw" type="checkbox" checked={bw} onChange={(e) => { setBw(e.target.checked); setResult(null); }} /> Pure black and white (threshold)</label>
            {bw && <label className="block"><span className="block text-neutral-500 mb-1">Threshold: {threshold}</span><input id="gs-threshold" aria-label="Threshold" type="range" min="1" max="254" value={threshold} onChange={(e) => { setThreshold(Number(e.target.value)); setResult(null); }} className="w-full" /></label>}
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert to Grayscale</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Grayscale Converter"
        description="Grayscale Converter turns a color image into black and white using each pixel's luminance (the weights of the CSS grayscale filter, Rec. 709), so blues stay dark and greens light as the eye sees them, entirely in your browser. Other methods (Rec. 601, average, lightness, a single channel) and a pure black and white with an adjustable threshold are available. A JPEG stays a JPEG, a PNG keeps its transparency. Your image is never uploaded to a server."
        howTo={[
          "Click the upload area and select a color image from your device.",
          "Optionally choose the method (luminance, average, lightness, one channel) or tick pure black and white and set the threshold.",
          "Click 'Convert to Grayscale' to process the image.",
          "Preview the result.",
          "Click the download button to save the grayscale image."
        ]}
        faqs={[
          { q: "What image formats does Grayscale Converter support?", a: "It accepts common formats your browser can open, such as JPG, PNG, and WebP. The result keeps your image's format: a JPG stays a JPG, a PNG stays a PNG (transparency included), a WebP stays a WebP." },
          { q: "Is there a file size limit for uploading images?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Will the tool reduce the quality of my image?", a: "No, the original resolution is preserved — only the color information is changed." },
          { q: "Can I make a pure black and white image (no greys)?", a: "Yes — tick 'Pure black and white (threshold)' and move the threshold: lighter pixels become white, darker ones black. Useful for scans, stencils and signatures." },
          { q: "Can I convert multiple images at once?", a: "No, the tool converts one image at a time — there's no batch upload." }
        ]}
        tips={[
          "Well-lit portraits with clear contrast tend to convert to grayscale most effectively.",
          "A photo stays in its own format (JPG in, JPG out), so the file does not balloon; PNG and transparent images stay PNG.",
          "Try converting a few different photos to see which ones look best in black and white.",
          "Grayscale images work well for formal documents, resumes, and prints where color isn't needed."
        ]}
      />
    </div>
  );
}