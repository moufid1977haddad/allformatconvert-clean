'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';

export default function Page() {
  const [file, setFile] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFile = (e) => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); };

  const redact = async () => {
    if (!file || !keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const outDoc = await PDFDocument.create();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const kw = keyword.trim().toLowerCase();
      const scale = 2;
      let totalMatches = 0;

      for (let i = 0; i < pdf.numPages; i++) {
        const page = await pdf.getPage(i + 1);
        const content = await page.getTextContent();
        const matches = content.items.filter(item => item.str.toLowerCase().includes(kw));

        if (matches.length === 0) {
          const [copied] = await outDoc.copyPages(srcDoc, [i]);
          outDoc.addPage(copied);
          continue;
        }
        totalMatches += matches.length;

        // A black rectangle drawn on top of the page still leaves the
        // original text operators in the content stream, so the "hidden"
        // text stays selectable/extractable underneath. pdf-lib and
        // @cantoo/pdf-lib both only expose page/content-stream *construction*
        // APIs, not a supported way to excise specific text runs from an
        // existing content stream. So instead: rasterize this page to a
        // bitmap, black out the matched regions in the pixels themselves,
        // and rebuild the page from that image with no vector content
        // underneath at all — there is no text left to extract because the
        // page no longer contains any text objects, matched or not.
        const rotation = page.rotate;
        page.cleanup();
        const renderPage = await pdf.getPage(i + 1);
        const viewport = renderPage.getViewport({ scale, rotation: 0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await renderPage.render({ canvasContext: ctx, viewport }).promise;

        ctx.fillStyle = '#000000';
        const pad = 1;
        for (const item of matches) {
          const [, , , , tx, ty] = item.transform;
          const wPt = (item.width || 50) + pad * 2;
          const hPt = (item.height || 12) + pad * 2;
          const xPt = tx - pad;
          const yPt = ty - pad;
          const x = xPt * scale;
          const yTop = viewport.height - (yPt + hPt) * scale;
          ctx.fillRect(x, yTop, wPt * scale, hPt * scale);
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
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Text to redact</label>
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Enter text to censor..." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <button onClick={redact} disabled={!file || !keyword.trim() || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">
            {loading ? 'Redacting...' : 'Redact PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="redacted.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Redacted PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Redact"
        description="PDF Redact searches your PDF's text for a keyword using PDF.js, then permanently destroys the matched text rather than just covering it: any page containing a match is rendered to a flattened image with the matched areas blacked out in the pixels themselves, and that image replaces the page's original content entirely — so there are no text objects left on that page to select, copy, or extract. Pages with no match are left untouched, keeping their original selectable, searchable text. Everything runs locally in your browser; your file is never uploaded to a server."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Type the exact word or phrase to redact into the text field.",
          "Click 'Redact PDF' — pages containing a match are flattened to an image with the text permanently blacked out.",
          "Click 'Download Redacted PDF' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Redact free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does this tool truly remove sensitive text from the PDF, or just cover it up?", a: "It truly removes it. Any page with a match is rendered to a flattened image with the matched text blacked out in the pixels, and that image replaces the page's content — the underlying text is gone, not just hidden, so it can't be recovered by selecting or extracting text from that page." },
          { q: "Does this affect other text on the same page that I didn't ask to redact?", a: "Yes — a matched page is flattened entirely, so all text on that page becomes a static image and loses selectability and searchability, not just the redacted word. Pages with no match are left as original, fully searchable text." },
          { q: "Can I visually select an area to redact, or preview matches first?", a: "No — there's no click-to-select or highlighting interface. You type a keyword, and every page containing a match is processed automatically with no preview step." },
          { q: "Is my file uploaded to a server?", a: "No, matching and redaction both happen locally in your browser." }
        ]}
        tips={[
          "Because matched pages are fully flattened to images, expect some loss of text searchability and a larger file size for those pages — that trade-off is what makes the redaction genuinely irreversible.",
          "Search terms are matched as a case-insensitive substring, so short or common keywords can over-match and flatten more pages than intended — use a specific phrase rather than a short fragment.",
          "After downloading, try selecting or searching for the redacted text in a PDF reader — it should no longer be selectable or found on that page.",
          "Pages that don't contain your search term are left completely untouched, preserving their original text quality and searchability."
        ]}
      />
    </div>
  );
}