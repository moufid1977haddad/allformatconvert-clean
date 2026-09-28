'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import SeoContent from '../../../components/SeoContent';
import { checkedDataURL } from '../../../lib/mediaSupport';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { placeOnVisiblePage, visibleSize } from '../../../lib/pdfPlace';

// Audit 2 (29/09): the pad's grey background was stamped with the signature, an opaque box hiding what was under it;
// the 500x150 pad was squeezed into 200x80 (signature stretched by a third); the pointer position was not scaled to
// the pad's displayed size, so the line was not drawn under the finger; the corner ignored the page's crop box and
// rotation. Now: transparent ink cropped to what was drawn, proportions kept, drawn under the pointer, placed in the
// corner the reader sees, on the page(s) chosen (Smallpdf and iLovePDF let you choose).
const CORNERS = [['bottom-right', 'Bottom right'], ['bottom-left', 'Bottom left'], ['bottom-center', 'Bottom centre'], ['top-right', 'Top right']];

export default function Page() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [where, setWhere] = useState('last');
  const [pageNo, setPageNo] = useState('1');
  const [corner, setCorner] = useState('bottom-right');
  const canvasRef = useRef();
  const fileRef = useRef();
  // True only once something was actually drawn: an untouched pad must never be
  // stamped into the PDF and reported as a signature.
  const inkRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // Pointer position in the canvas's own pixels (the canvas is displayed at another width).
  const at = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return [(e.clientX - rect.left) * canvas.width / rect.width, (e.clientY - rect.top) * canvas.height / rect.height];
  };

  const startDraw = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(...at(e));
    ctx.lineTo(...at(e));
    ctx.stroke();
    inkRef.current = true;
  };

  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(...at(e));
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    inkRef.current = false;
  };

  const addSignature = async () => {
    if (!file) return;
    setError('');
    if (!inkRef.current) { setError('Draw your signature in the box first — an empty signature was not added.'); return; }
    setLoading(true);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      // Only the drawn part of the pad, on a transparent background.
      const pad = canvasRef.current;
      const px = pad.getContext('2d').getImageData(0, 0, pad.width, pad.height).data;
      let x0 = pad.width, y0 = pad.height, x1 = -1, y1 = -1;
      for (let y = 0; y < pad.height; y++) for (let x = 0; x < pad.width; x++) if (px[(y * pad.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { setError('Draw your signature in the box first — an empty signature was not added.'); setLoading(false); return; }
      const ink = document.createElement('canvas');
      ink.width = x1 - x0 + 5; ink.height = y1 - y0 + 5;
      ink.getContext('2d').drawImage(pad, x0 - 2, y0 - 2, ink.width, ink.height, 0, 0, ink.width, ink.height);
      const signatureDataUrl = checkedDataURL(ink, 'image/png');
      const signatureBytes = await fetch(signatureDataUrl).then(r => r.arrayBuffer());
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(arrayBuffer));
      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const pages = pdfDoc.getPages();
      let targets;
      if (where === 'all') targets = pages;
      else if (where === 'first') targets = [pages[0]];
      else if (where === 'page') {
        const n = Number(pageNo);
        if (!Number.isInteger(n) || n < 1 || n > pages.length) throw new Error(`choose a page between 1 and ${pages.length}.`);
        targets = [pages[n - 1]];
      } else targets = [pages[pages.length - 1]];
      for (const page of targets) {
        const box = page.getCropBox();
        const rot = page.getRotation().angle;
        const vis = visibleSize(box, rot);
        // At most 200 x 80 pt (and 40 % of the page's width), proportions kept, 36 pt from the edges.
        const k = Math.min(200 / ink.width, 80 / ink.height, (0.4 * vis.width) / ink.width);
        const w = ink.width * k, h = ink.height * k, m = 36;
        const vx = corner === 'bottom-left' ? m : corner === 'bottom-center' ? (vis.width - w) / 2 : vis.width - w - m;
        const vy = corner === 'top-right' ? vis.height - h - m : m;
        const pos = placeOnVisiblePage(box, rot, vx, vy);
        page.drawImage(signatureImage, { x: pos.x, y: pos.y, width: w, height: h, rotate: degrees(pos.rotate) });
      }
      const pdfBytes = await pdfDoc.save();
      if (!pdfBytes || pdfBytes.length < 100 || String.fromCharCode(...pdfBytes.slice(0, 5)) !== '%PDF-') throw new Error('the signed PDF came out invalid');
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      setResult(URL.createObjectURL(blob));
    } catch(e) { setError('Failed to add signature: ' + e.message); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/pdf-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to PDF Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Sign PDF</h1>
        <p className="text-neutral-500 text-center mb-8">Draw and add your signature to PDF</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload a PDF file</p>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => { const f = e.target.files[0]; e.target.value = ''; setFile(f); setResult(null); setError(''); }} />
          <div>
            <label className="block text-sm text-neutral-500 mb-2">Draw your signature below:</label>
            <canvas ref={canvasRef} width={500} height={150} className="w-full border border-neutral-200 rounded-xl cursor-crosshair bg-neutral-50" data-pad
              style={{ touchAction: 'none' }} onPointerDown={startDraw} onPointerMove={draw} onPointerUp={stopDraw} onPointerLeave={stopDraw} onPointerCancel={stopDraw} />
            <button onClick={clearSignature} className="mt-2 text-sm text-neutral-500 hover:text-red-500 transition">Clear signature</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Page</span>
              <select id="sign-where" value={where} onChange={e => { setWhere(e.target.value); setResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2">
                <option value="last">Last page</option><option value="first">First page</option><option value="all">Every page</option><option value="page">Page number…</option>
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Corner</span>
              <select id="sign-corner" value={corner} onChange={e => { setCorner(e.target.value); setResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2">
                {CORNERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            {where === 'page' && <label className="block"><span className="block text-neutral-500 mb-1">Page number</span>
              <input id="sign-page" type="number" min="1" value={pageNo} onChange={e => { setPageNo(e.target.value); setResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2" /></label>}
          </div>
          <button onClick={addSignature} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Adding signature...' : 'Add Signature to PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="signed.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Signed PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Sign"
        description="PDF Sign lets you draw a signature with your mouse or finger on a canvas and stamps it — on a transparent background, cropped to what you drew, without distortion — into the corner and on the page(s) you choose (last, first, every page or a given page), as the page appears on screen, using the pdf-lib library entirely in your browser — your file is never uploaded to a server. You can only draw a signature, not type or upload an image of one, and it isn't a cryptographic digital signature — just an image placed on the page."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Draw your signature with your mouse or touchscreen in the canvas box.",
          "Choose the page and the corner, then click 'Add Signature to PDF'.",
          "Click 'Download Signed PDF' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Sign free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I type my signature or upload an image instead of drawing it?", a: "No — this tool only supports drawing a signature by hand with your mouse or touchscreen." },
          { q: "Can I choose where on the page, or which page, the signature goes?", a: "You choose the page (last, first, every page or a page number) and the corner (bottom right, bottom left, bottom centre or top right); the signature is placed 36 pt (about 1.3 cm) from the edges, at most 200 x 80 pt. Dragging it to an exact spot is not available." },
          { q: "Will the signature hide the text under it?", a: "No — only the ink is added, on a transparent background, so anything under or around the strokes stays visible." },
          { q: "Is this a legally binding digital signature?", a: "No. It's a drawn image placed on the page, not a cryptographic digital signature with identity verification, so it may not satisfy requirements for legally binding e-signatures." }
        ]}
        tips={[
          "Draw slowly on a larger screen for a cleaner signature, since the canvas captures your exact mouse movement.",
          "Click 'Clear signature' to redraw if you're not happy with the result before adding it to the PDF.",
          "Pick the corner where the page has room for the signature; the ink is transparent but it still overlaps text drawn in the same place.",
          "Since this isn't a legally binding e-signature, check whether your document requires a certified digital signature before relying on this for contracts or official use."
        ]}
      />
    </div>
  );
}