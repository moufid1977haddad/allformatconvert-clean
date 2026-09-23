'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { runStagedToolResult, mediaServiceConfigured, MediaJobError } from '../../../lib/mediaJob';
import { MAX_PDF_COMPRESS_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';

const MIB = 1024 * 1024;
const SERVER_MAX_LABEL = `${Math.round(MAX_PDF_COMPRESS_STAGED_BYTES / MIB)} MB`;

// Same three levels as the reference site (iLovePDF), calibrated against it on the same files
// (docs/audit/RAPPORT-ecarts-marche.md §3a).
const LEVELS = [
  { id: 'extreme', title: 'Extreme', note: 'Smallest file. Images reduced to screen resolution (72 dpi).' },
  { id: 'recommended', title: 'Recommended', note: 'Good quality, good compression. Images at 150 dpi.' },
  { id: 'low', title: 'Lossless', note: 'Identical look, nothing re-encoded. Fonts and structure optimised.' },
];

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('recommended');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef();
  const workerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Up to SERVER_MAX: the compression engine (server). Above it, and only when the device can take it:
  // the older in-browser optimisation, structure only -- announced before the file is chosen.
  const serverMax = mediaServiceConfigured() ? MAX_PDF_COMPRESS_STAGED_BYTES : OFFICE_STAGED_THRESHOLD_BYTES;
  const browserMax = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const browserMaxLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;
  const maxPages = isMobile ? MOBILE_MAX_PAGES : MAX_PAGES;
  const inBrowser = !!file && file.size > serverMax;

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setResult(null);
    setStatus('');
    setError('');
    if (f.size > Math.max(serverMax, browserMax)) {
      setError(`This file is ${(f.size / MIB).toFixed(0)} MB, which is over the ${browserMax > serverMax ? browserMaxLabel : SERVER_MAX_LABEL} limit${isMobile ? ' on this device' : ''}. Split it with PDF Split first, then compress each part.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (abortRef.current) abortRef.current.abort();
    setLoading(false);
    setProgress(0);
    setStatus('Cancelled.');
  };

  const finish = (blob, stats) => {
    setProgress(100);
    setLoading(false);
    const newSize = blob.size;
    setResult({ url: URL.createObjectURL(blob), originalSize: file.size, newSize, ratio: ((1 - newSize / file.size) * 100).toFixed(1), name: file.name, stats });
  };

  const notSmaller = () => {
    setLoading(false);
    setStatus(level === 'extreme'
      ? 'This PDF is already as small as we can make it — no smaller file could be produced, so nothing was changed.'
      : `This PDF is already well optimised: the "${LEVELS.find((l) => l.id === level).title}" level could not make it smaller, so nothing was changed. Try a stronger level.`);
  };

  const compressOnServer = async () => {
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      if (file.size <= OFFICE_STAGED_THRESHOLD_BYTES) {
        setPhase('Compressing…');
        const form = new FormData();
        form.append('level', level);
        form.append('file', file, file.name);
        const res = await fetch('/api/pdf-compress', { method: 'POST', body: form, signal: ac.signal });
        const type = res.headers.get('content-type') || '';
        if (res.ok && type.includes('application/pdf')) {
          let stats = null;
          try { stats = JSON.parse(res.headers.get('X-Compress-Stats') || 'null'); } catch { /* stats are optional */ }
          return finish(await res.blob(), stats);
        }
        const j = await res.json().catch(() => ({}));
        if (res.ok && j.notSmaller) return notSmaller();
        throw new Error(j.error || 'Compression failed. Please try again.');
      }
      const { json, blob } = await runStagedToolResult({
        file, endpoint: '/api/pdf-compress', fields: { level }, purpose: 'pdf-compress', signal: ac.signal,
        onStage: (s) => {
          if (s.stage === 'upload') { setPhase('Uploading…'); setProgress(Math.round(s.pct || 0)); }
          else if (s.stage === 'converting') { setPhase('Compressing…'); setProgress(0); }
          else if (s.stage === 'download') { setPhase('Downloading…'); setProgress(Math.round(s.pct || 0)); }
        },
      });
      if (json.ok && json.notSmaller) return notSmaller();
      if (!json.ok || !blob) throw new Error(json.error || 'Compression failed. Please try again.');
      return finish(blob, json);
    } catch (e) {
      if ((e instanceof MediaJobError && e.code === 'cancelled') || e?.name === 'AbortError') return;
      setLoading(false);
      setError(e?.message || 'Compression failed. Please try again.');
    } finally {
      abortRef.current = null;
    }
  };

  const compressInBrowser = () => {
    setPhase('Optimising in your browser…');
    const worker = new Worker(new URL('./pdfCompress.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'done') {
        workerRef.current = null;
        if (msg.newSize >= msg.originalSize) return notSmaller();
        finish(msg.blob, null);
      } else if (msg.type === 'limit') {
        setLoading(false);
        workerRef.current = null;
        setError(`${msg.message} In-browser compression becomes unreliable beyond that point — split the file into smaller pieces first and try again.`);
      } else if (msg.type === 'error') {
        setLoading(false);
        workerRef.current = null;
        setError('Error: ' + msg.message);
      }
    };
    worker.onerror = (err) => {
      setLoading(false);
      workerRef.current = null;
      setError('Error: ' + (err?.message || 'unknown worker error'));
    };
    worker.postMessage({ file, maxPages });
  };

  const compress = () => {
    if (!file) return;
    setLoading(true);
    setStatus('');
    setError('');
    setProgress(0);
    setResult(null);
    if (inBrowser) compressInBrowser();
    else compressOnServer();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF Compression</h1>
        <p className="text-neutral-500 text-center mb-2">Reduce PDF file size while keeping it sharp</p>
        <p className="text-neutral-500 text-xs text-center mb-8">Files up to {SERVER_MAX_LABEL} are compressed with our full engine (images, fonts and structure). Larger files, up to {browserMaxLabel}{isMobile ? ' on this device' : ''}, get a lighter in-browser optimisation (structure only).</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !loading && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">Original: {formatSize(file.size)}</p>}
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          {inBrowser ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">This file is over {SERVER_MAX_LABEL}, so it will be optimised in your browser: structure only, images and fonts untouched, smaller savings. Split it with PDF Split to use the full engine on each part.</p>
          ) : (
            <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3" disabled={loading}>
              <legend className="sr-only">Compression level</legend>
              {LEVELS.map((l) => (
                <label key={l.id} className={`cursor-pointer rounded-xl border p-3 text-left transition ${level === l.id ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-300'}`}>
                  <input type="radio" name="level" value={l.id} checked={level === l.id} onChange={() => setLevel(l.id)} className="sr-only" />
                  <span className="block font-semibold text-neutral-800">{l.title}</span>
                  <span className="block text-xs text-neutral-600 mt-1">{l.note}</span>
                </label>
              ))}
            </fieldset>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label={phase || 'Compressing…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={compress} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
              Compress PDF
            </button>
          )}
          {status && !loading && <p className="text-center text-amber-800 text-sm">{status}</p>}
          {result && !loading && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center space-y-3">
              <div className="text-green-700 text-xl font-bold">Done!</div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><div className="text-neutral-500">Before</div><div className="font-bold">{formatSize(result.originalSize)}</div></div>
                <div><div className="text-neutral-500">After</div><div className="font-bold text-indigo-600">{formatSize(result.newSize)}</div></div>
                <div><div className="text-neutral-500">Saved</div><div className="font-bold text-green-700">{result.ratio}%</div></div>
              </div>
              {result.stats && (result.stats.reencoded > 0 || result.stats.fonts_converted > 0 || result.stats.truetype_merged > 0) && (
                <p className="text-xs text-neutral-500">
                  {[result.stats.reencoded > 0 && `${result.stats.reencoded} image${result.stats.reencoded > 1 ? 's' : ''} recompressed`,
                    (result.stats.fonts_converted || 0) + (result.stats.truetype_merged || 0) > 0 && `${(result.stats.fonts_converted || 0) + (result.stats.truetype_merged || 0)} font${(result.stats.fonts_converted || 0) + (result.stats.truetype_merged || 0) > 1 ? 's' : ''} optimised`]
                    .filter(Boolean).join(' · ')}
                </p>
              )}
              <a href={result.url} download={result.name.replace(/\.pdf$/i, '-compressed.pdf')} className="inline-block bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Compress"
        description={`PDF Compress reduces the size of your PDF with three levels. It recompresses the images from their real size on the page (150 dpi for Recommended, 72 dpi for Extreme), converts Type 1 fonts to the compact CFF format with Adobe's own converter, merges duplicate font subsets and repacks the file's structure. Page text and vector drawings are never rewritten, so text stays exactly as sharp as the original. The Lossless level changes nothing you can see: in our tests every page rendered pixel-identical to the original. Files up to ${SERVER_MAX_LABEL} are processed on our server; larger files get a lighter, structure-only optimisation in your browser.`}
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Pick a level: Extreme (smallest), Recommended (balanced) or Lossless (identical look).",
          "Click 'Compress PDF' and wait for the upload and compression to finish.",
          "Check the before/after sizes, then click 'Download'."
        ]}
        faqs={[
          { q: "Is PDF Compress free to use?", a: "Yes, it's free with no signup required." },
          { q: "How much will my PDF shrink?", a: "It depends on what the file contains. In our tests on a 15-page research paper, Lossless saved 35%, Recommended 41% and Extreme 43%; on a PDF of six photos, Recommended saved 15% and Extreme 79%. If a level cannot make your file smaller, the page says so and gives you nothing to download rather than a file that isn't smaller." },
          { q: "Does it reduce quality?", a: "Lossless does not: nothing is re-encoded and pages look identical. Recommended and Extreme recompress images (not text): Recommended keeps images at 150 dpi, which looks sharp on screen and in normal printing; Extreme reduces them to 72 dpi for the smallest file, fine for reading on screen." },
          { q: "Is my PDF uploaded to a server?", a: `For files up to ${SERVER_MAX_LABEL}, yes: the tools that do real image and font compression don't run in a browser. Your file is sent over HTTPS, compressed, and deleted after you download the result (or automatically after a short time if you don't). Files over ${SERVER_MAX_LABEL} are optimised entirely in your browser and never leave your device.` },
          { q: "Is there a file-size limit?", a: `${SERVER_MAX_LABEL} for the full engine. Larger files, up to ${MAX_FILE_SIZE_LABEL} and ${MAX_PAGES.toLocaleString()} pages on a computer (${MOBILE_MAX_FILE_SIZE_LABEL} / ${MOBILE_MAX_PAGES.toLocaleString()} pages on phones and tablets), get the in-browser structure-only optimisation.` },
          { q: "Does it work on password-protected PDFs?", a: "No. Remove the password first with Unlock PDF, then compress the file." }
        ]}
        tips={[
          "Scanned documents and photo-heavy PDFs shrink the most with Recommended or Extreme.",
          "Text-only PDFs (reports, papers) often shrink a lot even with Lossless, thanks to font optimisation.",
          "Want a file under an email limit? Try Extreme first, then check the result before sending.",
          `For a PDF over ${SERVER_MAX_LABEL}, split it first with PDF Split, then compress each part with the full engine.`
        ]}
      />
    </div>
  );
}
