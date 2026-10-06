'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { loadRaster, mapBands, renderFull, rotateRaster, encodeRaster, encodeRasterLike, resultOf } from '../../../lib/imageOutput';
import { rasterFromRGBA } from '../../../lib/bigImage';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { RASTER_MAX_PIXELS } from '../../../lib/imageOutput';
import { PHONE_MAX_MP } from '../../../lib/reduceImage';
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
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".webp" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {note && <p className="text-amber-700 text-center text-sm">{note}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="WebP to PNG"
        description={`WebP to PNG saves a WebP picture as a PNG, for software that does not read WebP. PNG is lossless, so the image is stored as your browser decodes it, and transparent areas stay transparent. A lossy WebP keeps the compression artifacts it already has: converting does not restore detail. An animated WebP becomes its first frame only, and the page warns you before converting. The PNG keeps the name of the WebP. Each conversion takes one WebP and builds its PNG on this page.`}
        howToTitle="How to convert WebP to PNG"
        howTo={[
          `Choose the WebP picture in the upload area.`,
          `Click "Convert" and check the preview.`,
          `Click "Download" for the PNG, which keeps the WebP's name.`
        ]}
        specs={[
          { label: 'Input format', value: `WebP (.webp), one file; animated files give their first frame` },
          { label: 'Output format', value: `PNG, lossless, transparency kept` },
          { label: 'Largest image', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer` },
          { label: 'On iPhone and iPad', value: `No smaller cap; very large pictures are rebuilt in strips, and ${PHONE_MAX_MP} megapixels is the largest size confirmed on a real iPhone` }
        ]}
        privacy={`No upload takes place: your browser decodes the WebP and the PNG is built in memory on this page, by the canvas or, for very large images on iPhone and iPad, by the page's own PNG writer. When an error is shown, its cleaned message, the tool's name and your browser's name and version reach our log.`}
        faqs={[
          { q: "Does the PNG keep the transparent areas?", a: `Yes. WebP and PNG both have an alpha channel, so transparent and semi-transparent pixels stay that way. Partly transparent edge colors can change slightly in the browser's canvas, more for nearly transparent pixels.` },
          { q: "Does converting restore detail a lossy WebP lost?", a: `No. The PNG stores the WebP exactly as decoded, including any blur or blocks from its compression. It only stops further loss if you edit and save the picture again.` },
          { q: "Can I convert an animated WebP?", a: `No, not as an animation. The PNG holds the first frame only, and a note says so when you pick the file. To keep every frame, convert the animation to GIF.` }
        ]}
        tips={[
          `To make the PNG smaller afterwards without changing its format, run it through Image Compressor.`
        ]}
      />
    </div>
  );
}