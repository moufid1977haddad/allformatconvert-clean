'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { TIFF_DECODE_TIMEOUT_MS, TIFF_DECODE_TIMEOUT_MESSAGE } from '../../../lib/tiffDecode';
import { reportToolError, extOf } from '../../../lib/reportError';
import { describeFormatMismatch } from '../../../lib/detectFileFormat';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const GENERIC_DECODE_ERROR = "This TIFF file couldn't be read. It may be corrupted, or use a rare TIFF variant this tool doesn't support. Try re-saving it with different settings (e.g. Deflate/ZIP compression) in an image editor, or try a different file.";
const GENERIC_WORKER_ERROR = 'Something went wrong while converting this file. Please try again, or try a different file.';
const UNRECOGNIZED_FORMAT_ERROR = "This doesn't look like a valid TIFF file — its content doesn't match any format this tool recognizes. Double-check you selected the right file.";

import { CANVAS_MAX_PIXELS } from '../../../lib/bigImage';
export default function TiffToJpgPage() {
  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(90);
  const [background, setBackground] = useState('#ffffff'); // P24: colour of transparent areas in the JPG
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [mismatch, setMismatch] = useState(null);
  // P24 review (03/10): a multi-page TIFF (fax, scan) is said, and any page can be converted; a colour profile is not
  // applied, and said
  const [page, setPage] = useState(1);
  const [pageInfo, setPageInfo] = useState(null);
  const inputRef = useRef();
  const workerRef = useRef(null);
  const timeoutRef = useRef(null);
  const resultUrlRef = useRef(null);

  const stopWorker = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  useEffect(() => () => {
    stopWorker();
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setFile(f); setPage(1); setPageInfo(null);
    setResult(null);
    setError('');
    setMismatch(null);
  };

  const cancel = () => {
    stopWorker();
    setLoading(false);
  };

  const convert = async () => {
    if (!file) return;
    setError('');
    setMismatch(null);
    setLoading(true);
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
    setResult(null);

    const worker = new Worker(new URL('./tiffToJpg.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    timeoutRef.current = setTimeout(() => {
      stopWorker();
      reportToolError({ tool: 'tiff-to-jpg', file, error: new Error('decode_timeout') });
      setError(TIFF_DECODE_TIMEOUT_MESSAGE);
      setLoading(false);
    }, TIFF_DECODE_TIMEOUT_MS);

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'decoded') {
        // Decoded: the encode of a very large image (WebAssembly past 16.7 MP) gets time in proportion to its size.
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          stopWorker();
          reportToolError({ tool: 'tiff-to-jpg', file, error: new Error('encode_timeout') });
          setError('This image is taking too long to convert on this device. Try a smaller image, or a computer.');
          setLoading(false);
        }, Math.max(TIFF_DECODE_TIMEOUT_MS, (msg.pixels / 1e6) * 8000));
        return;
      }
      if (msg.type === 'done') {
        stopWorker();
        const url = URL.createObjectURL(msg.blob);
        resultUrlRef.current = url;
        setResult(url);
        setPageInfo({ count: msg.pageCount || 1, page: (msg.page || 0) + 1, icc: !!msg.hasIcc });
        setLoading(false);
      } else if (msg.type === 'error') {
        stopWorker();
        // The declared extension is already logged via `file` below; only
        // add the sniffed real format when it actually differs, so
        // tool_errors can distinguish a genuine decode bug (formats match)
        // from a mislabeled upload (they don't) -- see
        // docs/audit/RAPPORT-tiff-paint.md.
        const declaredExt = extOf(file.name);
        const detectedExt = msg.detectedFormat && msg.detectedFormat !== declaredExt ? msg.detectedFormat : null;
        reportToolError({ tool: 'tiff-to-jpg', file, error: new Error(msg.message), detectedExt });

        if (msg.notTiff) {
          const desc = describeFormatMismatch({
            detected: msg.detectedFormat ? { format: msg.detectedFormat, label: msg.detectedLabel } : null,
            expectedFormat: 'tiff',
            expectedLabel: 'TIFF',
            outputFormat: 'jpg',
          });
          setMismatch(desc);
          setError(desc ? '' : UNRECOGNIZED_FORMAT_ERROR);
        } else {
          setError(msg.knownLimitation ? msg.message : GENERIC_DECODE_ERROR);
        }
        setLoading(false);
      }
    };
    worker.onerror = (err) => {
      stopWorker();
      reportToolError({ tool: 'tiff-to-jpg', file, error: new Error(err?.message || 'unknown worker error') });
      setError(GENERIC_WORKER_ERROR);
      setLoading(false);
    };

    const buffer = await file.arrayBuffer();
    worker.postMessage({ buffer, quality, background, page: Math.max(0, Math.min((pageInfo?.count || 1e6), page) - 1) }, [buffer]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to JPG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to JPG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500"><UploadPrompt what="a TIFF file" /></p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          <div><label className="block text-sm text-neutral-500 mb-1">Quality: {quality}%</label><input aria-label="Quality (%)" type="range" min="10" max="100" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full" /></div>
          <label className="flex items-center gap-2 text-sm text-neutral-600">Transparent areas become <input id="jpg-background" type="color" value={background} onChange={(e) => setBackground(e.target.value)} className="w-10 h-8" aria-label="Background colour" /></label>
          {loading ? (
            <div className="space-y-2">
              <button disabled className="w-full bg-neutral-200 text-gray-600 rounded-xl py-3 font-semibold">Converting…</button>
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert to JPG</button>
          )}
          {mismatch && (
            <div className="text-center text-sm text-red-400">
              <p>{mismatch.text}</p>
              {mismatch.link && <Link href={mismatch.link.path} className="text-indigo-600 hover:underline font-medium">{mismatch.link.label}</Link>}
            </div>
          )}
          {error && <p className="text-red-400 text-center text-sm whitespace-pre-line">{error}</p>}
          {result && pageInfo && pageInfo.count > 1 && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3" data-tiff-pages>
              This TIFF has {pageInfo.count} pages: page {pageInfo.page} was converted.{' '}
              <label>Page <input type="number" min="1" max={pageInfo.count} value={page} onChange={(e) => setPage(Math.max(1, Math.min(pageInfo.count, Number(e.target.value) || 1)))} className="w-16 border border-amber-300 rounded px-1" aria-label="Page to convert" /></label> — then convert again.
            </div>
          )}
          {result && pageInfo?.icc && <p className="text-xs text-neutral-500" data-tiff-icc>This TIFF carries a colour profile (for example Adobe RGB), which is not applied here: colours may look less saturated than in a colour-managed viewer.</p>}
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result} className="max-h-48 mx-auto rounded" /><FileDownload href={result} name={file ? file.name.replace(/\.[^.]+$/, '') + '.jpg' : 'converted.jpg'} /></div>}
        </div>
      </div>
      <SeoContent
        title="TIFF to JPG"
        description={`TIFF to JPG converts a TIFF image, such as a scan, a fax or a photo exported for print, into a JPG for viewers and websites that do not display TIFF. Set the "Quality" slider (it starts at 90) and the color transparent areas should take. For a file with several pages, the first conversion tells you how many there are and lets you pick another page. The decoder is UTIF.js: 1 to 32-bit integer gray and RGB, palette and 8-bit CMYK TIFFs are read, the orientation tag is applied, and a color profile, which is not applied, is reported. The file is decoded and encoded in a background worker of your browser.`}
        howToTitle="How to convert TIFF to JPG"
        howTo={[
          `Pick the .tif or .tiff scan or photo in the upload area; its name is shown.`,
          `Set the "Quality" slider and the color next to "Transparent areas become".`,
          `Click "Convert to JPG"; "Cancel" stops a conversion that takes too long.`,
          `For a multi-page TIFF, type another number in the "Page" box and click "Convert to JPG" again.`,
          `Click "Download" to save the JPG, named after the TIFF.`
        ]}
        specs={[
          { label: 'Input format', value: `TIFF (.tif, .tiff), one file` },
          { label: 'Output format', value: `JPG, quality 10 to 100` },
          { label: 'Not supported', value: `Planar color storage, and CMYK other than 8 bits per channel: refused with a message` },
          { label: 'Time limit', value: `Decoding stops after ${TIFF_DECODE_TIMEOUT_MS / 1000} seconds with an explanation; encoding gets more time for large images` }
        ]}
        privacy={`The TIFF is copied into a Web Worker inside your browser, decoded there with UTIF.js and written as a JPG, by the browser or by MozJPEG in WebAssembly for images over ${Math.floor(CANVAS_MAX_PIXELS / 1e5) / 10} megapixels. The file is not uploaded. Failures send a report: the cleaned error text, extension, size range, tool name and your browser's name and version.`}
        faqs={[
          { q: "Can I convert a page other than the first one?", a: `Yes. After the first conversion of a multi-page TIFF, the page says how many pages it has and shows a "Page" box. Type the page number, then click "Convert to JPG" again; reduced-size thumbnails stored in the file are not counted as pages.` },
          { q: "Is the TIFF's colour profile applied?", a: `No. A profile such as Adobe RGB is not applied, so colors can look duller than in a color-managed editor; the page says so under the result. Convert the image to sRGB in your editor first for faithful colors.` },
          { q: "Can I convert a 16-bit TIFF?", a: `Yes. It is converted to 8 bits per channel, the depth of a JPG. The darkest and brightest values actually present are stretched to black and white, so scientific or scanner files that use only part of the 16-bit range do not come out near-black.` },
          { q: "Why did the conversion stop?", a: `The decoder went ${TIFF_DECODE_TIMEOUT_MS / 1000} seconds without finishing, far longer than a normal TIFF needs, which usually means a non-standard LZW variant. The message suggests re-saving the file with Deflate/ZIP or no compression.` }
        ]}
        tips={[
          `If the TIFF has transparency you want to keep, use TIFF to PNG instead of picking a background color.`
        ]}
      />
    </div>
  );
}
