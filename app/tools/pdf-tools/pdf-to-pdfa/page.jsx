'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { runStagedToolResult } from '../../../lib/mediaJob';
import { checkPdfToolsSize, pdfToolsMaxLabel, shouldStage } from '../../../lib/officeUpload';
import ProgressBar from '../../../components/ProgressBar';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import { OFFICE_STAGED_THRESHOLD_BYTES } from '@/lib/quota/limits';
import UploadPrompt from '@/app/components/UploadPrompt';

// Real ceiling (hosting-platform payload gate), not the 50 MB the route itself would
// accept -- see lib/quota/limits.js.
// P26 (E2), as iLovePDF offers them: "u" (all text mapped to Unicode) and "a" (accessible: the document's structure
// tags kept). An "a" level needs a TAGGED source -- no open-source tool tags a PDF reliably -- so it is offered only
// once the chosen file is known to be tagged. 1a is not offered: no open-source tool reaches it (measured, P25).
const CONFORMANCE_LEVELS = [
  { value: '1b', label: 'PDF/A-1b (basic, oldest)' },
  { value: '2b', label: 'PDF/A-2b (basic)' },
  { value: '3b', label: 'PDF/A-3b (basic, attachments allowed)' },
  { value: '2u', label: 'PDF/A-2u (basic + all text in Unicode)' },
  { value: '3u', label: 'PDF/A-3u (basic + all text in Unicode)' },
  { value: '2a', label: 'PDF/A-2a (accessible: needs a tagged PDF)', tagged: true },
  { value: '3a', label: 'PDF/A-3a (accessible: needs a tagged PDF)', tagged: true },
];

// Is this PDF tagged (it has a structure tree -- the service's own rule, py/pdfa_fix.py)? null when it can't be read
// here (encrypted, damaged, or above 20 MB, kept off the main thread's budget on phones): the service then checks it
// and refuses or lowers the level, saying so.
const TAG_CHECK_MAX_BYTES = 20 * 1024 * 1024;
async function readTagged(file) {
  if (file.size > TAG_CHECK_MAX_BYTES) return null;
  try {
    const { PDFDocument, PDFName, PDFDict } = await import('pdf-lib');
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false, throwOnInvalidObject: false });
    if (doc.isEncrypted) return null;
    const root = doc.catalog;
    return root.lookup(PDFName.of('StructTreeRoot')) instanceof PDFDict;
  } catch {
    return null;
  }
}

