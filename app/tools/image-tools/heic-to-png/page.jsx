'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reportToolError } from '../../../lib/reportError';
import { imageDims } from '../../../lib/bigImage';
import { loadRaster, encodeRaster } from '../../../lib/imageOutput';
import { FileDownload } from '../../../components/FileDownload';
import UploadPrompt from '@/app/components/UploadPrompt';

import { RASTER_MAX_PIXELS } from '../../../lib/imageOutput';
import { PHONE_MAX_MP } from '../../../lib/reduceImage';
export default function HeicToPngPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef();

  const handleFile = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setStatus('');
  };

  const convert = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Converting...');
    try {
      // 30/09 (owner's iPhone): Safari (iPhone, iPad, Mac) decodes HEIC itself, at full size -- 24 and 48 MP photos
      // included, in bands beyond iOS's 16.7 MP canvas limit (lib/bigImage.js) -- where heic2any needed one canvas
      // the size of the photo. heic2any (libheif in WebAssembly) stays for the browsers that cannot read HEIC.
      let blob;
      if (await imageDims(file)) blob = await encodeRaster(await loadRaster(file), 'image/png', 92);
      else {
        const heic2any = (await import('heic2any')).default;
        blob = await heic2any({ blob: file, toType: 'image/png' });
      }
      const url = URL.createObjectURL(blob);
      setResult(url);
      setStatus('');
    } catch (err) {
      reportToolError({ tool: 'heic-to-png', file, error: err });
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HEIC to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert iPhone HEIC photos to PNG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a HEIC file" />}</p>
            <input ref={inputRef} type="file" accept=".heic,.heif" className="hidden" onChange={handleFile} />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to PNG'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img alt="Preview of your image" src={result} className="max-h-48 mx-auto rounded" />
              <FileDownload href={result} name={file.name.replace(/\.hei[cf]$/i, '.png')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HEIC to PNG"
        description={`HEIC to PNG makes a PNG from a HEIC or HEIF photo, the format iPhones and iPads save pictures in. PNG stores pixels without lossy compression, so there is no quality slider here: the photo is written exactly as it was decoded. Choose it when the picture will be edited further or when a program asks for PNG; choose HEIC to JPG when a small file matters more. Safari and the other browsers on iPhone and iPad decode HEIC themselves; a browser that cannot, like Chrome or Firefox on a computer, loads the heic2any library for it.`}
        howToTitle="How to convert HEIC to PNG"
        howTo={[
          `Select the .heic or .heif photo in the upload area.`,
          `Click "Convert to PNG" and wait for the preview of the result.`,
          `Click "Download" to save the PNG under the photo's name.`
        ]}
        specs={[
          { label: 'Input formats', value: `HEIC or HEIF (.heic, .heif)` },
          { label: 'Output format', value: `PNG, lossless, 8 bits per channel` },
          { label: 'Largest photo', value: `${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels in Safari on a Mac; with heic2any no cap is set by the page` },
          { label: 'On iPhone and iPad', value: `${PHONE_MAX_MP}-megapixel photos are the largest confirmed on a real iPhone` }
        ]}
        privacy={`The photo is not sent anywhere: the HEIC is read on your phone or computer, by the browser's own decoder or by the heic2any library, fetched from our site only when needed, and the PNG is produced right there. A failed conversion sends a short report to our error log (cleaned message, extension, size range, tool name, browser name and version); the photo itself and its name are never part of it.`}
        faqs={[
          { q: "Is the PNG an exact copy of the HEIC photo?", a: `Yes, of the pixels your browser decodes. Nothing is compressed away, but the browser works with 8 bits per colour channel, so a photo stored with more than 8 bits per channel comes out at 8 bits.` },
          { q: "Is the iPhone's location removed from the PNG?", a: `Yes. The PNG is built from the pixels alone; the location, date and camera details stored in the HEIC are not copied.` },
          { q: "Is a photo bigger than Safari's canvas limit converted whole?", a: `Yes. iOS decodes the HEIC itself, at full size, and a photo larger than one Safari canvas allows is decoded in strips, so big photos from recent iPhones are converted whole.` }
        ]}
        tips={[
          `Several HEIC photos to convert? Image Converter takes them in one batch and can write PNG, JPG or WebP.`
        ]}
      />
    </div>
  );
}