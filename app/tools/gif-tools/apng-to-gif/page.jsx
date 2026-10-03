'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { writeRgbaFrame, hasTransparency, headerSize, sizeProblem } from '../../../lib/gifEncode';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function ApngToGifPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
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
    setError('');
    setLoading(true);
    try {
      const UPNGModule = await import('upng-js');
      const UPNG = UPNGModule.default || UPNGModule;
      const gifenc = await import('gifenc');
      const arrayBuffer = await file.arrayBuffer();
      const tooBig = sizeProblem(headerSize(new Uint8Array(arrayBuffer, 0, Math.min(32, arrayBuffer.byteLength))));
      if (tooBig) throw new Error(tooBig);
      if (arrayBuffer.byteLength === 0 || !headerSize(new Uint8Array(arrayBuffer, 0, Math.min(32, arrayBuffer.byteLength)))) throw new Error('This is not a PNG / APNG file (or it is empty). Choose an animated PNG.');
      const img = UPNG.decode(arrayBuffer);
      const rgbaFrames = UPNG.toRGBA8(img).map((f) => new Uint8Array(f));
      // Transparency and play count are carried over (29/09): transparent pixels used to come out black, and an
      // APNG played once (acTL num_plays = 1) gave a GIF looping forever. GIF counts extra loops: n plays = n - 1.
      const plays = img.tabs.acTL ? img.tabs.acTL.num_plays : 0;
      const repeat = plays === 0 ? 0 : plays === 1 ? -1 : plays - 1;
      const dispose = rgbaFrames.some(hasTransparency) ? 2 : -1;
      const gif = gifenc.GIFEncoder();
      for (let i = 0; i < rgbaFrames.length; i++) {
        const delay = (img.frames[i] && img.frames[i].delay) || 100;
        writeRgbaFrame(gif, gifenc, rgbaFrames[i], img.width, img.height, { delay, dispose, ...(i === 0 ? { repeat } : {}) });
      }
      gif.finish();
      const blob = new Blob([gif.bytes()], { type: 'image/gif' });
      setResult({ url: URL.createObjectURL(blob), frameCount: rgbaFrames.length });
    } catch(e) { setError((e && e.message) || 'This file could not be converted. It may be damaged.'); } // P21: a message on the page, not a blocking alert()
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">APNG to GIF</h1>
        <p className="text-neutral-500 text-center mb-8">Convert APNG to GIF format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img alt="Preview of your image" src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an APNG file" /></p>}
            <input ref={inputRef} type="file" accept="image/png,image/apng" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to GIF'}</button>
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><p className="text-green-600 text-center text-sm font-semibold">{result.frameCount} frame{result.frameCount === 1 ? '' : 's'}</p><FileDownload href={result.url} name="converted.gif" /></div>}
        </div>
      </div>
      <SeoContent
        title="APNG to GIF"
        description="APNG to GIF decodes every frame of your animated PNG (using the upng-js library) and re-encodes them into a real, downloadable animated GIF (using gifenc), entirely in your browser — nothing is uploaded to a server. Each frame is quantized to its own 256-color palette, and frame delays, transparency (fully transparent pixels stay transparent) and the number of plays are carried over from the original APNG."
        howTo={[
          "Click the upload area and select a PNG or APNG file from your device.",
          "Click \"Convert to GIF\" to decode every frame and re-encode them as an animated GIF.",
          "Preview the resulting GIF and check the frame count.",
          "Click \"Download\" next to the GIF to save the result."
        ]}
        faqs={[
          { q: "Does this tool produce a real animated GIF?", a: "Yes — every frame of the source APNG is decoded and re-encoded into the GIF, not just a single snapshot." },
          { q: "Will a regular (non-animated) PNG work too?", a: "Yes — it's treated as a single-frame \"animation\" and converts to a static single-frame GIF." },
          { q: "Will the colors look exactly the same?", a: "APNG supports full 24-bit color with alpha, while GIF is limited to a 256-color palette per frame with no partial transparency (only fully opaque or fully transparent). Fully transparent areas stay transparent; semi-transparent pixels become either opaque or transparent (cut at 50 %), and smooth gradients or more than 256 colors per frame may show visible color banding." },
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