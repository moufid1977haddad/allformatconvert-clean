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
export default function JPGtoPNGPage() {
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) { setImage(URL.createObjectURL(f)); setFile(f); setResult(null); setError(''); } };
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
        <h1 className="text-3xl font-bold text-center mb-2">JPG to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JPG to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".jpg,.jpeg" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="JPG to PNG"
        description={`JPG to PNG saves a JPG or JPEG photo as a PNG. From then on the pixels are kept without further loss, which helps when a picture will be edited and saved several times, or when a program asks for PNG. Converting cannot undo the compression already in the JPG, and it adds no transparency: the PNG is as opaque as the photo. A photo taken sideways with an orientation tag is stored the right way up, and camera details such as GPS location are not copied. One photo per conversion, decoded and saved by the browser.`}
        howToTitle="How to convert JPG to PNG"
        howTo={[
          `Pick a .jpg or .jpeg photo in the upload area to see it there.`,
          `Click "Convert" and look at the PNG preview.`,
          `Click "Download" to save the PNG, named after your photo.`
        ]}
        specs={[
          { label: 'Input format', value: `JPG, JPEG (.jpg, .jpeg)` },
          { label: 'Output format', value: `PNG, opaque, same width and height` },
          { label: 'Largest photo', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer` },
          { label: 'On iPhone and iPad', value: `No smaller cap is set, but a phone gives a page much less memory; ${PHONE_MAX_MP}-megapixel photos are the largest confirmed on a real iPhone` }
        ]}
        privacy={`Your photo is decoded and saved as PNG by the browser on this device; no copy is sent to our servers or to a third party. On an iPhone or iPad, very large photos are processed in strips, still locally. If an error message appears, it is logged for us in cleaned form with the tool's name and your browser's name and version, never with the photo.`}
        faqs={[
          { q: "Does converting JPG to PNG improve the quality?", a: `No. The PNG keeps the photo exactly as decoded, including any blocks or blur the JPG compression already caused. What you gain is that later edits saved as PNG lose nothing more.` },
          { q: "Can the PNG have a transparent background?", a: `No, not by converting: a JPG has no transparency, so the PNG is fully opaque. To cut out the subject and get a transparent PNG, use Background Remover.` },
          { q: "Does the PNG keep the camera's EXIF data?", a: `No. The PNG is written from the pixels only; the EXIF data of the JPG, such as GPS position, date and camera model, is left out.` }
        ]}
        tips={[
          `For a lossless copy in WebP format instead, use JPG to WebP with its lossless mode and compare the two file sizes.`
        ]}
      />
    </div>
  );
}