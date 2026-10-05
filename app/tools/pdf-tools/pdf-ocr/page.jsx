'use client';
import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { placeOnVisiblePage, visibleSize } from '../../../lib/pdfPlace';
import ProgressBar from '../../../components/ProgressBar';
import { reportToolError } from '../../../lib/reportError';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';
import { fitScale, withTimeout, StepTimeout } from '../../../lib/canvasLimit'; // P31: one canvas cap for iPhone / iPad
import { LANGUAGES, matchLanguages, optionLabel } from '../../../lib/ocrLanguages';
import LanguageCombobox, { languageFromBrowser } from '@/app/components/LanguageCombobox';
import { serverRenderAvailable, listPages } from '../../../lib/serverPageRender';
import { ServerPageOcr, LOCAL_OCR_LIMIT_MS, LOCAL_OCR_LIMIT_LABEL } from '../../../lib/serverPageOcr';

// P33 (05/10): the device's own recognition is watched. Real iPhone pass of 04/10 (iOS 26): the page stayed on "Page 1
// of 3, Recognizing text… 0 %" for good, with no message (Playwright's WebKit recognizes the same PDF in ~4 s; cause
// not reproduced, ranked hypotheses in docs/audit/RAPPORT-p33-redact-ocr-05-10.md §3b). On iPhone / iPad a step with
// no progress for LOCAL_OCR_LIMIT_MS (preparing the engine, drawing the page, recognizing it), or a failure, hands
// this page and the next ones to our OCR service (app/lib/serverPageOcr.js), said before and after. On a computer
// nothing is sent; a step with no progress for DESKTOP_STALL_MS stops with a clear message instead of waiting forever.
const DESKTOP_STALL_MS = 90000;
const OFFERED = new Set(LANGUAGES.map((l) => l.code));
const labelOf = (code) => LANGUAGES.find((l) => l.code === code)?.label || code;
const noSubscribe = () => () => {};

class StallError extends Error { constructor(m) { super(m); this.name = 'StallError'; } }
// rejects when `kick` has not been called for `ms` (each progress event of Tesseract.js calls it)
function stallGuard(ms, message) {
  let timer, fail;
  const promise = new Promise((_, reject) => { fail = reject; });
  promise.catch(() => {});
  const kick = () => { clearTimeout(timer); timer = setTimeout(() => fail(new StallError(message)), ms); };
  kick();
  return { promise, kick, stop: () => clearTimeout(timer) };
}

