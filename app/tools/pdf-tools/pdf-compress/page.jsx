'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { runStagedToolResult, mediaServiceConfigured, MediaJobError } from '../../../lib/mediaJob';
import { MAX_PDF_COMPRESS_STAGED_BYTES, OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

const MIB = 1024 * 1024;
const SERVER_MAX_LABEL = `${Math.round(MAX_PDF_COMPRESS_STAGED_BYTES / MIB)} MB`;

// Same three levels as the reference site (iLovePDF), calibrated against it on the same files
// (docs/audit/RAPPORT-ecarts-marche.md §3a).
const LEVELS = [
  { id: 'extreme', title: 'Extreme', note: 'Smallest file. Larger images reduced to 72 dpi and saved as JPEG.' },
  { id: 'recommended', title: 'Recommended', note: 'Larger images resampled to 150 dpi and saved as JPEG.' },
  { id: 'low', title: 'Lossless', note: 'Identical look, images untouched. Fonts and structure optimized.' },
];

export default function PdfCompressPage() {
  const [file, setFile] = useState(null);
  const [level, setLevel] = useState('recommended');
  const [status, setStatus] = useState('');
  const [error, setError] = useToolError('');
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
    setStatus('Canceled.');
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
      : `This PDF is already well optimized: the "${LEVELS.find((l) => l.id === level).title}" level could not make it smaller, so nothing was changed. Try a stronger level.`);
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
    setPhase('Optimizing in your browser…');
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

  const formatSize = formatBytes;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF Compression</h1>
        <p className="text-neutral-500 text-center mb-2">Reduce PDF file size at the level you choose</p>
        <p className="text-neutral-500 text-xs text-center mb-8 min-h-[3rem]">Files up to {SERVER_MAX_LABEL} are compressed with our full engine (images, fonts and structure).{isMobile ? ' Larger files cannot be compressed on this device.' : ` Larger files, up to ${browserMaxLabel}, get a lighter in-browser optimization (structure only).`}</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => !loading && inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            {file && <p className="text-xs text-neutral-500 mt-1">Original: {formatSize(file.size)}</p>}
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} disabled={loading} />
          </div>
          {inBrowser ? (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">This file is over {SERVER_MAX_LABEL}, so it will be optimized in your browser: structure only, images and fonts untouched, smaller savings. Split it with PDF Split to use the full engine on each part.</p>
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
                    (result.stats.fonts_converted || 0) + (result.stats.truetype_merged || 0) > 0 && `${(result.stats.fonts_converted || 0) + (result.stats.truetype_merged || 0)} font${(result.stats.fonts_converted || 0) + (result.stats.truetype_merged || 0) > 1 ? 's' : ''} optimized`]
                    .filter(Boolean).join(' · ')}
                </p>
              )}
              <FileDownload href={result.url} name={result.name.replace(/\.pdf$/i, '-compressed.pdf')} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Compress"
        description={`PDF Compress makes a PDF smaller on our pdf-tools server, at the level you choose. Recommended and Extreme re-encode the larger pictures as JPEG, resampled from the size they are displayed at on the page (150 dpi and 72 dpi); a picture that needs no resizing is replaced only when its JPEG is clearly smaller, and CMYK, indexed or masked pictures are left as they are. Lossless leaves every picture alone. At every level, Type 1 fonts are converted to the compact CFF format with Adobe's tx, duplicate TrueType subsets are merged and the file structure is repacked. Page text and vector drawings are never rewritten. Files up to ${SERVER_MAX_LABEL} get this full engine.`}
        howToTitle="How to compress a PDF"
        howTo={[
          `Choose your PDF; its original size appears under the name.`,
          `Pick "Extreme", "Recommended" or "Lossless".`,
          `Click "Compress PDF" and follow the upload and compression bar; "Cancel" stops it.`,
          `Compare the sizes before and after, then click "Download" to get the -compressed.pdf file.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Levels', value: `Extreme (pictures at 72 dpi), Recommended (150 dpi), Lossless (pictures untouched)` },
          { label: 'Full engine', value: `Files up to ${SERVER_MAX_LABEL}, on our pdf-tools server` },
          { label: 'Larger files', value: `Files over ${SERVER_MAX_LABEL}: refused on phones and tablets; on a computer, only a lighter structure-only optimization runs, in your browser, within the limit shown on the page` },
          { label: 'Usage limits', value: `Files over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / MIB)} MB are uploaded in chunks; each network may start a limited number of those uploads per hour and per day` },
          { label: 'No gain', value: `If no smaller file can be made, nothing is offered for download` },
        ]}
        privacy={`Files up to ${SERVER_MAX_LABEL} are compressed by our own pdf-tools service on Railway. Up to ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / MIB)} MB, the file passes through our site and the service's temporary folder is deleted when the request ends. A larger file is uploaded in chunks to our media service: the upload is deleted once the compressed file is ready, and that file after your first complete download or when the service's retention time ends. Files over ${SERVER_MAX_LABEL} are handled differently: on a computer, only a lighter optimization runs, in your browser.`}
        faqs={[
          { q: "How much smaller will my PDF get?", a: `0.1% to 78.8% smaller in our test of 23 September 2026, depending on the content and the level: a 15-page research paper lost 35.4% with Lossless, 40.6% with Recommended and 43.0% with Extreme; a PDF of six photos lost only 0.1% with Lossless, 15.2% with Recommended and 78.8% with Extreme. When a level cannot make the file smaller, you get a message and no file.` },
          { q: "Does Lossless change how my pages look?", a: `No. Lossless re-encodes no picture: it converts Type 1 fonts only after checking that every glyph is still there with the same outline bounds, merges duplicate font subsets and repacks the structure. In the same test, every page of the research paper rendered pixel-identical to the original in two independent renderers.` },
          { q: "Can I compress a password-protected PDF?", a: `Yes, if it opens without a password. A PDF that asks for a password to open is refused with a message pointing to Unlock PDF; a PDF that opens freely but restricts printing or copying is compressed like any other file.` },
          { q: "Is there a limit on how often I can compress?", a: `Yes, for large files only. A file over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / MIB)} MB is uploaded through our media service, and each network may start a limited number of those uploads per hour and per day. Smaller files go straight to the compression service without that limit.` },
        ]}
        tips={[
          `For a PDF made of photos, try Extreme: in our test it saved far more on pictures than Recommended.`,
          `Over ${SERVER_MAX_LABEL}, split the file with PDF Split and compress each part with the full engine.`,
        ]}
      />
    </div>
  );
}
