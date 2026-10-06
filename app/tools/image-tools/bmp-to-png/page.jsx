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
export default function BMPtoPNGPage() {
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
        <h1 className="text-3xl font-bold text-center mb-2">BMP to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert BMP to PNG in your browser</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {image ? <img alt="Preview of your image" src={image} className="max-h-48 mx-auto rounded" /> : <p className="text-neutral-500"><UploadPrompt what="an image" /></p>}
            <input ref={inputRef} type="file" accept=".bmp" className="hidden" onChange={handleFile} />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button onClick={convert} disabled={!image || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result.url} className="max-h-48 mx-auto rounded" /><FileDownload href={result.url} name={result.name} /></div>}
        </div>
      </div>
      <SeoContent
        title="BMP to PNG"
        description={`BMP to PNG turns a Windows bitmap (.bmp) into a PNG file. A bitmap usually stores its pixels as raw rows; PNG stores them with lossless compression. The width and height stay the same, the colors stay as your browser shows them, and the new file keeps the bitmap's name with a .png ending. This page converts one bitmap per click; for a batch, or for JPG or WebP output, use Image Converter. A bitmap your browser cannot open is refused with a message instead of giving a wrong picture. The bitmap is decoded and re-saved on this page.`}
        howToTitle="How to convert BMP to PNG"
        howTo={[
          `Pick your .bmp file in the upload area; the bitmap appears there as a preview.`,
          `Click "Convert".`,
          `Click "Download" under the result to save the PNG, named after your bitmap.`
        ]}
        specs={[
          { label: 'Input format', value: `BMP (.bmp), one file at a time` },
          { label: 'Output format', value: `PNG, lossless, same width and height` },
          { label: 'Largest image', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels on a computer; a bigger bitmap is refused with its size in the message` },
          { label: 'On iPhone and iPad', value: `No lower cap is set, but Safari gives a page far less memory than a computer; the largest photo this site has confirmed on a real iPhone is ${PHONE_MAX_MP} megapixels` }
        ]}
        privacy={`The bitmap is decoded by your own browser and written out as a PNG on this page. It is not uploaded to us or to anyone else. If the conversion fails, a cleaned report goes to our error log: the message shown, the tool's name and your browser's name and version, without the file or its name.`}
        faqs={[
          { q: "Does converting BMP to PNG change the picture?", a: `No. PNG is lossless, so the PNG has the same size and the colors your browser displays for the bitmap. One exception: in a 32-bit bitmap with partly transparent pixels, those pixels can shift slightly on the way through the browser's canvas.` },
          { q: "Why is my BMP file refused?", a: `Either it is too large or it cannot be read. Above ${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels the message gives the bitmap's size; otherwise it says the file may be damaged or in a form your browser cannot open.` },
          { q: "Does Image Converter take a whole set of bitmaps?", a: `Yes. This page takes one bitmap at a time, but Image Converter accepts a batch of BMP files, converts them one after another, and offers all results together as a ZIP.` }
        ]}
        tips={[
          `Need a JPG or WebP rather than a PNG? Image Converter reads BMP files too and lets you pick the output format.`
        ]}
      />
    </div>
  );
}