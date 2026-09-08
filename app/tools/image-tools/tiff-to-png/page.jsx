'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import { TIFF_DECODE_TIMEOUT_MS } from '../../../lib/tiffDecode';

const TIMEOUT_MESSAGE = "This file is taking far longer than a normal TIFF to decode, which usually means it uses a TIFF variant this tool can't read correctly (this happens with some non-standard LZW-compressed TIFFs). Try re-saving the file with a different compression setting (Deflate/ZIP or uncompressed) in an image editor such as GIMP or IrfanView, or convert it with desktop software and re-upload the result.";

export default function TiffToPngPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
    setFile(f);
    setResult(null);
    setError('');
  };

  const cancel = () => {
    stopWorker();
    setLoading(false);
  };

  const convert = async () => {
    if (!file) return;
    setError('');
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
      setError(TIMEOUT_MESSAGE);
      setLoading(false);
    }, TIFF_DECODE_TIMEOUT_MS);

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'done') {
        stopWorker();
        const url = URL.createObjectURL(msg.blob);
        resultUrlRef.current = url;
        setResult(url);
        setLoading(false);
      } else if (msg.type === 'error') {
        stopWorker();
        setError(msg.knownLimitation ? msg.message : 'Could not decode this TIFF file: ' + msg.message);
        setLoading(false);
      }
    };
    worker.onerror = (err) => {
      stopWorker();
      setError('Could not decode this TIFF file: ' + (err?.message || 'unknown worker error'));
      setLoading(false);
    };

    const buffer = await file.arrayBuffer();
    worker.postMessage({ buffer }, [buffer]);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TIFF to PNG</h1>
        <p className="text-neutral-500 text-center mb-8">Convert TIFF images to PNG</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500">Click or drop a TIFF file here</p>}
            <input ref={inputRef} type="file" accept=".tiff,.tif" className="hidden" onChange={handleFile} />
          </div>
          {loading ? (
            <div className="space-y-2">
              <button disabled className="w-full bg-neutral-200 text-gray-600 rounded-xl py-3 font-semibold">Converting…</button>
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Convert to PNG</button>
          )}
          {error && <p className="text-red-400 text-center text-sm whitespace-pre-line">{error}</p>}
          {result && <div className="space-y-2"><img src={result} className="max-h-48 mx-auto rounded" /><a href={result} download="converted.png" className="block w-full text-center bg-green-600 hover:bg-green-500 rounded-xl py-2 font-semibold transition">Download PNG</a></div>}
        </div>
      </div>
      <SeoContent
        title="TIFF to PNG"
        description="TIFF to PNG converts a TIFF image to PNG format entirely in your browser using the open-source UTIF.js decoder, running in a background Web Worker so the page never freezes — your file is never uploaded to a server. Multi-page TIFFs are supported for decoding, but only the first page is converted."
        howTo={[
          "Click the upload area and select a TIFF or TIF file from your device.",
          "Click 'Convert to PNG' to process the image.",
          "Preview the converted image.",
          "Click the download button to save your PNG file."
        ]}
        faqs={[
          { q: "Is TIFF to PNG completely free to use?", a: "Yes, it's 100% free with no registration required." },
          { q: "What file size limits does TIFF to PNG have?", a: "There's no fixed size limit — processing happens locally in your browser, so it's limited only by your device's available memory." },
          { q: "Will the conversion affect image quality?", a: "No, the pixels are copied as-is with no lossy compression applied." },
          { q: "Do I need to download software to use this tool?", a: "No, it works entirely in your browser on any device with a modern browser." },
          { q: "Are all TIFF variants supported?", a: "Most are (uncompressed, most LZW and PackBits variants, and standard Deflate, in the common chunky/interleaved color layout). TIFFs saved with planar color storage (color channels stored as separate planes rather than interleaved) aren't supported and are rejected with a clear error. A small number of non-standard TIFFs decode unusually slowly; if that happens, conversion is stopped automatically after 20 seconds with an explanation and a suggestion, and you can also cancel manually at any time." }
        ]}
        tips={[
          "If your TIFF is multi-page, only the page the browser renders will be converted.",
          "PNG offers better web compatibility than TIFF, since most browsers can't display TIFF images directly.",
          "Check the converted PNG's dimensions match what you expect before using it in a project.",
          "Convert one file at a time — there's no batch upload option."
        ]}
      />
    </div>
  );
}
