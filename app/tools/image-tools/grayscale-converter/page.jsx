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
  const [error, setError] = useToolError('');
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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
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
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="Grayscale Converter"
        description={"Grayscale Converter removes the color from a picture. The default method weights red, green and blue the way the eye perceives brightness (Rec. 709, the weights of the CSS grayscale filter), so a blue sky stays darker than green grass. You can also use the older Rec. 601 weights, a plain average, the lightness (brightest plus darkest, halved) or a single channel. A threshold option gives pure black and white, for scans, stamps and signatures. A PNG or WebP keeps its transparency. The gray values are computed in your browser."}
        howToTitle={"How to convert an image to grayscale"}
        howTo={[
          "Click the upload box and choose a color picture.",
          "Pick a \"Method\", or tick \"Pure black and white (threshold)\" and move \"Threshold\".",
          "Click \"Convert to Grayscale\".",
          "Check the preview and click \"Download\"; JPG, PNG and WebP keep their format, and every other format becomes PNG.",
        ]}
        specs={[
          { label: "Methods", value: "Rec. 709 luminance (default), Rec. 601 luminance, average, lightness, red, green or blue channel only" },
          { label: "Threshold", value: "From 1 to 254, default 128: pixels at or above it turn white, the others black" },
          { label: "Input formats", value: "JPG, PNG, WebP, GIF, BMP, AVIF or another picture your browser reads" },
          { label: "Output format", value: "JPG (quality 92), PNG or WebP like the original, other formats as PNG; saved with three equal color channels" },
          { label: "Picture size", value: "Refused above 268 megapixels" },
        ]}
        privacyTitle="Where your image is processed"
        privacy={"The gray values are worked out by this page in your browser and the picture is not uploaded to anyone. The converted file is held in the tab until you download it. The text of a displayed error, cleaned, is reported to us with the tool and your browser's name and version, without your image."}
        faqs={[
          { q: "Which method should I use?", a: "Use Rec. 709 luminance, the default, for most photos: it applies the weights of the CSS grayscale() filter and keeps blues dark and greens light. Rec. 601 follows older TV and JPEG weights. Average and lightness treat the three colors equally, so blues come out lighter." },
          { q: "Can I make pure black and white with no gray?", a: "Yes. Tick \"Pure black and white (threshold)\" and set \"Threshold\" between 1 and 254: pixels whose gray value reaches it become white, the others black. It suits signatures, stamps and scanned text." },
          { q: "Is the result a one-channel grayscale file?", a: "No. The pixels become gray, but the file is saved as an ordinary JPG, PNG or WebP with three equal color channels, which every viewer opens. The transparency of a PNG or WebP is kept." },
        ]}
        tips={[
          "Try \"Red channel only\" and \"Blue channel only\" on the same photo: each click starts from the original, so comparing methods is quick.",
          "To see the color and gray versions side by side, open both in Image Comparison.",
        ]}
      />
    </div>
  );
}