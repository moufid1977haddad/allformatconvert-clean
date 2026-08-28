'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = '50 MB';
const CONFORMANCE_LEVELS = ['1b', '2b', '3b'];

export default function PdfToPdfaPage() {
  const [file, setFile] = useState(null);
  const [conformance, setConformance] = useState('2b');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { compliant, conformance, verapdf }
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

  const convert = () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null); setDownloadUrl(null); setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conformance', conformance);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open('POST', '/api/pdf-to-pdfa');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      xhrRef.current = null;
      setLoading(false);
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { data = null; }
      if (!data) {
        setError('The PDF/A service returned an unexpected response.');
        return;
      }
      if (!data.ok) {
        setError(data.error || 'This file could not be converted.');
        setResult(data.verapdf ? data : null);
        return;
      }
      setResult(data);
      if (data.file) {
        const bytes = Uint8Array.from(atob(data.file), (c) => c.charCodeAt(0));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        setDownloadUrl(URL.createObjectURL(blob));
      }
    };
    xhr.onerror = () => { xhrRef.current = null; setLoading(false); setError('Network error. Please try again.'); };
    xhr.onabort = () => { xhrRef.current = null; setLoading(false); setProgress(0); };
    xhr.send(formData);
  };

  const outName = file ? file.name.replace(/\.pdf$/i, `-pdfa-${conformance}.pdf`) : 'archive.pdf';
  const failedRules = result?.verapdf?.failedRules || [];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">PDF to PDF/A</h1>
        <p className="text-neutral-500 text-center mb-2">Convert to PDF/A for long-term archiving, verified compliant by veraPDF</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">
          Files up to {MAX_FILE_SIZE_LABEL}. Your file is uploaded to our conversion service for processing — see below for what that means.
        </p>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <label className="text-sm text-neutral-500">PDF/A conformance:</label>
            <select value={conformance} onChange={(e) => setConformance(e.target.value)} className="text-sm border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg px-2 py-1">
              {CONFORMANCE_LEVELS.map((lvl) => <option key={lvl} value={lvl}>PDF/A-{lvl}</option>)}
            </select>
          </div>

          {error && <p className="text-center text-red-500 text-sm" role="alert">{error}</p>}

          {loading ? (
            <div className="space-y-3">
              <ProgressBar pct={progress} label="Uploading…" />
              <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          ) : (
            <button onClick={convert} disabled={!file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-500 text-white rounded-xl py-3 font-semibold transition">
              Convert to PDF/A-{conformance}
            </button>
          )}

          {result && (
            <div className={`rounded-xl border p-5 space-y-2 ${result.compliant ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
              <p className={`text-sm font-semibold ${result.compliant ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                {result.compliant
                  ? `Verified compliant with PDF/A-${result.conformance} by veraPDF.`
                  : `Not compliant with PDF/A-${result.conformance} — no file was returned.`}
              </p>
              {failedRules.length > 0 && (
                <details className="text-xs text-neutral-600 dark:text-neutral-400" open={!result.compliant}>
                  <summary className="cursor-pointer">veraPDF validation detail ({failedRules.length} failed rule{failedRules.length === 1 ? '' : 's'})</summary>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    {failedRules.map((r, i) => (
                      <li key={i}>{r.clause ? `Clause ${r.clause}${r.testNumber ? `, test ${r.testNumber}` : ''}: ` : ''}{r.description} ({r.count} occurrence{r.count === 1 ? '' : 's'})</li>
                    ))}
                  </ul>
                </details>
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
        title="PDF to PDF/A"
        description="PDF to PDF/A converts your document into the ISO-standardized PDF/A archival format using Ghostscript, then validates the result with veraPDF — the industry-reference validator built for the PDF Association's own conformance testing. This is the core guarantee: you only get a file back if it's verified compliant. If Ghostscript's conversion doesn't pass validation, you get an explicit error naming which PDF/A rule failed and how many times, not a file that merely claims to be PDF/A. Unlike almost every other tool on this site, this one really does send your file to a server: it's uploaded securely over HTTPS to our conversion service, and deleted immediately after processing — never stored, logged, or kept around."
        howTo={[
          "Click the upload area and select a PDF file, up to 50 MB.",
          "Choose a PDF/A conformance level (1b, 2b, or 3b — 2b is the most commonly required for archiving).",
          "Click 'Convert'. Your file uploads with a real progress bar; a working Cancel button is available the whole time.",
          "If the result passes veraPDF validation, download it. If not, you'll see exactly which rule failed instead of a silently non-compliant file."
        ]}
        faqs={[
          { q: "Is PDF to PDF/A free to use?", a: "Yes, completely free with no signup required." },
          { q: "What does 'verified compliant' actually mean here?", a: "After Ghostscript converts your file, veraPDF — the reference validator used for official PDF/A conformance testing — checks the result against the full PDF/A specification. Only a file that passes is returned to you." },
          { q: "What happens if my file doesn't pass?", a: "You get an explicit error listing which PDF/A rule(s) failed and how many times, with no file delivered. This is deliberate: a PDF/A file that only partially complies isn't safe for archiving, so we don't hand one over labeled as compliant." },
          { q: "Is my file uploaded to a server?", a: "Yes. This is one of the few tools on this site that actually sends your file to a server, because PDF/A conversion and validation genuinely need Ghostscript and veraPDF, which don't run in a browser. Your file is uploaded securely over HTTPS, processed, and deleted immediately afterward — it is never stored, logged, or kept." },
          { q: "Which conformance level should I pick?", a: "PDF/A-2b is the most widely accepted for general archiving. PDF/A-1b is the oldest and most restrictive (no transparency). PDF/A-3b adds support for embedding non-PDF/A source files inside the archive." },
        ]}
        tips={[
          "PDF/A intentionally disallows some ordinary PDF features (transparency in 1b, JavaScript, external references, unembedded fonts) — a real conversion failure is often the source PDF using one of these.",
          "This is a one-way, lossy-safe conversion for archiving, not a general-purpose PDF editor — use PDF Editor first for organizing pages or adding content, then convert the result here.",
        ]}
      />
    </div>
  );
}
