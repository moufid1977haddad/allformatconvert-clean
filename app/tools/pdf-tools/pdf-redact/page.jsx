'use client';
import { pdfFileProblem, pdfLockedProblem } from '../../../lib/fileChecks';
import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { matchSpans, annotationText, patternSpans, annotationMatches, termsOf, PATTERNS } from '../../../lib/pdfRedact';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import TextArea from '@/app/components/TextArea';
import { withActualTextUnicode } from '../../../lib/pdfActualText';
import { fitScale, withTimeout, StepTimeout } from '../../../lib/canvasLimit'; // P31: one canvas cap for iPhone / iPad
import { serverRenderAvailable, ServerPageRenderer, LOCAL_PAGE_LIMIT_MS, LOCAL_PAGE_LIMIT_LABEL, listPages } from '../../../lib/serverPageRender';
import { sanitizeForCopy, verifyRedacted, relinkDestinations, UNREADABLE_ANNOTATIONS } from '../../../lib/redactSanitize';

// P32 (04/10): a page drawn by our PDF service comes with the page's /Rotate applied (pdftoppm); the redaction works
// on the unrotated page (rotation 0 viewport, rotation set back on the new page), so the image is turned back here.
// the device does not change while the page is open: nothing to subscribe to (useSyncExternalStore reads it once on
// the client, false in the server render, so hydration matches)
const noSubscribe = () => () => {};

// P33 (05/10): real iPhone pass of 04/10 (iOS 26) — kit-iphone-p21/pdf-avec-images.pdf, "photo-2", "Redact PDF": no
// file, no message, no error. Playwright's WebKit and Chromium (iPhone) redact the same file in ~2 s, and no request
// reached /api/pdf-render or /api/report-error during the owner's test (Vercel logs), so the page never got to the
// 20-second drawing fallback nor showed an error. The page now always answers: every step says where it is
// ("Page 2 of 3: reading its text…"), a step with no progress for STEP_LIMIT_MS stops with a sentence naming it (and
// that sentence reaches tool_errors, so the next real failure tells us which step it was), and the result or the
// message is scrolled into view (on a phone it appeared under the keyboard / below the fold).
const STEP_LIMIT_MS = () => (typeof window !== 'undefined' && window.__redactStepLimitMs) || 60000;
const quoteTerms = (terms) => terms.map((t) => `“${t}”`).join(', ');

