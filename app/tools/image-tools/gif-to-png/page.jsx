'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { drawToRaster, encodeRaster, resultOf } from '../../../lib/imageOutput';
import { gifFrames } from '../../../lib/gifFrames';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { IOS_CANVAS_MAX_PIXELS } from '../../../lib/canvasLimit';
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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".gif" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
          {gifFile && <button onClick={extractAll} disabled={zipBusy} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{zipBusy ? 'Extracting frames...' : 'Extract all frames (ZIP of PNGs)'}</button>}
          {zip && <FileDownload href={zip.url} name="gif-frames.zip" />}
        </div>
      </div>
      <SeoContent
        title="GIF to PNG"
        description={`GIF to PNG saves a GIF image as a PNG. A still GIF simply becomes a PNG. For an animated GIF there are two buttons: "Convert" keeps the first frame as one PNG, and "Extract all frames" gives every frame as its own PNG, numbered in playback order, in a single ZIP. Each extracted frame is the whole picture as a GIF player shows it at that moment, with transparency and disposal applied, not just the pixels that changed. The PNG files are still images: the animation itself is not kept. The frames are decoded and zipped on this page.`}
        howToTitle="How to convert a GIF to PNG"
        howTo={[
          `Pick a .gif in the upload area; an animated GIF plays there as a preview.`,
          `Click "Convert" to get the first frame as a PNG, then "Download".`,
          `For an animation, click "Extract all frames" instead.`,
          `Click "Download" next to gif-frames.zip; the PNG frames inside are numbered from the first frame to the last.`
        ]}
        specs={[
          { label: 'Input format', value: `GIF (.gif), still or animated, one file at a time` },
          { label: 'Output', value: `One PNG (first frame), or a ZIP of PNG frames` },
          { label: 'On iPhone and iPad', value: `Frame extraction stops with a message for a GIF larger than ${Math.floor(IOS_CANVAS_MAX_PIXELS / 1e5) / 10} megapixels` },
          { label: 'On a computer', value: `Frame extraction up to 268 megapixels per frame; every frame is held in memory until the ZIP is made, so a long or large animation can run out of memory first` }
        ]}
        privacy={`Your GIF never leaves your device. The first frame is drawn by the browser itself; for frame extraction the gifuct-js decoder reads the animation on this page and fflate packs the PNG frames into the ZIP in memory. When a conversion fails, we receive the cleaned wording of the message, the tool's name and your browser's name and version.`}
        faqs={[
          { q: "Can I get every frame of an animated GIF as a PNG?", a: `Yes. Click "Extract all frames" and download gif-frames.zip: it holds one PNG per frame, numbered in order. Each one is the full image at that point of the animation, so you can use any frame on its own.` },
          { q: "Does \"Convert\" keep the animation?", a: `No. A PNG made here holds a single picture, so "Convert" saves the first frame only. To keep a moving image, keep the GIF, or make an animated PNG with GIF to APNG.` },
          { q: "Do the PNG frames keep the GIF's transparent background?", a: `Yes. Pixels that are transparent in the GIF stay transparent in the PNG, both in the single frame and in every extracted frame.` },
          { q: "Can I extract the frames on an iPhone?", a: `Yes, for GIFs up to ${Math.floor(IOS_CANVAS_MAX_PIXELS / 1e5) / 10} megapixels, the most an iPhone or iPad draws on one canvas. A bigger GIF gets a message asking you to use a computer.` }
        ]}
        tips={[
          `To make an animated GIF lighter rather than split it, use GIF Compressor.`
        ]}
      />
    </div>
  );
}