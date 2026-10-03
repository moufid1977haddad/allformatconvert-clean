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
          Files up to {pdfToolsMaxLabel()} Your file is uploaded to our conversion service for processing — see below for what that means.
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
        description="PDF to PDF/A converts your document into the ISO-standardized PDF/A archival format — levels 1b, 2b, 3b, 2u, 3u, and for tagged PDFs 2a and 3a — then validates the result with veraPDF — the industry-reference validator built for the PDF Association's own conformance testing. This is the core guarantee: you only get a file back if it's verified compliant. If the conversion doesn't pass validation, you get an explicit error naming which PDF/A rule failed and how many times, not a file that merely claims to be PDF/A — unless you allowed the closest lower level, in which case the page says plainly which level you got and why. For the b and u levels, a PDF that already meets the level keeps its pages as they are (only what PDF/A requires is added: archive metadata, a colour profile, annotation and font details); otherwise Ghostscript rewrites it. Either way the result is delivered only if its text is exactly your PDF's text, checked character by character with two independent text readers — when Ghostscript would alter letters (ligatures such as “fi”, accents, Greek or other scripts), you get an explanation instead of a file whose search and copy-paste would be wrong (u adds the check that every character maps to Unicode text); the a levels keep your PDF's own structure tags, which Ghostscript would drop, so they need a PDF that is already tagged (exported from Word, LibreOffice or Google Docs with accessibility tags). Like the other server tools named in our privacy policy (most tools on this site run in your browser), this one sends your file to a server: it's uploaded securely over HTTPS to our conversion service, and deleted immediately after processing — never stored, logged, or kept around."
        howTo={[
          `Click the upload area and select a PDF file, up to ${pdfToolsMaxLabel()}.`,
          "Choose a PDF/A conformance level: 1b, 2b, 3b, 2u, 3u, or 2a / 3a when your PDF is tagged (the page checks your file before sending it). 2b is the most commonly required for archiving.",
          "Click 'Convert'. Your file uploads with a real progress bar; a working Cancel button is available the whole time.",
          "If the result passes veraPDF validation, download it. If not, you'll see exactly which rule failed instead of a silently non-compliant file."
        ]}
        faqs={[
          { q: "Is PDF to PDF/A free to use?", a: "Yes, completely free with no signup required." },
          { q: "What does 'verified compliant' actually mean here?", a: "After your file is converted, veraPDF — the reference validator used for official PDF/A conformance testing — checks the result against the full PDF/A specification. Only a file that passes is returned to you." },
          { q: "What happens if my file doesn't pass?", a: "You get an explicit error listing which PDF/A rule(s) failed and how many times, with no file delivered. This is deliberate: a PDF/A file that only partially complies isn't safe for archiving, so we don't hand one over labeled as compliant." },
          { q: "Will the text of my PDF stay exactly the same?", a: "Yes, or you get no file. A PDF that already meets the level keeps its pages as they are; when it has to be rewritten by Ghostscript, it doesn't. Either way we compare the text of the result with the text of your PDF, character by character, with two independent text readers, and only deliver it if they are identical: Ghostscript can alter some letters (ligatures such as “fi” or “ti”, accents, Greek or other scripts) while the pages still look right, which would make search and copy-paste give wrong text. In that case the page tells you so, and the reliable way to archive the document is to export it as PDF/A from its original (Word: Save As › PDF › Options › “PDF/A compliant”; LibreOffice: Export as PDF › “Archive (PDF/A, ISO 19005)”)." },
          { q: "Is my file uploaded to a server?", a: "Yes. This is one of the few tools on this site that actually sends your file to a server, because PDF/A conversion and validation genuinely need Ghostscript and veraPDF, which don't run in a browser. Your file is uploaded securely over HTTPS, processed, and deleted immediately afterward — it is never stored, logged, or kept." },
          { q: "Which conformance level should I pick?", a: "PDF/A-2b is the most widely accepted for general archiving. PDF/A-1b is the oldest and most restrictive (no transparency). PDF/A-3b adds support for embedding non-PDF/A source files inside the archive. The u levels (2u, 3u) also guarantee that all text can be searched and copied as Unicode. The a levels (2a, 3a) are for accessible archives: they need a tagged PDF and keep its structure (headings, lists, tables, reading order)." },
          { q: "Why can't I choose PDF/A-2a or 3a for my file?", a: "An a level requires a tagged PDF — one that carries structure tags describing headings, paragraphs, lists and tables. The page reads your file before sending it: if it has no tags, the a levels are switched off and the page says so. Adding tags reliably to an untagged PDF takes commercial software, so we don't pretend to: export your document again with tags turned on (Word: “Document structure tags for accessibility”; LibreOffice: “Universal accessibility (PDF/UA)”), or choose 2u / 3u." },
          { q: "Do you offer PDF/A-1a?", a: "No. In our tests no open-source tool produced a valid PDF/A-1a, so we don't offer it rather than hand you a file that fails validation. PDF/A-2a covers the same accessibility requirements on a newer base." },
          { q: "What does 'give me the closest lower level' do?", a: "If the level you chose can't be reached for your file (for example a 2a request on a PDF whose structure doesn't pass), the next lower level is tried — 2a, then 2u, then 2b — and the result says exactly which level you got and why. Untick it to get only the level you asked for, or nothing." },
        ]}
        tips={[
          "PDF/A intentionally disallows some ordinary PDF features (transparency in 1b, JavaScript, external references, unembedded fonts) — a real conversion failure is often the source PDF using one of these.",
          "This is a one-way, lossy-safe conversion for archiving, not a general-purpose PDF editor — use PDF Editor first for organizing pages or adding content, then convert the result here.",
        ]}
      />
    </div>
  );
}
