'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function GifToApngPage() {
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
      const { parseGIF, decompressFrames } = await import('gifuct-js');
      const UPNGModule = await import('upng-js');
      const UPNG = UPNGModule.default || UPNGModule;
      const arrayBuffer = await file.arrayBuffer();
      const gifData = parseGIF(arrayBuffer);
      const frames = decompressFrames(gifData, true);
      const width = gifData.lsd.width;
      const height = gifData.lsd.height;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      const rgbaFrames = [];
      const delays = [];
      for (const frame of frames) {
        const { dims, patch, delay, disposalType } = frame;
        const frameImageData = ctx.createImageData(dims.width, dims.height);
        frameImageData.data.set(patch);
        ctx.putImageData(frameImageData, dims.left, dims.top);
        const full = ctx.getImageData(0, 0, width, height);
        rgbaFrames.push(full.data.buffer);
        delays.push(delay || 100);
        // Disposal method 2 (restore to background) clears the frame's region
        // before the next frame is drawn; other disposal types (1: leave as
        // is, 3: restore to previous) aren't specially handled, which can
        // produce compositing artifacts on GIFs that rely on them.
        if (disposalType === 2) ctx.clearRect(dims.left, dims.top, dims.width, dims.height);
      }

      const pngBuffer = UPNG.encode(rgbaFrames, width, height, 0, delays);
      const blob = new Blob([pngBuffer], { type: 'image/png' });
      setResult({ url: URL.createObjectURL(blob), frameCount: rgbaFrames.length });
    } catch(e) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">GIF to APNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to APNG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 transition" onClick={() => inputRef.current.click()}>
            {file ? <img src={URL.createObjectURL(file)} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop a GIF file here</p>}
            <input ref={inputRef} type="file" accept="image/gif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 text-white rounded-xl py-3 font-semibold transition">{loading ? 'Converting...' : 'Convert to APNG'}</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><p className="text-green-600 text-center text-sm font-semibold">{result.frameCount} frame{result.frameCount === 1 ? '' : 's'}</p><a href={result.url} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download APNG</a></div>}
        </div>
      </div>
      <SeoContent
        title="GIF to APNG"
        description="GIF to APNG decodes every frame of your GIF (using the gifuct-js library) and re-encodes them into a real, downloadable animated PNG (using upng-js), entirely in your browser — nothing is uploaded to a server. Frame delays are carried over from the original GIF."
        howTo={[
          "Click the upload area and select a GIF file from your device.",
          "Click \"Convert to APNG\" to decode every frame and re-encode them as an animated PNG.",
          "Preview the resulting APNG and check the frame count.",
          "Click \"Download APNG\" to save the result."
        ]}
        faqs={[
          { q: "Does this tool produce a real animated PNG?", a: "Yes — every frame of the source GIF is decoded and re-encoded into the APNG, not just a single snapshot." },
          { q: "Will colors improve compared to the original GIF?", a: "Colors are carried over as-is from the GIF's existing 256-color-per-frame palette — this tool doesn't add color detail the source GIF didn't have, it just repackages the same frames as APNG." },
          { q: "Does it handle every kind of GIF correctly?", a: "Most GIFs, yes. Frames using the \"restore to background\" disposal method are handled by clearing that region before the next frame; the rarer \"restore to previous\" disposal method isn't specially handled and can occasionally produce compositing artifacts on GIFs that rely on it." },
          { q: "Is GIF to APNG free to use?", a: "Yes, it's completely free with no signup and no limit on how many files you can process." },
          { q: "Is my file uploaded anywhere?", a: "No. Everything runs locally in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "Frame delays from the original GIF are preserved, so playback speed should match the source animation.",
          "APNG supports full color and partial transparency, but this conversion only carries over what was already in the GIF — it won't add detail the source didn't have.",
          "Large or many-frame GIFs take longer to process since every frame is individually decoded and composited.",
          "If the output looks visually wrong on a specific GIF, it may use the less common \"restore to previous\" frame disposal method, which isn't specially handled."
        ]}
      />
    </div>
  );
}