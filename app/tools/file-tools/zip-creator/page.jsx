'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { MAX_TOTAL_SIZE_BYTES, MAX_TOTAL_SIZE_LABEL, MOBILE_MAX_TOTAL_SIZE_BYTES, MOBILE_MAX_TOTAL_SIZE_LABEL } from './config';
import { isMobileDevice } from '../../../lib/isMobileDevice';

export default function ZipCreatorPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef();
  const workerRef = useRef(null);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const maxTotalBytes = isMobile ? MOBILE_MAX_TOTAL_SIZE_BYTES : MAX_TOTAL_SIZE_BYTES;
  const maxTotalLabel = isMobile ? MOBILE_MAX_TOTAL_SIZE_LABEL : MAX_TOTAL_SIZE_LABEL;
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const overSizeLimit = totalSize > maxTotalBytes;

  const addFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    e.target.value = '';
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
    setStatus('');
    setDownloadUrl(null);
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const cancel = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setLoading(false);
    setProgress(0);
    setStatus('Cancelled.');
  };

  const createZip = () => {
    if (files.length === 0) return;
    if (overSizeLimit) { setError(`These files add up to ${(totalSize / (1024 * 1024)).toFixed(0)} MB, over the ${maxTotalLabel} limit${isMobile ? ' on this device' : ''}. Remove a file or zip in smaller batches.`); return; }
    setLoading(true);
    setError('');
    setStatus('');
    setProgress(0);
    setDownloadUrl(null);

    const worker = new Worker(new URL('./zipCreator.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.pct);
      } else if (msg.type === 'done') {
        setProgress(100);
        setLoading(false);
        workerRef.current = null;
        setDownloadUrl(URL.createObjectURL(msg.blob));
        setStatus(`Zipped ${msg.fileCount} file${msg.fileCount > 1 ? 's' : ''}.`);
      } else if (msg.type === 'limit') {
        setLoading(false);
        workerRef.current = null;
        setError(msg.message + ' Remove a file or zip in smaller batches.');
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
    worker.postMessage({ files, maxTotalBytes });
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Creator</h1>
        <p className="text-neutral-500 text-center mb-2">Create ZIP archive files in your browser</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Supports up to {maxTotalLabel} total{isMobile ? ' on this device' : ''}. Zipping runs in the background — this tab stays responsive.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">Click to add files</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} disabled={loading} />
          </div>
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm truncate flex-1">{f.name}</span>
                  <button onClick={() => removeFile(i)} disabled={loading} className="text-red-400 hover:text-red-300 ml-2">Remove</button>
                </div>
              ))}
              <p className={`text-xs text-right ${overSizeLimit ? 'text-red-500' : 'text-neutral-400'}`}>{(totalSize / (1024 * 1024)).toFixed(1)} MB total</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}
          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Zipping…" />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={createZip} disabled={files.length === 0} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">Create ZIP</button>
          )}
          {status && !loading && <p className="text-center text-sm text-green-600">{status}</p>}
          {downloadUrl && !loading && <a href={downloadUrl} download="archive.zip" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download ZIP</a>}
        </div>
      </div>
      <SeoContent
        title="ZIP Creator"
        description="ZIP Creator is a free online tool that bundles multiple files into a single ZIP archive, entirely in your browser using JSZip — no upload, no software, and works with any file type. Zipping runs in a background Web Worker so the page stays responsive, with a live progress bar and a Cancel button."
        howTo={[
          "Click the upload area and select one or more files to add to your archive.",
          "Remove any files you don't want by clicking \"Remove\" next to them.",
          "Click \"Create ZIP\" to bundle everything into a single archive locally.",
          "Click \"Download ZIP\" to save the resulting archive.zip file."
        ]}
        faqs={[
          { q: "Is ZIP Creator free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What file types can I zip?", a: "Any file type — there are no format restrictions since files are added to the archive as-is." },
          { q: "Do you store my uploaded files?", a: "No. The ZIP is built entirely in your browser, in a background Web Worker — files are never uploaded to a server." },
          { q: "Can I rename the archive or set a compression level?", a: "Not currently — the tool creates a file named archive.zip using JSZip's default settings." },
          { q: "Is there a size limit?", a: `Yes: the files you add can add up to ${MAX_TOTAL_SIZE_LABEL} total on desktop (${MOBILE_MAX_TOTAL_SIZE_LABEL} on phones and tablets) -- a measured limit to keep zipping reliable in the browser tab rather than risking a crash on a very large combined archive.` }
        ]}
        tips={[
          "Add all the files you need before clicking \"Create ZIP\" — use the Remove button to fix any mistakes first.",
          "Large batches of files may take longer to process since compression runs in your browser — watch the progress bar.",
          "Rename the downloaded archive.zip file afterward if you need a more descriptive name.",
          "Great for bundling multiple documents or images into a single file before emailing or uploading elsewhere."
        ]}
      />
    </div>
  );
}
