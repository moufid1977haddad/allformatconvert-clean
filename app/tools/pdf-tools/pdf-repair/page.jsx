'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { runStagedToolResult } from '../../../lib/mediaJob';
import { checkPdfToolsSize, pdfToolsMaxLabel, shouldStage } from '../../../lib/officeUpload';
import { OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
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
        description={`PDF Repair rebuilds PDFs whose internal structure is damaged: a broken or missing cross-reference table, a file cut off by an interrupted download, and similar corruption. Our pdf-tools service tries qpdf first, then Poppler, then a page list rebuilt from the pages still inside the file, and Ghostscript last. Before a result is offered, its text is read by Ghostscript and Poppler and compared with what they still read in the damaged file; a result that reads differently is not delivered. Content that is truly destroyed cannot be brought back, and the page says so. It does not shrink files: use PDF Compress for that.`}
        howToTitle="How to repair a damaged PDF"
        howTo={[
          `Choose the damaged PDF; a file over the size limit is refused before anything is sent.`,
          `Click "Repair PDF"; the bar shows the upload, and "Cancel" stops it.`,
          `Read which method worked, how many pages were recovered and whether the text was checked, then click "Download" to save the -repaired.pdf file.`,
        ]}
        specs={[
          { label: 'Input', value: `PDF` },
          { label: 'Maximum size', value: `${pdfToolsMaxLabel()} per file` },
          { label: 'Methods', value: `qpdf, Poppler, rebuilt page list, Ghostscript, in that order` },
          { label: 'Text check', value: `Ghostscript and Poppler readings of the result must match the damaged file's; if neither can open the damaged file, the page warns that the text was not checked` },
          { label: 'Usage limits', value: `Files over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB go through our media service, limited per network per hour and per day` },
        ]}
        privacy={`Repair needs qpdf, Poppler and Ghostscript, so your PDF is sent over HTTPS to our own pdf-tools service on Railway, not to a third party. Up to ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB, the PDF travels through our site and the repair folder is removed as soon as the answer is sent. Above that, the PDF is sent in pieces to our media service; that copy is erased once the repair ends, and the repaired file after your first complete download or when the service's retention time runs out.`}
        faqs={[
          { q: "Can it fix any damaged PDF?", a: `No. It repairs structure, such as cross-reference tables and a missing end of file. Pages that were overwritten or cut off are lost: you get the pages that remain, with a note, or, when nothing usable can be rebuilt, an explanation with the exit codes of qpdf and Ghostscript instead of a broken file.` },
          { q: "Can the repair change my text?", a: `No, not without telling you. A repaired file is delivered only when its text matches what Ghostscript and Poppler still read in the damaged one; on our 248 damaged test files (4 October 2026), none was delivered with changed text. If no reader can open the original, the page asks you to check the pages.` },
          { q: "Does qpdf keep my file closest to the original?", a: `Yes. qpdf, the first method tried, rebuilds the cross-reference table without touching page content. Poppler copies the readable pages but drops bookmarks and document properties, and Ghostscript rewrites the content, re-embedding fonts and images. The report under the result names the method used.` },
          { q: "How large can the PDF be?", a: `${pdfToolsMaxLabel()} per file. Up to ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB the file goes straight through our site; above that it is sent in pieces through our media service, which accepts only a limited number of such transfers per network each hour and each day.` },
        ]}
        tips={[
          `When a PDF opens in one reader but not in another, repair it before merging or converting it with other tools.`,
        ]}
      />
    </div>
  );
}