export default function Page() {
  const [file, setFile] = useState(null);
  const [langs, setLangs] = useState(['eng']);
  const chosenByVisitor = useRef(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const [downloadPct, setDownloadPct] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState('');
  const [pagePct, setPagePct] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stage, setStage] = useState('');
  const [serverNote, setServerNote] = useState('');
  const fileRef = useRef();
  // P33: the notice of the iPhone / iPad fallback, read after mounting (the server render does not know the device)
  const onAppleTouch = useSyncExternalStore(noSubscribe, serverRenderAvailable, () => false);

  // the browser's language is chosen first when PDF OCR offers it (owner's brief); the visitor's own choice wins
  useEffect(() => {
    if (chosenByVisitor.current || typeof navigator === 'undefined') return;
    const code = languageFromBrowser(navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language], OFFERED);
    if (code) setLangs([code]);
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setFile(f); setPdfUrl(null);
    setOutput('');
    setError('');
    setServerNote('');
  };

  const ocr = async () => {
    if (!file || !langs.length) return;
    setLoading(true);
    setError('');
    setOutput('');
    setPdfUrl(null);
    setServerNote('');
    setDownloadPct(0);
    setDownloadLabel('');
    setPagePct(0);
    setCurrentPage(0);
    setTotalPages(0);
    setStage('');
    const lang = langs.join('+');
    const langLabel = langs.map(labelOf).join(' + ');
    const canFallBack = serverRenderAvailable();
    const limit = canFallBack ? LOCAL_OCR_LIMIT_MS() : DESKTOP_STALL_MS;
    let worker = null;
    let remote = null;
    let useServer = false;
    let sentToServer = false;
    const byServer = [];
    let fullText = '';
    let kick = () => {};
    try {
      // Every page is rendered to a canvas and treated purely as an image --
      // this tool never reads getTextContent()/the PDF's text layer, which is
      // exactly what lets it read scanned/image-only pages that have no text
      // layer at all (unlike PDF Extract Text, which only reads that layer).
      setStage('Opening the PDF...');
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      // Searchable PDF (29/09): as iLovePDF, Smallpdf and PDF24 do, the recognized text is also added to the
      // original PDF as an invisible layer (Tesseract's text-only PDF, placed over each page as the reader sees it:
      // crop box and rotation), so the file can be searched and its text selected while the pages stay untouched.
      const { PDFDocument, degrees } = await import('pdf-lib');
      const outDoc = await PDFDocument.load(await openablePdfBytes(new Uint8Array(arrayBuffer.slice(0))));
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setTotalPages(pdf.numPages);

      // The logger callback is the only signal the user gets during the
      // (first-run only, then browser-cached) OCR engine + language data
      // download, and during each page's recognition -- surfaced as two
      // separate progress bars so there's never a silent multi-second gap.
      // Tesseract.js never rejects when the engine or a language model cannot be downloaded (blocked CDN,
      // network cut): the page stayed on "Downloading … language data" forever (found 28/09). Its errors are
      // caught here, and loading stops when nothing has progressed for 30 s (20 s on iPhone / iPad, P33).
      setStage('Preparing the OCR engine...');
      try {
        const { createWorker } = await import('tesseract.js');
        const guard = stallGuard(canFallBack ? limit : 30000, 'download stalled');
        kick = guard.kick;
        let failLoad;
        const loadFailed = new Promise((_, reject) => { failLoad = reject; });
        loadFailed.catch(() => {});
        const creating = createWorker(lang, 1, {
          errorHandler: (err) => failLoad(err instanceof Error ? err : new Error(String(err))),
          logger: (m) => {
            kick();
            if (m.status === 'loading tesseract core') {
              setDownloadLabel('Downloading OCR engine...');
              setDownloadPct(Math.round(m.progress * 100));
            } else if (/loading.*(traineddata|language)/i.test(m.status)) {
              setDownloadLabel(`Downloading ${langLabel} language data...`);
              setDownloadPct(Math.round(m.progress * 100));
            } else if (m.status === 'recognizing text') {
              setPagePct(Math.round(m.progress * 100));
            }
          },
        });
        creating.catch(() => {}); // settled by the race below
        try {
          worker = await Promise.race([creating, loadFailed, guard.promise]);
        } catch (loadErr) {
          creating.then((w) => w.terminate()).catch(() => {});
          throw loadErr;
        } finally {
          guard.stop();
        }
      } catch (loadErr) {
        if (!canFallBack) {
          const err = new Error(`The ${langLabel} language data could not be downloaded. Check your connection (a blocker or firewall may stop cdn.jsdelivr.net), then run the OCR again.`);
          err.name = 'OcrDownloadError';
          err.cause = loadErr;
          throw err;
        }
        console.warn(`[pdf-ocr] the OCR engine did not start on this device (${loadErr?.name}: ${loadErr?.message}); our OCR service takes over`);
        useServer = true;
      }
      setDownloadLabel('');

      for (let i = 1; i <= pdf.numPages; i++) {
        setCurrentPage(i);
        setPagePct(0);
        let text = null;
        let layer = null;
        if (!useServer) {
          try {
            const where = `Page ${i} of ${pdf.numPages}`;
            const stalled = (what) => (canFallBack ? `${where}: ${what} made no progress for ${LOCAL_OCR_LIMIT_LABEL}.` : `${where}: ${what} made no progress for ${DESKTOP_STALL_MS / 1000} seconds on this device. Try again, or use a smaller PDF.`);
            setStage('Drawing the page...');
            const page = await withTimeout(pdf.getPage(i), limit, stalled('opening the page'));
            const unit = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: fitScale(unit.width, unit.height, 2) });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            const task = page.render({ canvasContext: ctx, viewport });
            await withTimeout(task.promise, limit, stalled('drawing the page'), () => task.cancel());
            setStage('Recognizing text...');
            const guard = stallGuard(limit, stalled('recognizing the text'));
            kick = guard.kick;
            try {
              const { data } = await Promise.race([worker.recognize(canvas, { pdfTitle: file.name, pdfTextOnly: true }, { text: true, pdf: true }), guard.promise]);
              text = data.text;
              layer = data.pdf ? new Uint8Array(data.pdf) : null;
            } finally {
              guard.stop();
            }
          } catch (e) {
            if (!canFallBack) throw e;
            console.warn(`[pdf-ocr] page ${i} not recognized on this device (${e?.name}: ${e?.message}); our OCR service recognizes it and the next pages`);
            useServer = true;
            // a stuck recognition cannot be cancelled: the worker is stopped, the service does the rest
            if (worker) { const w = worker; worker = null; w.terminate().catch(() => {}); }
          }
        }
        if (useServer) {
          if (!remote) remote = new ServerPageOcr(file);
          sentToServer = true;
          setStage('Recognizing it on our OCR service...');
          setPagePct(0);
          let r;
          try {
            r = await remote.recognize({ page: i, lang });
          } catch (e2) {
            const err = new Error(`Page ${i} of ${pdf.numPages} could not be recognized on this device, and our OCR service could not recognize it either: ${e2.message}`);
            err.name = 'OcrPageError';
            throw err;
          }
          text = r.text.replace(/\f/g, '');
          layer = r.layer;
          byServer.push(i);
          setPagePct(100);
        }
        fullText += `--- Page ${i} ---\n${text.trim()}\n\n`;
        if (layer && text.trim()) {
          const [embedded] = await outDoc.embedPdf(layer, [0]);
          const target = outDoc.getPage(i - 1);
          const box = target.getCropBox();
          const rot = target.getRotation().angle;
          const vis = visibleSize(box, rot);
          const pos = placeOnVisiblePage(box, rot, 0, 0);
          target.drawPage(embedded, { x: pos.x, y: pos.y, width: vis.width, height: vis.height, rotate: degrees(pos.rotate) });
        }
      }
      if (fullText.replace(/--- Page \d+ ---/g, '').trim()) {
        const bytes = await outDoc.save();
        setPdfUrl(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })));
      }
      if (byServer.length) setServerNote(`This device could not recognize ${byServer.length > 1 ? 'pages' : 'page'} ${listPages(byServer)}, so our own OCR service recognized ${byServer.length > 1 ? 'them' : 'it'}: your PDF was sent there, then deleted.`);

      setOutput(fullText.trim() ? fullText.trim() : 'No text was recognized in this PDF.');
    } catch (e) {
      // Only the decode/OCR-engine error itself is ever reported -- never
      // `output` (the recognized text), which is exactly the file content
      // this feature must never transmit.
      // A download that failed on the visitor's side is not a defect of the tool: said, not reported.
      if (e.name !== 'OcrDownloadError') reportToolError({ tool: 'pdf-ocr', file, error: e });
      // the pages already recognized stay readable (P33)
      if (fullText.trim()) setOutput(fullText.trim());
      const sent = sentToServer ? ' Your PDF was sent to our own OCR service for this attempt, then deleted.' : '';
      setError((e instanceof StepTimeout || ['OcrDownloadError', 'OcrPageError', 'StallError'].includes(e.name) ? e.message : 'OCR failed: ' + e.message) + sent);
    } finally {
      if (worker) {
        try { await worker.terminate(); } catch { /* worker already gone */ }
      }
      if (remote) remote.close();
      setStage('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">PDF OCR</h1>
        <p className="text-neutral-500 text-center mb-8">Read text from scanned PDFs and photographed pages with Tesseract, in your browser (on iPhone and iPad, a page the device cannot read goes to our own OCR service)</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <LanguageCombobox
            label="Language of the document"
            options={LANGUAGES}
            value={langs}
            onChange={(codes) => { chosenByVisitor.current = true; setLangs(codes); }}
            search={matchLanguages}
            optionLabel={optionLabel}
            max={3}
            disabled={loading}
          />
          {loading ? (
            <div className="space-y-3" aria-live="polite">
              {downloadLabel && downloadPct < 100 && (
                <ProgressBar pct={downloadPct} label={downloadLabel} />
              )}
              {totalPages > 0 && currentPage > 0 ? (
                <>
                  <p className="text-xs text-neutral-500 text-center" data-ocr-progress>Page {currentPage} of {totalPages}{stage ? ` — ${stage}` : ''}</p>
                  <ProgressBar pct={pagePct} label="Recognizing text..." />
                </>
              ) : <p className="text-xs text-neutral-500 text-center" data-ocr-progress>{stage || 'Opening the PDF...'}</p>}
            </div>
          ) : (
            <button onClick={ocr} disabled={!file || !langs.length} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
              Run OCR
            </button>
          )}
          {!loading && file && !langs.length && <p className="text-xs text-amber-700 text-center">Choose the language of the document.</p>}
          {onAppleTouch && <p className="text-xs text-neutral-600 text-center" data-server-render-note>On iPhone and iPad, a page your device cannot recognize within {LOCAL_OCR_LIMIT_LABEL} is recognized by our own OCR service instead: your PDF is sent there, then deleted.</p>}
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {serverNote && <p className="text-xs text-neutral-600 text-center" data-ocr-server-note>{serverNote}</p>}
          {output && (
            <div className="space-y-2">
              <label className="block text-sm text-neutral-500">Recognized Text</label>
              <TextArea aria-label="Recognized Text" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none" value={output} readOnly />
              <button onClick={() => navigator.clipboard.writeText(output)} className="w-full bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Copy Text</button>
              {pdfUrl && <FileDownload href={pdfUrl} name={file.name.replace(/\.pdf$/i, '') + '-searchable.pdf'} />}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF OCR"
        description="PDF OCR renders each page of your PDF onto a canvas and runs real optical character recognition on it with Tesseract -- this is what lets it read scanned documents and photographed pages that have no underlying text layer at all, unlike our PDF Extract Text tool, which only reads a text layer that's already embedded in the file. Choose the document's language -- up to three for a mixed document -- from Tesseract's 100+ supported languages, in one list you can search by English or native name; your browser's language is chosen first when it is available. You get the recognized text to copy, and a searchable PDF: your original pages, unchanged, with the recognized text added as an invisible layer so the file can be searched and its text selected. It works best on a straight, clean, high-contrast scan; a skewed, angled, or low-quality photo gives more mistakes. OCR mistakes are not always visible garbage: a digit or letter can be read as another plausible one (8 and 3, rn and m), so proofread numbers and names. On a computer, everything runs in your browser (Tesseract.js; the engine and language data are downloaded once, then cached) and your file is not uploaded. On an iPhone or iPad, a page the device cannot recognize within 20 seconds is recognized by our own OCR service (Tesseract on our server, not a third party), in the same languages: the PDF is sent there, then deleted, and the page tells you."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Tap the language field and type to search, then choose the document's language (up to three for a mixed document); your browser's language is chosen first when it is available.",
          "Click 'Run OCR'. The first run downloads the OCR engine and language data, then recognizes text page by page.",
          "Watch the progress bars for the download and for each page (\"Page X of Y\").",
          "Read the result, grouped by page number, click 'Copy Text' to copy it, or 'Download' next to the -searchable.pdf file to get your PDF with the text layer added."
        ]}
        faqs={[
          { q: "Does this actually perform OCR now?", a: "Yes. Every page is rendered to a canvas and recognized as an image using Tesseract -- it no longer just reads an existing text layer, so scanned and photographed pages work." },
          { q: "Which languages are supported?", a: "All 100+ languages that Tesseract itself supports, from Afrikaans to Yiddish, in one searchable list (English or native name, or the code). A document mixing languages can use up to three at once; only the selected languages' data is downloaded. Our OCR service on iPhone and iPad has every language of the list." },
          { q: "How accurate is the text recognition?", a: "It's real OCR, not a flawless one -- expect a meaningful error rate (roughly 4-16% of characters, depending on scan quality), especially on skewed, angled, or low-contrast images. Some errors are visibly garbled, others are plausible (a 3 read instead of an 8), so proofread numbers, names and amounts before relying on them." },
          { q: "Can I get a searchable PDF?", a: "Yes — after recognition, the file ending in -searchable.pdf gives your original PDF with the recognized text added as an invisible layer on each page, placed as the page is displayed (crop and rotation included). The pages themselves are not re-compressed or changed." },
          { q: "Why is the first run slower than later ones?", a: "The first OCR run on a given language downloads the Tesseract engine and that language's training data. Your browser caches both, so later runs are faster." },
          { q: "Is there a file size limit?", a: "There's no fixed limit on a computer -- it's bound by your browser's available memory, and multi-page PDFs will simply take longer since each page is recognized in turn. When our OCR service takes over on an iPhone or iPad, it accepts PDFs up to 44 MB." },
          { q: "Is my PDF uploaded?", a: "Not on a computer: everything happens locally in your browser. On an iPhone or iPad, if the device cannot recognize a page within 20 seconds (or fails), that page and the next ones are recognized by our own OCR service: your PDF is sent there, then deleted, nothing is kept, and the page tells you before and after." }
        ]}
        tips={[
          "A straight, clean, high-contrast scan gives noticeably better results than a photo taken at an angle or in poor lighting.",
          "If a page comes out garbled, try re-scanning it straighter or with better lighting; check figures one by one even when the text looks right.",
          "Multi-page PDFs show a \"Page X of Y\" counter and a per-page progress bar so you can see how much is left.",
          "Always proofread OCR output before using it for anything important -- no OCR engine, including this one, is error-free."
        ]}
      />
    </div>
  );
}
