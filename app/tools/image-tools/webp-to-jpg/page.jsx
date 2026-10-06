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
export default function WebPtoJPGPage() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  // P24 (03/10): JPG quality and the colour transparent areas become (ezgif: quality factor and background colour)
  const [quality, setQuality] = useState(92);
  const [background, setBackground] = useState('#ffffff');
  const inputRef = useRef();
  const [note, setNote] = useState('');
  // P24 review (03/10): an animated WebP is drawn as its first frame — said, as WebP to PNG already did
  const handleFile = async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setError('');
    const head = new Uint8Array(await f.slice(0, 64).arrayBuffer());
    const animated = String.fromCharCode(...head.slice(12, 16)) === 'VP8X' && (head[20] & 0x02) !== 0;
    setNote(animated ? 'This WebP is animated: the JPG will contain its first frame only (JPG has no animation). For every frame, convert it to GIF.' : '');
  };
  const convert = async () => {
    setError(''); setResult(null);
    if (!file) return;
    setBusy(true);
    try {
      const raster = await loadRaster(file);
      const out = raster;
      setResult(resultOf(await encodeRaster(out, 'image/jpeg', Number(quality), { background }), file.name, ''));
    } catch (e) { setError(e?.message || 'Could not process this image.'); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">WebP to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert WebP to JPG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".webp" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="text-neutral-600">JPG quality: {quality}
              <input id="jpg-quality" type="range" min="10" max="100" value={quality} onChange={(e) => setQuality(e.target.value)} className="w-full" />
            </label>
            <label className="text-neutral-600 flex items-center gap-2">Transparent areas become
              <input id="jpg-background" type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="w-10 h-8" aria-label="Background colour" />
            </label>
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {note && <p className="text-amber-700 text-center text-sm" data-webp-note>{note}</p>}
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="WebP to JPG"
        description={`WebP to JPG converts a WebP image, often saved from a website, into a JPG for apps and forms that do not accept WebP. Set "JPG quality" from 10 to 100 (92 at first) and choose the color that replaces transparent areas, white unless you change it. An animated WebP is turned into its first frame, and a note says so as soon as you pick the file. One image per conversion; the JPG keeps the WebP's name. Decoding and encoding happen in your browser, with MozJPEG in WebAssembly for very large images on iPhone and iPad.`}
        howToTitle="How to convert WebP to JPG"
        howTo={[
          `Pick the .webp image you saved; a note appears if it is animated.`,
          `Adjust "JPG quality" and the color next to "Transparent areas become".`,
          `Click "Convert".`,
          `Click "Download" for a JPG named like the WebP.`
        ]}
        specs={[
          { label: 'Input format', value: `WebP (.webp), still or animated (first frame), one file` },
          { label: 'Output format', value: `JPG, quality 10 to 100` },
          { label: 'Largest image', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer` },
          { label: 'On iPhone and iPad', value: `Very large images are encoded by MozJPEG in memory; ${PHONE_MAX_MP} megapixels is the largest size confirmed on a real iPhone` }
        ]}
        privacy={`The WebP is opened by your browser and re-encoded as a JPG without leaving the device; we do not receive the image. If an error appears on screen, we log its cleaned wording with the tool's name and your browser's name and version (no file name, no image data) to find and fix the problem.`}
        faqs={[
          { q: "Can I choose the JPG quality?", a: `Yes. The "JPG quality" slider goes from 10 to 100 and starts at 92. Lower values give a smaller file with more visible compression; set it before clicking "Convert", and convert again to try another value.` },
          { q: "Can I pick the colour of a transparent background?", a: `Yes. Transparent areas are filled with the color picked next to "Transparent areas become", white by default, because a JPG cannot store transparency. Pick black or any other color to match where the picture will be used.` },
          { q: "Does the JPG keep an animated WebP's motion?", a: `No. Only the first frame is kept, since JPG holds one still picture. The page warns you when the WebP is animated; to keep the motion, convert it to a GIF instead.` }
        ]}
        tips={[
          `If you need to keep the transparency, use WebP to PNG rather than JPG.`
        ]}
      />
    </div>
  );
}