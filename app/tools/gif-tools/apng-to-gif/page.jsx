'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ApngToGifPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f);
    setResult(null);
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const UPNGModule = await import('upng-js');
      const UPNG = UPNGModule.default || UPNGModule;
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const arrayBuffer = await file.arrayBuffer();
      const img = UPNG.decode(arrayBuffer);
      const rgbaFrames = UPNG.toRGBA8(img);
      const gif = GIFEncoder();
      for (let i = 0; i < rgbaFrames.length; i++) {
        const data = new Uint8Array(rgbaFrames[i]);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        const delay = (img.frames[i] && img.frames[i].delay) || 100;
        gif.writeFrame(index, img.width, img.height, { palette, delay });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: rgbaFrames.length });
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">APNG to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert APNG to GIF format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an APNG file here</p>}
            <input ref={inputRef} type="file" accept="image/png,image/apng" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><p className="text-green-600 text-center text-sm font-semibold">{result.frameCount} frame{result.frameCount === 1 ? '' : 's'}</p><a href={result.url} download="converted.gif" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download GIF</a></div>}
        </div>
      </div>
      <SeoContent
        title="APNG to GIF"
        description="APNG to GIF decodes every frame of your animated PNG (using the upng-js library) and re-encodes them into a real, downloadable animated GIF (using gifenc), entirely in your browser — nothing is uploaded to a server. Each frame is quantized to its own 256-color palette, and frame delays are carried over from the original APNG."
        howTo={[
          "Click the upload area and select a PNG or APNG file from your device.",
          "Click \"Convert to GIF\" to decode every frame and re-encode them as an animated GIF.",
          "Preview the resulting GIF and check the frame count.",
          "Click \"Download GIF\" to save the result."
        ]}
        faqs={[
          { q: "Does this tool produce a real animated GIF?", a: "Yes — every frame of the source APNG is decoded and re-encoded into the GIF, not just a single snapshot." },
          { q: "Will a regular (non-animated) PNG work too?", a: "Yes — it's treated as a single-frame \"animation\" and converts to a static single-frame GIF." },
          { q: "Will the colors look exactly the same?", a: "APNG supports full 24-bit color with alpha, while GIF is limited to a 256-color palette per frame with no partial transparency (only fully opaque or fully transparent). Images with smooth gradients, alpha transparency, or more than 256 colors per frame may show visible color banding or transparency artifacts after conversion." },
          { q: "Is APNG to GIF free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "Simple, flat-color animations convert most cleanly since the GIF format's 256-color-per-frame palette and lack of partial transparency are the main sources of quality loss.",
          "Frame delays from the original APNG are preserved, so playback speed should closely match the source animation.",
          "Large or many-frame APNGs take longer to process since every frame is individually quantized.",
          "Keep your original APNG file if you need full color fidelity or partial (alpha) transparency later, since GIF can't represent either."
        ]}
      />
    </div>
  );
}