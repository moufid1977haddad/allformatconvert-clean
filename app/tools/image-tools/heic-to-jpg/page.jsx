'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { reportToolError } from '../../../lib/reportError';
import { imageDims } from '../../../lib/bigImage';
import { loadRaster, encodeRaster } from '../../../lib/imageOutput';
import { FileDownload } from '../../../components/FileDownload';
import UploadPrompt from '@/app/components/UploadPrompt';

import { RASTER_MAX_PIXELS } from '../../../lib/imageOutput';
import { CANVAS_MAX_PIXELS } from '../../../lib/bigImage';
import { PHONE_MAX_MP } from '../../../lib/reduceImage';
export default function HeicToJpgPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(85);
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
      if (await imageDims(file)) blob = await encodeRaster(await loadRaster(file), 'image/jpeg', quality);
      else {
        const heic2any = (await import('heic2any')).default;
        blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: quality / 100 });
      }
      const url = URL.createObjectURL(blob);
      setResult(url);
      setStatus('');
    } catch (err) {
      reportToolError({ tool: 'heic-to-jpg', file, error: err });
      setStatus('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">HEIC to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert iPhone HEIC photos to JPG format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a HEIC file" />}</p>
            <input ref={inputRef} type="file" accept=".heic,.heif" className="hidden" onChange={handleFile} />
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label>
            <input aria-label="Quality (%)" type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" />
          </div>
          <button onClick={convert} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Converting...' : 'Convert to JPG'}
          </button>
          {status && <p role="status" className="text-center text-yellow-400 text-sm">{status}</p>}
          {result && (
            <div className="space-y-2">
              <img alt="Preview of your image" src={result} className="max-h-48 mx-auto rounded" />
              <FileDownload href={result} name={file.name.replace(/\.hei[cf]$/i, '.jpg')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="HEIC to JPG"
        description={`HEIC to JPG converts a photo saved by an iPhone or iPad in HEIC or HEIF format into a JPG, for apps and websites that do not open HEIC. Before converting, a "Quality" slider from 10 to 100 (it starts at 85) sets the JPEG compression: higher keeps more detail, lower gives a smaller file. A browser that can open HEIC itself (Safari, and every browser on iPhone and iPad) decodes the photo at full size; one that cannot, such as Chrome, Edge or Firefox on a computer, uses the open-source heic2any library instead. One photo is converted per click, on your device.`}
        howToTitle="How to convert HEIC to JPG"
        howTo={[
          `Choose a .heic or .heif photo in the upload area; its file name appears there.`,
          `Move the "Quality" slider if you want more detail or a smaller file.`,
          `Click "Convert to JPG".`,
          `Click "Download" to save the JPG; it keeps the photo's name with .jpg at the end.`
        ]}
        specs={[
          { label: 'Input formats', value: `HEIC, HEIF (.heic, .heif)` },
          { label: 'Output format', value: `JPG (JPEG), quality 10 to 100` },
          { label: 'Largest photo', value: `In Safari on a Mac, ${Math.round(RASTER_MAX_PIXELS / 1e6)} megapixels; with heic2any this page sets no pixel cap, so very large photos depend on the browser's memory` },
          { label: 'On iPhone and iPad', value: `Photos up to ${PHONE_MAX_MP} megapixels are confirmed on a real iPhone; larger ones may need more memory than Safari gives a page` }
        ]}
        privacy={`The photo stays on your device. A browser that reads HEIC decodes it with its own decoder; otherwise the heic2any script is downloaded from our site when you click "Convert to JPG", and decodes it. The JPG is then encoded in the browser. If the conversion fails, a report goes to our error log: the cleaned error text, the file extension, a size range, the tool's name and your browser's name and version, never the photo or its name.`}
        faqs={[
          { q: "Will the JPG lose quality compared with the HEIC?", a: `Yes, a little. JPEG is a lossy format, so some fine detail is always dropped when the photo is saved. A higher "Quality" value keeps more of it and gives a bigger file; a lower value gives a smaller file with more visible blocks and blur.` },
          { q: "Are 24- and 48-megapixel iPhone photos converted at full size?", a: `Yes. On iPhone and iPad the photo is opened by iOS itself at full resolution; above ${Math.floor(CANVAS_MAX_PIXELS / 1e5) / 10} megapixels it is decoded in strips, because Safari limits the size of one canvas.` },
          { q: "Can I convert many HEIC photos at once?", a: `No. Each click on "Convert to JPG" handles a single photo. Image Converter accepts a whole batch of HEIC files and offers the JPGs together in a ZIP.` },
          { q: "Does the JPG carry the iPhone's GPS position?", a: `No. The JPG is a new image made from the decoded pixels, so EXIF details such as GPS location and camera model are not copied into it.` }
        ]}
        tips={[
          `If you need an exact copy without JPEG compression, use HEIC to PNG instead.`
        ]}
      />
    </div>
  );
}