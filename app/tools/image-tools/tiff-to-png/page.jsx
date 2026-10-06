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

export default function TiffToPngPage() {
  const [file, setFile] = useState(null);
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

    const worker = new Worker(new URL('./tiffToPng.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    timeoutRef.current = setTimeout(() => {
      stopWorker();
      reportToolError({ tool: 'tiff-to-png', file, error: new Error('decode_timeout') });
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
          reportToolError({ tool: 'tiff-to-png', file, error: new Error('encode_timeout') });
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
        reportToolError({ tool: 'tiff-to-png', file, error: new Error(msg.message), detectedExt });

        if (msg.notTiff) {
          const desc = describeFormatMismatch({
            detected: msg.detectedFormat ? { format: msg.detectedFormat, label: msg.detectedLabel } : null,
            expectedFormat: 'tiff',
            expectedLabel: 'TIFF',
            outputFormat: 'png',
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
      reportToolError({ tool: 'tiff-to-png', file, error: new Error(err?.message || 'unknown worker error') });
      setError(GENERIC_WORKER_ERROR);
      setLoading(false);
    };

    const buffer = await file.arrayBuffer();
    worker.postMessage({ buffer , page: Math.max(0, Math.min((pageInfo?.count || 1e6), page) - 1) }, [buffer]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500"><UploadPrompt what="a TIFF file" /></p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          {loading ? (
            <div className="space-y-2">
              <button disabled className="w-full bg-neutral-200 text-gray-600 rounded-xl py-3 font-semibold">Converting…</button>
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert to PNG</button>
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
          {result && <div className="space-y-2"><img alt="Preview of your image" src={result} className="max-h-48 mx-auto rounded" /><FileDownload href={result} name={file ? file.name.replace(/\.[^.]+$/, '') + '.png' : 'converted.png'} /></div>}
        </div>
      </div>
      <SeoContent
        title="TIFF to PNG"
        description={`TIFF to PNG saves a TIFF image as a PNG, a lossless format that every browser displays, which Chrome, Edge and Firefox on a computer cannot do with TIFF. Transparency in the TIFF is kept. For a multi-page file, the first conversion reports the page count and offers a "Page" box to convert any other page. The UTIF.js decoder reads 1 to 32-bit integer grey and RGB images, palette images and 8-bit CMYK, which is turned into RGB. Files with more than 8 bits per channel are brought down to 8 bits, their darkest and brightest values stretched to black and white. The orientation tag is applied.`}
        howToTitle="How to convert TIFF to PNG"
        howTo={[
          `Load the .tiff or .tif image into the upload area.`,
          `Click "Convert to PNG", or "Cancel" to stop.`,
          `If the file has several pages, enter a number in the "Page" box and convert again.`,
          `Click "Download" to get the PNG, named after the TIFF.`
        ]}
        specs={[
          { label: 'Input format', value: `TIFF (.tif, .tiff), one file` },
          { label: 'Output format', value: `PNG, 8 bits per channel, transparency kept` },
          { label: 'Refused', value: `Planar colour storage, and CMYK at more than 8 bits per channel` },
          { label: 'Time limit', value: `${TIFF_DECODE_TIMEOUT_MS / 1000} seconds to decode, then the worker is stopped with a message` }
        ]}
        privacy={`Decoding and PNG encoding take place in a worker thread of your own browser; the TIFF does not travel to any server. Should the conversion fail, we receive a log entry with the cleaned error wording, the file extension, its size range, the tool's name and your browser's name and version, but never the image or its file name.`}
        faqs={[
          { q: "Is the PNG an exact copy of the TIFF?", a: `Yes for opaque 8-bit grey or RGB TIFFs: PNG compression is lossless. Partly transparent pixels can change slightly, more for nearly transparent ones; a 16-bit or other high-depth TIFF is reduced to 8 bits with its range stretched; CMYK becomes RGB; an embedded colour profile is not applied.` },
          { q: "Can I convert all pages of a multi-page TIFF?", a: `Yes, one at a time. After converting, type the next number in the "Page" box and click "Convert to PNG" again; each page is downloaded as its own PNG.` },
          { q: "Does a TIFF with an alpha channel stay transparent?", a: `Yes. A TIFF with an alpha channel gives a PNG with the same transparent areas; nothing is flattened onto a colour, unlike TIFF to JPG.` }
        ]}
        tips={[
          `If the decoder stalls on a non-standard LZW TIFF, re-save the file with Deflate/ZIP compression or none, as the message suggests, and convert it again.`
        ]}
      />
    </div>
  );
}
