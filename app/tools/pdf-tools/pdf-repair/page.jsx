'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '50 MB';

export default function PdfRepairPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { method, warnings, pageCount }
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const xhrRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError(''); setResult(null); setDownloadUrl(null);
    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, over the ${MAX_FILE_SIZE_LABEL} limit.`);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const cancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
    setLoading(false); setProgress(0);
  };

  const repair = () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null); setDownloadUrl(null); setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/api/pdf-repair');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      xhrRef.current = null;
      setLoading(false);
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { data = null; }
      if (!data) {
        setError('The repair service returned an unexpected response.');
        return;
      }
      if (!data.ok) {
        setError(data.error || 'This file could not be repaired.');
        setResult(data.qpdfExitCode !== undefined ? data : null);
        return;
      }
      setResult(data);
      const bytes = Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
    };
    xhr.onerror = () => { xhrRef.current = null; setLoading(false); setError('Network error. Please try again.'); };
    xhr.onabort = () => { xhrRef.current = null; setLoading(false); setProgress(0); };
    xhr.send(formData);
  };

  const outName = file ? file.name.replace(/\.pdf$/i, '-repaired.pdf') : 'repaired.pdf';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">PDF Repair</h1>
        <p className="text-neutral-500 text-center mb-2">Recover PDFs with damaged structure — broken cross-reference tables and similar corruption</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">
          Files up to {MAX_FILE_SIZE_LABEL}. Your file is uploaded to our repair service for processing — see below for what that means.
        </p>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a damaged PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>

          {error && <p className="text-center text-red-500 text-sm" role="alert">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Uploading…" />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={repair} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-500 text-white rounded-xl py-3 font-semibold transition">
              Repair PDF
            </button>
          )}

          {result && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 space-y-2">
              {downloadUrl ? (
                <>
                  <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                    Repaired using {result.method === 'qpdf' ? 'structural repair (qpdf)' : 'content-stream rewrite (Ghostscript)'} — {result.pageCount ?? '?'} page{result.pageCount === 1 ? '' : 's'} recovered.
                  </p>
                  {result.warnings?.length > 0 && (
                    <details className="text-xs text-neutral-500 dark:text-neutral-400">
                      <summary className="cursor-pointer">What was found and fixed ({result.warnings.length})</summary>
                      <ul className="mt-2 space-y-1 list-disc list-inside">
                        {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </details>
                  )}
                </>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  qpdf exit code: {result.qpdfExitCode ?? 'n/a'}, Ghostscript exit code: {result.ghostscriptExitCode ?? 'n/a'}.
                </p>
              )}
            </div>
          )}

          {downloadUrl && !loading && (
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
              <div className="text-green-500 text-xl font-bold mb-3">Done!</div>
              <a href={downloadUrl} download={outName} className="inline-block bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-2 font-semibold transition">Download</a>
            </div>
          )}
        </div>
      </div>

      <SeoContent
        title="PDF Repair"
        description="PDF Repair fixes PDFs with damaged internal structure — most commonly a broken or missing cross-reference table, the index PDF readers use to jump to each page and object. It repairs one class of damage, not every possible way a PDF file can be broken: files with genuinely destroyed content (truncated mid-page, overwritten with garbage, or missing entire objects) may not be recoverable, and the tool says so honestly rather than returning a corrupted result. Unlike almost every other tool on this site, this one really does send your file to a server: it's uploaded securely over HTTPS to our repair service (which runs qpdf and Ghostscript), and deleted immediately after processing — never stored, logged, or kept around."
        howTo={[
          "Click the upload area and select a damaged PDF file, up to 50 MB.",
          "Click 'Repair PDF'. Your file uploads with a real progress bar; a working Cancel button is available the whole time.",
          "If the repair succeeds, review what was found and fixed, then download the repaired file. If the file is too damaged, you'll get a clear explanation instead of a broken result."
        ]}
        faqs={[
          { q: "Is PDF Repair free to use?", a: "Yes, completely free with no signup required." },
          { q: "Can this fix any damaged PDF?", a: "No. It repairs structural damage — broken cross-reference tables and similar corruption — using qpdf first, then Ghostscript as a fallback. Files with destroyed content (truncated, overwritten, or missing objects) may not be recoverable, and you'll be told clearly rather than getting a silently broken file back." },
          { q: "Is my file uploaded to a server?", a: "Yes. This is one of the few tools on this site that actually sends your file to a server for processing, because PDF repair genuinely needs Ghostscript and qpdf, which don't run in a browser. Your file is uploaded securely over HTTPS, processed, and deleted immediately afterward — it is never stored, logged, or kept." },
          { q: "How large a PDF can I repair?", a: "Up to 50 MB per file." },
          { q: "What's the difference between the two repair methods?", a: "qpdf tries first: it precisely reconstructs a damaged cross-reference table without touching your actual content. If that's not enough, Ghostscript rewrites the file from its content streams instead — this can recover more, but re-embeds fonts and images rather than copying them exactly." },
        ]}
        tips={[
          "If qpdf alone was enough to repair your file, the result is byte-for-byte closer to your original than a Ghostscript rewrite would be — the report tells you which method was used.",
          "A PDF that only opens with warnings in some readers, but not others, is often a broken cross-reference table — exactly what this tool targets.",
          "For a PDF that's merely too large or slow, not damaged, use PDF Compress instead — Repair won't help with that.",
        ]}
      />
    </div>
  );
}
