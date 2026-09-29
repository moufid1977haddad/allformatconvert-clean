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
// 30/09 (known gap of 29/09): free placement, as Smallpdf, iLovePDF and Sejda -- the page is shown and the signature is
// dragged and resized on it. The position is kept as fractions of the page as seen (left, top, width), so it lands in
// the same place on each chosen page even when their sizes differ.
const CORNERS = [['custom', 'Where I drag it on the page'], ['bottom-right', 'Bottom right'], ['bottom-left', 'Bottom left'], ['bottom-center', 'Bottom centre'], ['top-right', 'Top right']];

export default function Page() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [where, setWhere] = useState('last');
  const [pageNo, setPageNo] = useState('1');
  const [corner, setCorner] = useState('bottom-right');
  const [ink, setInk] = useState(null); // { url, w, h }: the drawn signature, cropped, shown on the page preview
  const [place, setPlace] = useState({ fx: 0.55, fy: 0.78, fw: 0.3 });
  const [preview, setPreview] = useState(null); // { url, w, h, n }: the chosen page as seen
  const canvasRef = useRef();
  const stageRef = useRef();
  const dragRef = useRef(null);
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

  // Only the drawn part of the pad, on a transparent background (null when nothing was drawn).
  const cropInk = () => {
    const pad = canvasRef.current;
    const px = pad.getContext('2d').getImageData(0, 0, pad.width, pad.height).data;
    let x0 = pad.width, y0 = pad.height, x1 = -1, y1 = -1;
    for (let y = 0; y < pad.height; y++) for (let x = 0; x < pad.width; x++) if (px[(y * pad.width + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return null;
    const c = document.createElement('canvas');
    c.width = x1 - x0 + 5; c.height = y1 - y0 + 5;
    c.getContext('2d').drawImage(pad, x0 - 2, y0 - 2, c.width, c.height, 0, 0, c.width, c.height);
    return c;
  };

  const stopDraw = () => {
    if (!drawing) return;
    setDrawing(false);
    const c = cropInk();
    if (c) c.toBlob((b) => b && setInk((old) => { if (old) URL.revokeObjectURL(old.url); return { url: URL.createObjectURL(b), w: c.width, h: c.height }; }), 'image/png');
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    inkRef.current = false;
    setInk((old) => { if (old) URL.revokeObjectURL(old.url); return null; });
  };

  // The page the signature is placed on, as the reader sees it (crop box, rotation), rendered by pdf.js.
  const previewPage = where === 'first' || where === 'all' ? 1 : where === 'page' ? Number(pageNo) : 0; // 0: last
  useEffect(() => {
    if (corner !== 'custom' || !file) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
        const doc = await pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const n = previewPage === 0 ? doc.numPages : previewPage;
        if (!Number.isInteger(n) || n < 1 || n > doc.numPages) { if (!cancelled) setPreview(null); doc.destroy(); return; }
        const pg = await doc.getPage(n);
        const base = pg.getViewport({ scale: 1 });
        // About 1200 px wide, at most 3 Mpx: sharp on a phone, far under the iOS canvas limit.
        const scale = Math.min(1200 / base.width, Math.sqrt(3e6 / (base.width * base.height)));
        const vp = pg.getViewport({ scale });
        const c = document.createElement('canvas');
        c.width = Math.round(vp.width); c.height = Math.round(vp.height);
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: g, viewport: vp }).promise;
        const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85));
        c.width = c.height = 0;
        doc.destroy();
        if (cancelled || !blob) return;
        setPreview((old) => { if (old) URL.revokeObjectURL(old.url); return { url: URL.createObjectURL(blob), w: base.width, h: base.height, n }; });
      } catch { if (!cancelled) setPreview(null); }
    })();
    return () => { cancelled = true; };
  }, [corner, file, previewPage]);

  // Height of the signature as a fraction of the page's height, for a given width fraction.
  const fhOf = (fw) => (ink && preview ? fw * (preview.w / preview.h) * (ink.h / ink.w) : 0.1);
  const clampPlace = ({ fx, fy, fw }) => {
    fw = Math.min(Math.max(fw, 0.04), 1);
    const fh = fhOf(fw);
    return { fw, fx: Math.min(Math.max(fx, 0), Math.max(0, 1 - fw)), fy: Math.min(Math.max(fy, 0), Math.max(0, 1 - fh)) };
  };
  const startMove = (e, mode) => {
    e.preventDefault(); e.stopPropagation();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, x: e.clientX, y: e.clientY, start: place };
  };
  const onMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const r = stageRef.current.getBoundingClientRect();
    const dx = (e.clientX - d.x) / r.width, dy = (e.clientY - d.y) / r.height;
    setPlace(clampPlace(d.mode === 'move' ? { ...d.start, fx: d.start.fx + dx, fy: d.start.fy + dy } : { ...d.start, fw: d.start.fw + dx }));
    setResult(null);
  };
  const endMove = () => { dragRef.current = null; };
  const onKey = (e) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv) { e.preventDefault(); setPlace((p) => clampPlace({ ...p, fx: p.fx + mv[0], fy: p.fy + mv[1] })); setResult(null); }
    else if (e.key === '+' || e.key === '=' || e.key === '-') { e.preventDefault(); setPlace((p) => clampPlace({ ...p, fw: p.fw + (e.key === '-' ? -step : step) })); setResult(null); }
  };

  const addSignature = async () => {
    if (!file) return;
    setError('');
    if (!inkRef.current) { setError('Draw your signature in the box first — an empty signature was not added.'); return; }
    setLoading(true);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const ink = cropInk();
      if (!ink) { setError('Draw your signature in the box first — an empty signature was not added.'); setLoading(false); return; }
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
        let w, h, vx, vy;
        if (corner === 'custom') {
          // Where it was dragged: same fractions of the page as seen, proportions kept.
          w = place.fw * vis.width; h = w * ink.height / ink.width;
          vx = place.fx * vis.width; vy = vis.height * (1 - place.fy) - h;
        } else {
          // At most 200 x 80 pt (and 40 % of the page's width), proportions kept, 36 pt from the edges.
          const k = Math.min(200 / ink.width, 80 / ink.height, (0.4 * vis.width) / ink.width);
          const m = 36;
          w = ink.width * k; h = ink.height * k;
          vx = corner === 'bottom-left' ? m : corner === 'bottom-center' ? (vis.width - w) / 2 : vis.width - w - m;
          vy = corner === 'top-right' ? vis.height - h - m : m;
        }
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
            <label className="block"><span className="block text-neutral-500 mb-1">Position</span>
              <select id="sign-corner" value={corner} onChange={e => { setCorner(e.target.value); setResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2">
                {CORNERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            {where === 'page' && <label className="block"><span className="block text-neutral-500 mb-1">Page number</span>
              <input id="sign-page" type="number" min="1" value={pageNo} onChange={e => { setPageNo(e.target.value); setResult(null); }} className="w-full border border-neutral-200 rounded-lg px-3 py-2" /></label>}
          </div>
          {corner === 'custom' && (
            <div className="space-y-2">
              {!file && <p className="text-sm text-neutral-500">Upload a PDF to see the page and place your signature on it.</p>}
              {file && !preview && <p className="text-sm text-neutral-500">{where === 'page' ? 'Enter a page number of the document to see it.' : 'Loading the page…'}</p>}
              {preview && (
                <>
                  <p className="text-sm text-neutral-500">{ink ? 'Drag the signature where it goes; drag the round handle to resize it (arrow keys and + / − work too).' : 'Draw your signature above: it appears on the page, ready to drag.'} Page {preview.n}{where === 'all' ? ' (same place on every page)' : ''}.</p>
                  <div ref={stageRef} data-sign-stage className="relative w-full border border-neutral-300 shadow-sm select-none" style={{ aspectRatio: `${preview.w} / ${preview.h}`, touchAction: 'none' }}>
                    <img src={preview.url} alt={`Page ${preview.n}`} className="absolute inset-0 w-full h-full" draggable={false} />
                    {ink && (
                      <div data-sign-box role="button" tabIndex={0} aria-label="Signature position: drag, or use the arrow keys" onKeyDown={onKey}
                        onPointerDown={(e) => startMove(e, 'move')} onPointerMove={onMove} onPointerUp={endMove} onPointerCancel={endMove}
                        className="absolute outline outline-2 outline-dashed outline-indigo-500 cursor-move"
                        style={{ left: `${place.fx * 100}%`, top: `${place.fy * 100}%`, width: `${place.fw * 100}%`, aspectRatio: `${ink.w} / ${ink.h}` }}>
                        <img src={ink.url} alt="Your signature" className="w-full h-full pointer-events-none" draggable={false} />
                        <span data-sign-resize aria-hidden onPointerDown={(e) => startMove(e, 'resize')} onPointerMove={onMove} onPointerUp={endMove} onPointerCancel={endMove}
                          className="absolute -right-2.5 -bottom-2.5 w-5 h-5 rounded-full bg-indigo-600 border-2 border-white cursor-nwse-resize" />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <button onClick={addSignature} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">
            {loading ? 'Adding signature...' : 'Add Signature to PDF'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {result && <a href={result} download="signed.pdf" className="block w-full text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">Download Signed PDF</a>}
        </div>
      </div>
      <SeoContent
        title="PDF Sign"
        description="PDF Sign lets you draw a signature with your mouse or finger on a canvas and stamps it — on a transparent background, cropped to what you drew, without distortion — where you drag it on the page (or into a corner you choose), on the page(s) you choose (last, first, every page or a given page), as the page appears on screen, using the pdf-lib library entirely in your browser — your file is never uploaded to a server. You can only draw a signature, not type or upload an image of one, and it isn't a cryptographic digital signature — just an image placed on the page."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Draw your signature with your mouse or touchscreen in the canvas box.",
          "Choose the page, then drag the signature where it goes on the page shown (or pick a corner), and click 'Add Signature to PDF'.",
          "Click 'Download Signed PDF' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Sign free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I type my signature or upload an image instead of drawing it?", a: "No — this tool only supports drawing a signature by hand with your mouse or touchscreen." },
          { q: "Can I choose where on the page, or which page, the signature goes?", a: "Yes. Choose the page (last, first, every page or a page number); with 'Where I drag it on the page', the page is shown and you drag the signature to the exact spot and resize it with its round handle. Or pick a corner (bottom right, bottom left, bottom centre or top right): the signature is then placed 36 pt (about 1.3 cm) from the edges, at most 200 x 80 pt." },
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