export default function PdfToPdfaPage() {
  const [file, setFile] = useState(null);
  const [conformance, setConformance] = useState('2b');
  const [tagged, setTagged] = useState(null); // true / false / null (unknown or not checked yet)
  const [allowDowngrade, setAllowDowngrade] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useToolError('');
  const [result, setResult] = useState(null); // { compliant, conformance, verapdf }
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const pickedRef = useRef(null);
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
    setTagged(null);
    pickedRef.current = f;
    readTagged(f).then((t) => {
      if (pickedRef.current !== f) return; // another file was picked meanwhile
      setTagged(t);
      // a known-untagged file cannot get an "a" level: move to the matching "u" level, said below the menu
      if (t === false) setConformance((c) => (c.endsWith('a') ? `${c[0]}u` : c));
    });
  };

  const cancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
    if (abortRef.current) abortRef.current.abort();
    setLoading(false); setProgress(0);
  };

  const convert = () => {
    if (!file) return;
    setLoading(true); setError(''); setResult(null); setDownloadUrl(null); setProgress(0);


    if (shouldStage(file)) {
      // Large-file path: chunked upload straight to the media service, the route reads it server-to-server
      // and the result is downloaded from the service (see app/lib/mediaJob.js).
      const ac = new AbortController();
      abortRef.current = ac;
      runStagedToolResult({ file, endpoint: '/api/pdf-to-pdfa', fields: { conformance, allowDowngrade: canDowngrade && allowDowngrade }, signal: ac.signal, onStage: (s) => { if (s.stage === 'upload') setProgress(Math.round(s.pct || 0)); } })
        .then(({ json: data, blob }) => {
          if (!data.ok) { setError(data.error || 'This file could not be processed.'); setResult(data.verapdf ? data : null); return; }
          setResult(data);
          if (blob) setDownloadUrl(URL.createObjectURL(blob));
        })
        .catch((e) => { if (e.code !== 'cancelled') setError(e.message || 'Something went wrong. Please try again.'); })
        .finally(() => { abortRef.current = null; setLoading(false); });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conformance', conformance);
    if (canDowngrade && allowDowngrade) formData.append('allowDowngrade', 'true');

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

  const canDowngrade = conformance[1] !== 'b';
  const level = CONFORMANCE_LEVELS.find((l) => l.value === conformance);
  // named after the level actually delivered (it can be lower than the one asked for, when allowed)
  const outName = file ? file.name.replace(/\.pdf$/i, `-pdfa-${result?.compliant ? result.conformance : conformance}.pdf`) : 'archive.pdf';
  const failedRules = result?.verapdf?.failedRules || [];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">PDF to PDF/A</h1>
        <p className="text-neutral-500 text-center mb-2">Convert to PDF/A for long-term archiving, verified compliant by veraPDF</p>
        <p className="text-neutral-500 dark:text-neutral-500 text-xs text-center mb-8">
          Files up to {pdfToolsMaxLabel()}. Your file is uploaded to our conversion service for processing — see below for what that means.
        </p>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          </div>

          <div className="flex items-center justify-center gap-2">
            <label className="text-sm text-neutral-500">PDF/A conformance:</label>
            <select aria-label="PDF/A conformance" value={conformance} onChange={(e) => setConformance(e.target.value)} className="text-sm border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg px-2 py-1">
              {CONFORMANCE_LEVELS.map((lvl) => <option key={lvl.value} value={lvl.value} disabled={lvl.tagged && tagged === false}>{lvl.label}{lvl.tagged && tagged === false ? ' — this PDF is not tagged' : ''}</option>)}
            </select>
          </div>

          {file && tagged === false && (
            <p className="text-xs text-center text-neutral-600 dark:text-neutral-400" data-testid="pdfa-tag-note">This PDF is not tagged (it has no structure tags), so PDF/A-2a and 3a can't be made from it. To get them, export it again with tags — Word: Save as PDF › Options › “Document structure tags for accessibility”; LibreOffice: Export as PDF › “Universal accessibility (PDF/UA)”.</p>
          )}
          {file && tagged === true && level?.tagged && (
            <p className="text-xs text-center text-neutral-600 dark:text-neutral-400" data-testid="pdfa-tag-note">This PDF is tagged: its structure tags are kept as they are and checked by veraPDF.</p>
          )}
          {file && tagged === null && level?.tagged && (
            <p className="text-xs text-center text-neutral-600 dark:text-neutral-400" data-testid="pdfa-tag-note">This file couldn't be checked for tags in your browser; our service checks it. An untagged PDF can't be PDF/A-{conformance}.</p>
          )}
          {canDowngrade && (
            <label className="flex items-center justify-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <input type="checkbox" checked={allowDowngrade} onChange={(e) => setAllowDowngrade(e.target.checked)} />
              If PDF/A-{conformance} can't be reached, give me the closest lower level ({conformance[1] === 'a' ? `${conformance[0]}u, then ${conformance[0]}b` : `${conformance[0]}b`}) — you'll be told which
            </label>
          )}

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
              {result.compliant && result.downgraded && (
                <p className="text-sm text-amber-700 dark:text-amber-300" data-testid="pdfa-downgraded">
                  You asked for PDF/A-{result.requested}; it couldn't be reached ({(result.attempts || []).map((a) => `${a.conformance}: ${a.why}`).join('; ')}), so this file is PDF/A-{result.conformance}.
                </p>
              )}
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
              <FileDownload href={downloadUrl} name={outName} />
            </div>
          )}
        </div>
      </div>

      <SeoContent
        title="PDF to PDF/A"
        description={`PDF to PDF/A makes an archival copy of a PDF at the level you choose: 1b, 2b or 3b, the Unicode levels 2u and 3u, or the accessible levels 2a and 3a for PDFs that already carry structure tags. Our pdf-tools service converts the file with Ghostscript, or only adds what is missing when it already meets the level. veraPDF then validates the result, and its text is compared with your PDF's text by two readers. You get a file only when both checks pass. PDF/A-1a is not offered.`}
        howToTitle="How to convert PDF to PDF/A"
        howTo={[
          `Click or drop the PDF to archive, up to ${pdfToolsMaxLabel()}.`,
          `Choose a level in "PDF/A conformance"; the accessible levels are switched off when your PDF has no tags.`,
          `Keep the box for the closest lower level ticked if you accept one, then click the "Convert to PDF/A-…" button.`,
          `Read the veraPDF verdict; "Download" then keeps the validated PDF/A copy.`,
        ]}
        specs={[
          { label: 'Input format', value: `PDF` },
          { label: 'Output levels', value: `PDF/A-1b, 2b, 3b, 2u, 3u, 2a, 3a` },
          { label: 'Maximum file size', value: `${pdfToolsMaxLabel()} per file` },
          { label: 'Tag check', value: `By your browser for files up to ${TAG_CHECK_MAX_BYTES / 1048576} MB, otherwise by our service` },
          { label: 'Usage limits', value: `Files over ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB: a limit per network per hour and per day` },
        ]}
        privacy={`Your PDF is sent over HTTPS to our server and on to our pdf-tools service on Railway, where Ghostscript, veraPDF and two text readers work in a temporary folder that is removed afterwards. A file larger than ${Math.round(OFFICE_STAGED_THRESHOLD_BYTES / 1048576)} MB goes in parts through our media service first, which deletes the PDF/A as soon as this page has received it, or after a time limit.`}
        faqs={[
          { q: `Is the file checked against the PDF/A standard?`, a: `Yes. veraPDF, an open-source PDF/A validator, checks the converted file at the level you chose. If it fails, you get no file, only the list of failed rules with the number of times each occurred.` },
          { q: `Will the text of my PDF stay exactly the same?`, a: `Yes, or you get no file. The text of the result is compared with your PDF's text, character by character, by Ghostscript and Poppler. Ghostscript can alter ligatures such as fi, accents or Greek letters while the page still looks right; in that case you get an explanation instead of a file. Exporting PDF/A from the original document is then the reliable route.` },
          { q: `Can I make PDF/A-2a from any PDF?`, a: `No. The a levels need a tagged PDF, and the page checks your file for tags before sending it. Export the document again with tags: in Word, "Document structure tags for accessibility"; in LibreOffice, "Universal accessibility (PDF/UA)". Otherwise choose 2u or 3u.` },
          { q: `Can I get a lower level when mine is not reached?`, a: `Yes, for the u and a levels, while the box under the menu stays ticked, as it is by default. A 2a request then tries 2u, then 2b, and the result names the level you got and why the higher one failed. Untick it to receive only the level you asked for.` },
          { q: `Is PDF/A-1a available?`, a: `No. In our tests no open-source tool produced a valid PDF/A-1a, so the level is not offered; PDF/A-2a covers the same accessibility needs on a newer base.` },
        ]}
        tips={[
          `PDF/A-1b does not allow transparency, so choose 2b or a later level for a PDF with transparent images.`,
        ]}
      />
    </div>
  );
}
