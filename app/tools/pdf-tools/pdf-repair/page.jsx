'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { runStagedToolResult } from '../../../lib/mediaJob';
import { checkPdfToolsSize, pdfToolsMaxLabel, shouldStage } from '../../../lib/officeUpload';
import ProgressBar from '../../../components/ProgressBar';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';

// Real ceiling (hosting-platform payload gate), not the 50 MB the route itself would
// accept -- see lib/quota/limits.js.

const METHOD_LABELS = {
  qpdf: 'structural repair (qpdf)',
  poppler: 'structural repair (Poppler)',
  rebuilt: 'a rebuilt page list',
  ghostscript: 'content-stream rewrite (Ghostscript)',
};

export default function PdfRepairPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useToolError('');
  const [result, setResult] = useState(null); // { method, warnings, pageCount }
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const xhrRef = useRef(null);
  const abortRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError(''); setResult(null); setDownloadUrl(null);
    const sizeCheck = checkPdfToolsSize(f);
    if (!sizeCheck.ok) {
      setError(sizeCheck.message);
      setFile(null);
      return;
    }
    setFile(f);
  };

  const cancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
    if (abortRef.current) abortRef.current.abort();
    setLoading(false); setProgress(0);
  };

  const repair = () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null); setDownloadUrl(null); setProgress(0);


    if (shouldStage(file)) {
      // Large-file path: chunked upload straight to the media service, the route reads it server-to-server
      // and the result is downloaded from the service (see app/lib/mediaJob.js).
      const ac = new AbortController();
      abortRef.current = ac;
      runStagedToolResult({ file, endpoint: '/api/pdf-repair', fields: {}, signal: ac.signal, onStage: (s) => { if (s.stage === 'upload') setProgress(Math.round(s.pct || 0)); } })
        .then(({ json: data, blob }) => {
          if (!data.ok) { setError(data.error || 'This file could not be processed.'); setResult(data.qpdfExitCode !== undefined ? data : null); return; }
          setResult(data);
          if (blob) setDownloadUrl(URL.createObjectURL(blob));
        })
        .catch((e) => { if (e.code !== 'cancelled') setError(e.message || 'Something went wrong. Please try again.'); })
        .finally(() => { abortRef.current = null; setLoading(false); });
      return;
    }

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
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8">
          Files up to {pdfToolsMaxLabel()}. Your file is uploaded to our repair service for processing — see below for what that means.
        </p>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a damaged PDF" />}</p>
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
                    Repaired using {METHOD_LABELS[result.method] || result.method} — {result.pageCount ?? '?'} page{result.pageCount === 1 ? '' : 's'} recovered.
                  </p>
                  {result.textCheck === 'same' && (
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">Text checked: the repaired file reads exactly like what {result.checkedWith?.length ? result.checkedWith.join(' and ') : 'PDF readers'} still find{result.checkedWith?.length === 1 ? 's' : ''} in your damaged file.</p>
                  )}
                  {result.textCheck === 'unverifiable' && (
                    <p className="text-xs text-amber-700 dark:text-amber-300" role="status">No PDF reader could open the damaged file, so its text could not be compared with the repaired one: check the pages before relying on it.</p>
                  )}
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
              <FileDownload href={downloadUrl} name={outName} />
            </div>
          )}
        </div>
      </div>

      <SeoContent
        title="PDF Repair"
        description="PDF Repair fixes PDFs with damaged internal structure — most commonly a broken or missing cross-reference table, the index PDF readers use to jump to each page and object. It also rebuilds a file whose end was cut off (an interrupted download, a truncated copy) from the pages still inside it. Every repaired file is checked before you get it: its text must read exactly like what PDF readers still find in your damaged file, otherwise it is not delivered. Content that is genuinely destroyed (overwritten with garbage, or pages cut off) cannot be brought back, and the tool says so honestly rather than returning a corrupted result. Like the other server tools named in our privacy policy (most tools on this site run in your browser), this one sends your file to a server: it's uploaded securely over HTTPS to our repair service (which runs qpdf, Poppler and Ghostscript), and deleted immediately after processing — never stored, logged, or kept around."
        howTo={[
          `Click the upload area and select a damaged PDF file, up to ${pdfToolsMaxLabel()}.`,
          "Click 'Repair PDF'. Your file uploads with a real progress bar; a working Cancel button is available the whole time.",
          "If the repair succeeds, review what was found and fixed, then download the repaired file. If the file is too damaged, you'll get a clear explanation instead of a broken result."
        ]}
        faqs={[
          { q: "Is PDF Repair free to use?", a: "Yes, completely free with no signup required." },
          { q: "Can this fix any damaged PDF?", a: "No. It repairs structural damage — broken cross-reference tables, a missing end of file and similar corruption — using qpdf first, then Poppler, then a rebuilt page list, and Ghostscript last. Content that is truly destroyed (overwritten, or pages cut off) cannot be recovered, and you'll be told clearly rather than getting a silently broken file back." },
          { q: "Can the repair change my text?", a: "Not without you knowing. Before a repaired file is offered, its text is read by two independent PDF readers (Ghostscript and Poppler) and compared with what they still read in your damaged file; a result that reads differently is never delivered. In our tests on 248 deliberately damaged PDFs (Greek, Arabic, Chinese, accents, ligatures), no file was delivered with changed text. If no reader can open your damaged file at all, the comparison is impossible: the tool then only uses a structural repair, which keeps the pages' own content as it is in the file, and tells you to check the pages." },
          { q: "Is my file uploaded to a server?", a: "Yes. This is one of the few tools on this site that actually sends your file to a server for processing, because PDF repair genuinely needs Ghostscript and qpdf, which don't run in a browser. Your file is uploaded securely over HTTPS, processed, and deleted immediately afterward — it is never stored, logged, or kept." },
          { q: "How large a PDF can I repair?", a: `Up to ${pdfToolsMaxLabel()} per file — larger files are refused before repair starts.` },
          { q: "What's the difference between the repair methods?", a: "qpdf tries first: it precisely reconstructs a damaged cross-reference table without touching your actual content. If its result loses text, Poppler rebuilds the file by copying every page it can still read (bookmarks and document properties are not carried over). If the end of the file is missing, a new page list is built from the pages still inside it. Ghostscript, last, rewrites the file from its content streams — this can recover more, but re-embeds fonts and images rather than copying them exactly." },
        ]}
        tips={[
          "If qpdf alone was enough to repair your file, the result is the closest to your original — the report tells you which method was used, and whether the text was checked.",
          "A PDF that only opens with warnings in some readers, but not others, is often a broken cross-reference table — exactly what this tool targets.",
          "For a PDF that's merely too large or slow, not damaged, use PDF Compress instead — Repair won't help with that.",
        ]}
      />
    </div>
  );
}
