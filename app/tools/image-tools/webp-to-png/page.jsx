'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
export default function WebPtoPNGPage() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const [note, setNote] = useState('');
  // An animated WebP (ANIM chunk) is drawn as its first frame only: say so instead of
  // handing back one frame as if it were the whole file (29/09).
  const handleFile = async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setError('');
    const head = new Uint8Array(await f.slice(0, 64).arrayBuffer());
    const animated = String.fromCharCode(...head.slice(12, 16)) === 'VP8X' && (head[20] & 0x02) !== 0;
    setNote(animated ? 'This WebP is animated: the PNG will contain its first frame only (PNG has no animation). For every frame, convert it to GIF, or split it with an animation tool.' : '');
  };
  const convert = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = raster;
      setResult(resultOf(await encodeRaster(out, 'image/png'), file.name, ''));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">WebP to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert WebP to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500">Click or drop an image here</p>}
            <input ref={inputRef} type="file" accept=".webp" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {note && <p className="text-amber-700 text-center text-sm">{note}</p>}
          {result && <div className="space-y-2"><img src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="WebP to PNG"
        description="WebP to PNG converts a WebP image to PNG format entirely in your browser using the HTML canvas — your file is never uploaded to a server. Transparency in the WebP file is preserved in the PNG output."
        howTo={[
          "Click the upload area and select a WebP file from your device.",
          "Click 'Convert' to render it to PNG.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is WebP to PNG completely free to use?", a: "Yes, it's completely free with no registration required." },
          { q: "Will the conversion affect my image quality?", a: "No, the pixels are copied as-is with no additional compression applied." },
          { q: "How many images can I convert at once?", a: "One at a time — there's no batch conversion feature." },
          { q: "Is my uploaded data secure and private?", a: "Yes, conversion happens entirely in your browser and your file is never uploaded to a server." }
        ]}
        tips={[
          "PNG files are typically larger than WebP at the same visual quality, so expect a bigger file size after conversion.",
          "Use this tool to prepare images for websites or apps that don't yet support WebP.",
          "Convert one file at a time and download each result before starting the next.",
          "Download your PNG right away, since nothing is stored anywhere after you leave the page."
        ]}
      />
    </div>
  );
}