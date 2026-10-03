'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRaster, resultOf } from '../../../lib/imageOutput';
import { gifFrames } from '../../../lib/gifFrames';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function GIFtoPNGPage() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const [gifFile, setGifFile] = useState(null);
  const [zip, setZip] = useState(null);
  const [zipBusy, setZipBusy] = useState(false);
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setGifFile(f); setResult(null); setZip(null); setError(''); } };
  // Every frame of an animated GIF, fully composited, as PNGs in a ZIP -- what
  // ezgif's "split" does. Only the first frame was available before (29/09).
  const extractAll = async () => {
    setZipBusy(true);
    setError('');
    try {
      const { width, height, frames } = await gifFrames(await gifFile.arrayBuffer());
      const { zipSync } = await import('fflate');
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      const files = {};
      const pad = String(frames.length).length;
      for (let i = 0; i < frames.length; i++) {
        ctx.putImageData(frames[i].imageData, 0, 0);
        const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
        if (!blob) throw new Error('Could not encode frame ' + (i + 1));
        files[`frame_${String(i + 1).padStart(pad, '0')}.png`] = new Uint8Array(await blob.arrayBuffer());
      }
      setZip({ url: URL.createObjectURL(new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' })), count: frames.length });
    } catch (e) { setError('Could not extract the frames: ' + e.message); }
    setZipBusy(false);
  };
  const convert = () => {
    const img = new Image();
    img.onload = async () => {
      // 30/09: a Blob named after the original (a data: link saves nothing on iPhone), any size (bands on iPhone).
      setError('');
      try {
        const out = await drawToRaster(img.naturalWidth, img.naturalHeight, (ctx, y) => ctx.drawImage(img, 0, -y));
        setResult(resultOf(await encodeRaster(out, 'image/png'), gifFile?.name || 'image', ''));
      } catch (e) { setError(e.message); }
    };
    img.onerror = () => {
      setError('Could not load this image. The file may be corrupted or in an unsupported format.');
    };
    img.src = image;
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">GIF to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert GIF to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
          {gifFile && <button onClick={extractAll} disabled={zipBusy} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{zipBusy ? 'Extracting frames...' : 'Extract all frames (ZIP of PNGs)'}</button>}
          {zip && <FileDownload href={zip.url} name="gif-frames.zip" />}
        </div>
      </div>
      <SeoContent
        title="GIF to PNG"
        description="GIF to PNG converts a GIF image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. For an animated GIF, 'Convert' gives the first frame as a PNG, and 'Extract all frames' gives every frame, fully composited (transparency and disposal methods applied as a GIF player does), as numbered PNGs in a ZIP."
        howTo={[
          "Click the upload area and select a GIF file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is GIF to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "Can it extract every frame from an animated GIF?", a: "Yes — click 'Extract all frames' to get every frame as a PNG, numbered in order, in one ZIP. Each frame is the full image as it appears in the animation, not just the changed pixels." },
          { q: "Can I convert multiple GIFs at once?", a: "No, only one file can be converted at a time — there's no batch upload." },
          { q: "Will my uploaded files be stored or shared?", a: "No. Conversion happens entirely in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "To keep one particular frame of an animation, extract all frames and pick it from the ZIP.",
          "PNG preserves transparency, so it's a good target format if your GIF uses a transparent background.",
          "Convert one GIF at a time and download each result before starting the next.",
          "Keep the original GIF as a backup in case you need the animation again later."
        ]}
      />
    </div>
  );
}