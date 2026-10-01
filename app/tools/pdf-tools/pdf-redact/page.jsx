'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { matchSpans, annotationText, matchesText } from '../../../lib/pdfRedact';
import { loadPdfjs } from '../../../lib/pdfjs';
import { FileDownload } from '../../../components/FileDownload';

export default function Page() {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); setSummary(''); };

  const redact = async () => {
    if (!file || !keyword.trim()) return;
    setLoading(true);
    setError('');
    setSummary('');
    setResult(null);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const pdfjsLib = await loadPdfjs();
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer));
      const outDoc = await PDFDocument.create();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const scale = 2;
      let totalMatches = 0;
      const pagesHit = [];
      const measure = document.createElement('canvas').getContext('2d');

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        const items = content.items.filter((it) => typeof it.str === 'string');
        const spans = matchSpans(items.map((it) => it.str), keyword);
        // Form field values and comments are searched too: they are part of the page's annotations, which are
        // copied as they are on a page without a match in its text (29/09).
        const annots = (await page.getAnnotations()).filter((an) => an.rect && matchesText(annotationText(an), keyword));

        if (spans.length === 0 && annots.length === 0) {
          const [copied] = await outDoc.copyPages(srcDoc, [i]);
          outDoc.addPage(copied);
          continue;
        }
        totalMatches += new Set(spans.map((sp) => sp.m)).size;
        totalMatches += annots.length;
        pagesHit.push(i + 1);

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
        const viewport = page.getViewport({ scale, rotation: 0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        ctx.fillStyle = '#000000';
        const poly = (pts) => { ctx.beginPath(); pts.forEach(([x, y], n) => { const [vx, vy] = viewport.convertToViewportPoint(x, y); if (n) ctx.lineTo(vx, vy); else ctx.moveTo(vx, vy); }); ctx.closePath(); ctx.fill(); };
        // Only the matched characters are covered (as Adobe Acrobat and PDF24 do), not the whole text run. Their
        // position inside the run is measured with the run's font (the font pdf.js loaded for it once the page is
        // rendered, else its fallback family); the box is widened by 15 % of the font size, plus 4 % of the text
        // before the match when only the fallback font could be used, so a measuring error over-covers rather
        // than leaves part of a character visible. Rotated text is handled (the box follows the text direction).
        for (const sp of spans) {
          const it = items[sp.k];
          const [ta, tb, tc, td, tx, ty] = it.transform;
          const fs = Math.hypot(tc, td) || it.height || 12;
          const dl = Math.hypot(ta, tb) || 1;
          const ux = [ta / dl, tb / dl], uy = [tc / (Math.hypot(tc, td) || 1), td / (Math.hypot(tc, td) || 1)];
          const style = content.styles[it.fontName] || {};
          let x0 = 0, x1 = it.width || fs * it.str.length * 0.6, extra = 0;
          if (!style.vertical && it.str.length > 1) {
            const real = document.fonts && document.fonts.check(`10px "${it.fontName}"`);
            measure.font = `100px ${real ? `"${it.fontName}", ` : ''}${style.fontFamily || 'sans-serif'}`;
            const all = measure.measureText(it.str).width || 1;
            const pre = measure.measureText(it.str.slice(0, sp.c0)).width, upto = measure.measureText(it.str.slice(0, sp.c1)).width;
            const W = it.width || all * fs / 100;
            x0 = W * pre / all; x1 = W * upto / all;
            if (!real) extra = 0.04 * x0 + 0.04 * (x1 - x0);
          }
          const pad = 0.15 * fs + extra;
          const lo = x0 - pad, hi = x1 + pad, dn = -0.3 * fs, up = 1.05 * fs;
          const P = (u, v) => [tx + ux[0] * u + uy[0] * v, ty + ux[1] * u + uy[1] * v];
          poly([P(lo, dn), P(hi, dn), P(hi, up), P(lo, up)]);
        }
        for (const an of annots) {
          const [ax0, ay0, ax1, ay1] = an.rect;
          poly([[ax0, ay0], [ax1, ay0], [ax1, ay1], [ax0, ay1]]);
        }

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const imgBytes = await blob.arrayBuffer();
        const embeddedImg = await outDoc.embedPng(imgBytes);
        const { width: pw, height: ph } = page.getViewport({ scale: 1, rotation: 0 });
        const newPage = outDoc.addPage([pw, ph]);
        newPage.drawImage(embeddedImg, { x: 0, y: 0, width: pw, height: ph });
        if (rotation) newPage.setRotation(degrees(rotation));
      }

      if (totalMatches === 0) {
        setError('No matches found for that text.');
        setLoading(false);
        return;
      }

      const pdfBytes = await outDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
      setSummary(`Blacked out ${totalMatches} occurrence${totalMatches > 1 ? 's' : ''} on page${pagesHit.length > 1 ? 's' : ''} ${pagesHit.join(', ')}. Check the result before sharing it: text drawn as an image (a scan) cannot be found.`);
    } catch(e) { setError('Redaction failed: ' + e.message); }
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-500 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text to redact</label>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Enter text to censor..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <button onClick={redact} disabled={!file || !keyword.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Redacting...' : 'Redact PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {summary && <p className="text-neutral-700 text-center text-sm" data-summary>{summary}</p>}
          {result && <FileDownload href={result} name="redacted.pdf" />}
        </div>
      </div>
      <SeoContent
        title="PDF Redact"
        description="PDF Redact searches your PDF's text for a word or phrase using PDF.js — ignoring case, spaces and line breaks, so a phrase is found even when it wraps onto the next line or changes font mid-way — as well as form field values and comments. It then permanently destroys the matches rather than just covering them: any page containing a match is rendered to a flattened image with only the matched words blacked out in the pixels themselves (the rest of the line stays readable), and that image replaces the page's original content entirely — so there are no text objects left on that page to select, copy, or extract. Pages with no match are left untouched, keeping their original selectable, searchable text. Everything runs locally in your browser; your file is never uploaded to a server."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type the exact word or phrase to redact into the text field.",
          "Click 'Redact PDF' — pages containing a match are flattened to an image with the matched words permanently blacked out; the tool tells you how many occurrences it covered and on which pages.",
          "Click 'Download' next to redacted.pdf to save the result."
        ]}
        faqs={[
          { q: "Is PDF Redact free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does this tool truly remove sensitive text from the PDF, or just cover it up?", a: "It truly removes it. Any page with a match is rendered to a flattened image with the matched text blacked out in the pixels, and that image replaces the page's content — the underlying text is gone, not just hidden, so it can't be recovered by selecting or extracting text from that page." },
          { q: "Does this affect other text on the same page that I didn't ask to redact?", a: "Yes — a matched page is flattened entirely, so all text on that page becomes a static image and loses selectability and searchability, not just the redacted word. Pages with no match are left as original, fully searchable text." },
          { q: "Can I visually select an area to redact, or preview matches first?", a: "No — there's no click-to-select or highlighting interface. You type a word or phrase, every page containing a match is processed automatically, and the tool lists the pages it changed so you can check them." },
          { q: "Are form fields and comments redacted?", a: "Yes — a form field value or a comment containing the phrase is blacked out too, and the page is flattened, so the field and its value no longer exist in the file." },
          { q: "Can it redact text in a scanned PDF?", a: "No — a scan is a picture with no text in it, so there is nothing to search. Run PDF OCR first, then redact the OCR'd file." },
          { q: "Is my file uploaded to a server?", a: "No, matching and redaction both happen locally in your browser." }
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