function drawUnrotated(ctx, img, W, H, rot) {
  ctx.save();
  if (rot === 90) { ctx.translate(0, H); ctx.rotate(-Math.PI / 2); ctx.drawImage(img, 0, 0, H, W); }
  else if (rot === 180) { ctx.translate(W, H); ctx.rotate(Math.PI); ctx.drawImage(img, 0, 0, W, H); }
  else if (rot === 270) { ctx.translate(W, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(img, 0, 0, H, W); }
  else ctx.drawImage(img, 0, 0, W, H);
  ctx.restore();
}

export default function Page() {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [kinds, setKinds] = useState([]); // P24: automatic patterns (e-mail, phone, card numbers)
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useToolError('');
  const [summary, setSummary] = useState('');
  const [progress, setProgress] = useState('');
  const fileRef = useRef();
  const resultRef = useRef(null);
  // P33: the outcome (file row, summary or message) is brought into view when it appears
  useEffect(() => {
    if ((summary || error) && resultRef.current && resultRef.current.scrollIntoView) resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [summary, error]);
  // P32: the notice of the iPhone / iPad fallback, read after mounting (the server render does not know the device)
  const onAppleTouch = useSyncExternalStore(noSubscribe, serverRenderAvailable, () => false);

  const handleFile = async (e) => { const f = e.target.files[0]; e.target.value = ''; setResult(null); setSummary(''); setError(''); if (!f) return; const problem = (await pdfFileProblem(f)) || (await pdfLockedProblem(f)); if (problem) { setFile(null); setError(problem); return; } setFile(f); }; // P21: a bad file is said when it is chosen

  const redact = async () => {
    let sentToServer = false; // P32: said even if the service then fails (review 04/10)
    const terms = termsOf(keyword);
    if (!file || (!terms.length && !kinds.length)) return;
    setLoading(true);
    setError('');
    setSummary('');
    setResult(null);
    setProgress('Opening the PDF...');
    const limit = STEP_LIMIT_MS();
    const step = (promise, what, onTimeout) => withTimeout(promise, limit, `${what} made no progress for ${Math.round(limit / 1000)} seconds on this device. Try again; if it happens again, use a computer for this PDF.`, onTimeout);
    try {
      const lib = await import('pdf-lib');
      const { PDFDocument, degrees } = lib;
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await step(PDFDocument.load(await openablePdfBytes(arrayBuffer)), 'Opening the PDF');
      const outDoc = await PDFDocument.create();
      const loadingTask = pdfjsLib.getDocument({ data: await withActualTextUnicode(arrayBuffer) });
      const pdf = await step(loadingTask.promise, 'Opening the PDF', () => loadingTask.destroy());
      const scale = 2;
      const canFallBack = serverRenderAvailable();
      let renderer = null;
      let remote = false;
      const drawnByServer = [];
      try {
      let totalMatches = 0;
      const pagesHit = [];
      const perPage = []; // [page, occurrences]
      const found = new Map(); // page index → { page, content, items, spans, boxes }
      const measure = document.createElement('canvas').getContext('2d');
      const textMatches = (strs, eols) => terms.some((t) => matchSpans(strs, t).length) || patternSpans(strs, kinds, eols).length > 0;

      // Pass 1 (P33): every page is searched BEFORE anything is copied — the pages without a match are then copied from
      // a source in which the redacted pages are empty shells (app/lib/redactSanitize.js, independent review 05/10).
      for (let i = 0; i < pdf.numPages; i++) {
        const where = `Page ${i + 1} of ${pdf.numPages}`;
        setProgress(`${where}: reading its text...`);
        const page = await step(pdf.getPage(i + 1), `${where}: opening the page`);
        const content = await step(page.getTextContent(), `${where}: reading its text`);
        const items = content.items.filter((it) => typeof it.str === 'string');
        const strs = items.map((it) => it.str);
        const eols = items.map((it) => !!it.hasEOL);
        const spans = [
          ...terms.flatMap((t, ti) => matchSpans(strs, t).map((sp) => ({ ...sp, m: `t${ti}:${sp.m}` }))),
          ...patternSpans(strs, kinds, eols),
        ];
        // Form field values, comments, link addresses… are searched too (29/09, P33).
        const all = await step(page.getAnnotations(), `${where}: reading its form fields and comments`);
        const annots = all.filter((an) => an.rect && annotationMatches(annotationText(an), terms, kinds));
        if (spans.length === 0 && annots.length === 0) continue;
        // on a redacted page, an annotation whose content cannot be read (a stamp, an attached file…) is blacked out too
        const opaque = all.filter((an) => an.rect && UNREADABLE_ANNOTATIONS.has(an.subtype) && !annots.includes(an));
        const here = new Set(spans.map((sp) => sp.m)).size + annots.length;
        totalMatches += here;
        pagesHit.push(i + 1);
        perPage.push([i + 1, here]);
        found.set(i, { page, content, items, spans, boxes: [...annots, ...opaque] });
      }

      if (totalMatches === 0) {
        // no file is made: nothing would be removed (P33: the terms are named back, as the market's tools do)
        const asked = [terms.length ? quoteTerms(terms) : '', ...kinds.map((k) => PATTERNS[k].label.toLowerCase())].filter(Boolean).join(', ');
        setError(`No match found for ${asked} in this PDF's text (${pdf.numPages} page${pdf.numPages > 1 ? 's' : ''} searched). Text that is part of a picture (a scan) cannot be found: run PDF OCR first.`);
        setLoading(false);
        setProgress('');
        return;
      }
      const removed = sanitizeForCopy(srcDoc, [...found.keys()], lib);

      // Pass 2: the pages without a match are copied (from the made-safe source); each page with one is rebuilt from a
      // picture of itself with the matches blacked out.
      for (let i = 0; i < pdf.numPages; i++) {
        const where = `Page ${i + 1} of ${pdf.numPages}`;
        const hit = found.get(i);
        if (!hit) {
          const [copied] = await outDoc.copyPages(srcDoc, [i]);
          outDoc.addPage(copied);
          continue;
        }
        const { page, content, items, spans, boxes } = hit;
        setProgress(`${where}: blacking out ${perPage.find(([pg]) => pg === i + 1)[1]} occurrence(s)...`);

        // A black rectangle drawn on top of the page still leaves the
        // original text operators in the content stream, so the "hidden"
        // text stays selectable/extractable underneath. pdf-lib and
        // @cantoo/pdf-lib both only expose page/content-stream *construction*
        // APIs, not a supported way to excise specific text runs from an
        // existing content stream. So instead: rasterize this page to a
        // bitmap, black out the matched regions in the pixels themselves,
        // and rebuild the page from that image with no vector content
        // underneath at all -- there is no text left to extract because the
        // page no longer contains any text objects, matched or not.
        const rotation = page.rotate;
        const unit = page.getViewport({ scale: 1, rotation: 0 });
        const viewport = page.getViewport({ scale: fitScale(unit.width, unit.height, scale), rotation: 0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        // P32: on iPhone / iPad, a page the device has not drawn within LOCAL_PAGE_LIMIT_MS is drawn by our PDF service
        // (same density, PNG, lossless) and the redaction boxes are painted on it here, exactly as on a local drawing.
        let drawn = false;
        if (!remote) {
          try {
            const task = page.render({ canvasContext: ctx, viewport });
            await (canFallBack ? withTimeout(task.promise, LOCAL_PAGE_LIMIT_MS(), 'timeout', () => task.cancel()) : step(task.promise, `${where}: drawing the page`, () => task.cancel()));
            drawn = true;
          } catch (e) {
            if (!canFallBack) throw e;
            console.warn(`[pdf-redact] page ${i + 1} not drawn on this device (${e?.name}: ${e?.message}); our PDF service draws it`);
            remote = true;
          }
        }
        if (!drawn) {
          if (!renderer) renderer = new ServerPageRenderer(file);
          sentToServer = true;
          setProgress(`${where}: drawing it on our PDF service...`);
          let r;
          try {
            r = await renderer.render({ page: i + 1, dpi: Math.max(36, Math.round(72 * viewport.scale)), format: 'png', maxPixels: Math.max(100000, Math.ceil(canvas.width * canvas.height * 1.05)) });
          } catch (e2) {
            throw new Error(`page ${i + 1} could not be drawn on this device, and our PDF service could not draw it either: ${e2.message}`);
          }
          const img = await createImageBitmap(r.blob);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
          drawUnrotated(ctx, img, canvas.width, canvas.height, ((rotation % 360) + 360) % 360);
          if (img.close) img.close();
          drawnByServer.push(i + 1);
        }

        ctx.fillStyle = '#000000';
        const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], n) => { const [vx, vy] = viewport.convertToViewportPoint(x, y); if (n) ctx.lineTo(vx, vy); else ctx.moveTo(vx, vy); }); ctx.closePath(); ctx.fill(); };
        // Only the matched characters are covered (as Adobe Acrobat and PDF24 do), not the whole text run. Their
        // position inside the run is measured with the run's font (the font pdf.js loaded for it, else its fallback
        // family); the box is widened by 15 % of the font size, plus 4 % of the text before the match when only the
        // fallback font could be used. P33 (review 05/10): document.fonts.check() said "true" for a family that is not
        // loaded at all (the specification's answer), so the margin was never added; and character / word spacing
        // (Tc, Tw) made the measured position wrong — the end of "SECRET" stayed visible. Now the font counts as real
        // only if a loaded FontFace has its name, and when the measured run differs from the PDF's own width by more
        // than 3 %, the WHOLE run is covered (over-redaction is the safe side). Rotated text is handled.
        const loadedFaces = new Set();
        if (document.fonts && document.fonts.forEach) document.fonts.forEach((f) => { if (f.status === 'loaded') loadedFaces.add(f.family.replace(/^["']|["']$/g, '')); });
        for (const sp of spans) {
          const it = items[sp.k];
          const [ta, tb, tc, td, tx, ty] = it.transform;
          const fs = Math.hypot(tc, td) || it.height || 12;
          const dl = Math.hypot(ta, tb) || 1;
          const ux = [ta / dl, tb / dl], uy = [tc / (Math.hypot(tc, td) || 1), td / (Math.hypot(tc, td) || 1)];
          const style = content.styles[it.fontName] || {};
          let x0 = 0, x1 = it.width || fs * it.str.length * 0.6, extra = 0;
          if (!style.vertical && it.str.length > 1) {
            const real = loadedFaces.has(it.fontName);
            measure.font = `100px ${real ? `"${it.fontName}", ` : ''}${style.fontFamily || 'sans-serif'}`;
            const all = measure.measureText(it.str).width || 1;
            const pre = measure.measureText(it.str.slice(0, sp.c0)).width, upto = measure.measureText(it.str.slice(0, sp.c1)).width;
            const W = it.width || all * fs / 100;
            if (it.width && Math.abs(all * fs / 100 - it.width) > 0.03 * it.width) { x0 = 0; x1 = W; } // spacing the measure cannot follow: whole run
            else {
              x0 = W * pre / all; x1 = W * upto / all;
              if (!real) extra = 0.04 * x0 + 0.04 * (x1 - x0);
              // a match that reaches the start or the end of the run is covered to that edge (second review: the
              // last letter of "Müller", drawn after a separate accent glyph, stayed visible)
              if (sp.c0 === 0) x0 = 0;
              if (sp.c1 >= it.str.length) x1 = W;
            }
          }
          const pad = 0.15 * fs + extra;
          const lo = x0 - pad, hi = x1 + pad, dn = -0.3 * fs, up = 1.05 * fs;
          const P = (u, v) => [tx + ux[0] * u + uy[0] * v, ty + ux[1] * u + uy[1] * v];
          poly([P(lo, dn), P(hi, dn), P(hi, up), P(lo, up)]);
        }
        for (const an of boxes) {
          const [ax0, ay0, ax1, ay1] = an.rect;
          poly([[ax0, ay0], [ax1, ay0], [ax1, ay1], [ax0, ay1]]);
        }

        const blob = await step(new Promise((resolve) => canvas.toBlob(resolve, 'image/png')), `${where}: making the blacked-out image`);
        if (!blob) throw new Error(`${where}: this device could not make the blacked-out image.`);
        const imgBytes = await blob.arrayBuffer();
        const embeddedImg = await outDoc.embedPng(imgBytes);
        const { width: pw, height: ph } = page.getViewport({ scale: 1, rotation: 0 });
        const newPage = outDoc.addPage([pw, ph]);
        newPage.drawImage(embeddedImg, { x: 0, y: 0, width: pw, height: ph });
        if (rotation) newPage.setRotation(degrees(rotation));
      }

      relinkDestinations(outDoc, lib);
      setProgress('Saving the redacted PDF...');
      const pdfBytes = await step(outDoc.save(), 'Saving the redacted PDF');
      // P33: the finished file is read again; a file in which a term can still be found is not handed over
      setProgress('Checking the redacted PDF...');
      const check = await step(verifyRedacted(pdfBytes, { terms, textMatches, annotMatches: (t) => annotationMatches(t, terms, kinds), annotText: annotationText, pdfjsLib, lib, pageCount: pdf.numPages }), 'Checking the redacted PDF');
      if (!check.ok) {
        setError(`This PDF could not be redacted safely: after blacking out, ${check.reason}. No file is given. Please tell us about it through the contact page (without the file), or redact it in a desktop tool.${sentToServer ? ' Your PDF was sent to our own PDF service for this attempt, then deleted.' : ''}`);
        setLoading(false);
        setProgress('');
        return;
      }
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
      const byServer = drawnByServer.length ? ` This device could not draw ${drawnByServer.length > 1 ? 'pages' : 'page'} ${listPages(drawnByServer)}, so our own PDF service drew ${drawnByServer.length > 1 ? 'them' : 'it'} before the blacking out: your PDF was sent there, then deleted.` : '';
      const dropped = removed.annotations + removed.links ? ` On the other pages, ${[removed.annotations ? `${removed.annotations} stamp${removed.annotations > 1 ? 's' : ''} or attachment${removed.annotations > 1 ? 's' : ''} (content this tool cannot check)` : '', removed.links ? `${removed.links} link${removed.links > 1 ? 's' : ''} to a redacted page or running a script` : ''].filter(Boolean).join(' and ')} ${removed.annotations + removed.links > 1 ? 'were' : 'was'} removed.` : '';
      const detail = perPage.map(([pg, n]) => `page ${pg}: ${n}`).join(', ');
      setSummary(`Blacked out ${totalMatches} occurrence${totalMatches > 1 ? 's' : ''} (${detail}). ${pagesHit.length > 1 ? 'These pages are' : 'This page is'} now a flattened image, and the finished file was checked: the blacked-out text no longer exists in it.${dropped} Check the result before sharing it: text drawn as an image (a scan) or inside a fill pattern cannot be found.${byServer}`);
      } finally {
        if (renderer) renderer.close();
      }
    } catch(e) { setError((e instanceof StepTimeout ? e.message : 'Redaction failed: ' + e.message) + (sentToServer ? ' Your PDF was sent to our own PDF service for this attempt, then deleted.' : '')); }
    setProgress('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Redact PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Censor sensitive text in your PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm"><UploadPrompt what="a PDF file" /></p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text to redact (one word or phrase per line)</label>
            <TextArea id="rd-terms" rows={3} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Enter text to censor..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <fieldset className="text-sm"><legend className="text-neutral-500 mb-1">Also find automatically</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(PATTERNS).map(([k, p]) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={kinds.includes(k)} onChange={e => setKinds(e.target.checked ? [...kinds, k] : kinds.filter((x) => x !== k))} /> {p.label}</label>
              ))}
            </div>
          </fieldset>
          <button onClick={redact} disabled={!file || (!keyword.trim() && !kinds.length) || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Redacting...' : 'Redact PDF'}
          </button>
          {loading && progress && <p className="text-xs text-neutral-600 text-center" aria-live="polite" data-redact-progress>{progress}</p>}
          {onAppleTouch && <p className="text-xs text-neutral-600 text-center" data-server-render-note>On iPhone and iPad, a page your device cannot draw within {LOCAL_PAGE_LIMIT_LABEL} is drawn by our own PDF service instead: your PDF is sent there, then deleted.</p>}
          <div ref={resultRef} className="space-y-4 scroll-mt-24">
            {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
            {summary && <p className="text-neutral-700 text-center text-sm" data-summary>{summary}</p>}
            {result && <FileDownload href={result} name="redacted.pdf" />}
          </div>
        </div>
      </div>
      <SeoContent
        title="PDF Redact"
        description="PDF Redact searches your PDF's text for the words or phrases you list (one per line) and, if you tick them, every e-mail address, phone number (9 to 15 digits) and card number (checked with the Luhn formula), using PDF.js — ignoring case, spaces and line breaks, so a phrase is found even when it wraps onto the next line or changes font mid-way — as well as form field values and comments. It then permanently destroys the matches rather than just covering them: any page containing a match is rendered to a flattened image with only the matched words blacked out in the pixels themselves (the rest of the line stays readable), and that image replaces the page's original content entirely — so there are no text objects left on that page to select, copy, or extract. Pages with no match are left untouched, keeping their original selectable, searchable text. On a computer, everything runs locally in your browser and your file is not uploaded. On an iPhone or iPad, a page with a match that the device cannot draw within 20 seconds is drawn by our own PDF service (not a third party) before the blacking out, which is still done in your browser: the PDF is sent there, then deleted, and the page tells you."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type each word or phrase to redact on its own line, and/or tick e-mail addresses, phone numbers or card numbers.",
          "Click 'Redact PDF' — pages containing a match are flattened to an image with the matched words permanently blacked out; the tool tells you how many occurrences it covered and on which pages.",
          "Click 'Download' next to redacted.pdf to save the result."
        ]}
        faqs={[
          { q: "Is PDF Redact free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does this tool truly remove sensitive text from the PDF, or just cover it up?", a: "It truly removes it. Any page with a match is rendered to a flattened image with the matched text blacked out in the pixels, and that image replaces the page's content — the underlying text is gone, not just hidden, so it can't be recovered by selecting or extracting text from that page. The pages without a match are copied without anything that could still lead to a redacted page (links to it, shared resources, form-field links), and the finished file is read again before it is given to you: if a term could still be found in it, no file is given." },
          { q: "What changes on the pages without a match?", a: "Their text, images and links stay as they are. Removed from them: stamps, file attachments and media (this tool cannot check what they contain), links that jump to a redacted page or run a script, and private application data. The summary says how many were removed." },
          { q: "Does the search ignore accents and hyphens?", a: "Yes. Searching for Muller also finds Müller, and a word split by a hyphen at the end of a line is found too; a little more may be blacked out than you typed, never less." },
          { q: "Does this affect other text on the same page that I didn't ask to redact?", a: "Yes — a matched page is flattened entirely, so all text on that page becomes a static image and loses selectability and searchability, not just the redacted word. Pages with no match are left as original, fully searchable text." },
          { q: "Can I visually select an area to redact, or preview matches first?", a: "No — there's no click-to-select or highlighting interface. You list words or phrases and tick automatic patterns; every page containing a match is processed automatically, and the tool lists the pages it changed so you can check them." },
          { q: "What do the automatic patterns find?", a: "E-mail addresses; phone numbers of 9 to 15 digits written with spaces, dots, dashes, brackets or a +country code (dates like 2026-10-02 are left alone); card numbers of 13 to 19 digits that pass the Luhn check every real card number passes. A number of another kind with as many digits can be covered too: check the listed pages." },
          { q: "Are form fields and comments redacted?", a: "Yes — a form field value or a comment containing the phrase is blacked out too, and the page is flattened, so the field and its value no longer exist in the file." },
          { q: "Can it redact text in a scanned PDF?", a: "No — a scan is a picture with no text in it, so there is nothing to search. Run PDF OCR first, then redact the OCR'd file." },
          { q: "Is my file uploaded to a server?", a: "Not on a computer: matching and redaction both happen locally in your browser. On an iPhone or iPad, if the device cannot draw a page that has a match within 20 seconds, our own PDF service draws that page (your PDF is sent there, then deleted; the page tells you), and the matches are still found and blacked out in your browser." }
        ]}
        tips={[
          "Because matched pages are fully flattened to images, expect some loss of text searchability and a larger file size for those pages — that trade-off is what makes the redaction genuinely irreversible.",
          "Search terms are matched as a case-insensitive substring that ignores spaces and line breaks, so short or common keywords can over-match and flatten more pages than intended — use a specific phrase rather than a short fragment.",
          "After downloading, try selecting or searching for the redacted text in a PDF reader — it should no longer be selectable or found on that page.",
          "Pages that don't contain your search term are left completely untouched, preserving their original text quality and searchability."
        ]}
      />
    </div>
  );
}