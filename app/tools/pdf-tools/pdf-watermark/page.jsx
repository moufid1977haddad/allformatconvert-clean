'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { openablePdfBytes } from '../../../lib/pdfDecrypt';
import { pdfFileProblem, emptyImageProblem, unreadableImageMessage } from '../../../lib/fileChecks';
import { placeOnVisiblePage, visibleSize } from '../../../lib/pdfPlace';
import { FileDownload } from '../../../components/FileDownload';

// P24 (03/10), coverage against iLovePDF's watermark (read 02/10: text or image, position grid plus mosaic,
// transparency, rotation 45/90/180/270, over or below the content, page range) — Smallpdf: text only.
// Before: text only, grey, 45°, and NOT centred (the text started at the page centre, "length × 0.3" guessed its
// width); a page displayed rotated got it in another place; any character outside Helvetica's Latin-1 (Chinese,
// Cyrillic, Arabic…) made pdf-lib throw. Now: the rotated block is centred on its point, placed as the reader sees the
// page (lib/pdfPlace.js), and a text Helvetica cannot write is drawn by the browser into a transparent image.
const POSITIONS = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
const ROTATIONS = [[0, 'None'], [45, '45°'], [90, '90°'], [180, '180°'], [270, '270°']];
const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const latin1 = (s) => /^[\x20-\x7e -ÿ]*$/.test(s);

// A text Helvetica cannot write, drawn by the browser (its own fonts cover every script) into a PNG, 4× for print.
async function textAsPng(text, sizePt, color, bold) {
  const k = 4, c = document.createElement('canvas'), ctx = c.getContext('2d');
  const font = `${bold ? 'bold ' : ''}${sizePt * k}px system-ui, "Segoe UI", "Noto Sans", sans-serif`;
  ctx.font = font;
  const m = ctx.measureText(text);
  const w = Math.ceil(m.width) + 2 * k, h = Math.ceil((m.actualBoundingBoxAscent || sizePt * k * 0.8) + (m.actualBoundingBoxDescent || sizePt * k * 0.2)) + 2 * k;
  c.width = w; c.height = h;
  ctx.font = font; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, k, k + (m.actualBoundingBoxAscent || sizePt * k * 0.8));
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/png'));
  if (!blob) throw new Error('This browser could not draw the watermark text.');
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w / k, height: h / k };
}

export default function PdfWatermarkPage() {
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [image, setImage] = useState(null);
  const [imageScale, setImageScale] = useState(40);
  const [fontSize, setFontSize] = useState(0); // 0 = automatic (a fraction of the page)
  const [color, setColor] = useState('#808080');
  const [bold, setBold] = useState(true);
  const [position, setPosition] = useState('center');
  const [mosaic, setMosaic] = useState(false);
  const [rotation, setRotation] = useState(45);
  const [opacity, setOpacity] = useState(0.3);
  const [layer, setLayer] = useState('over');
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const inputRef = useRef();
  const imageRef = useRef();

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setStatus(''); setError(''); setDownloadUrl(null);
    if (!f) return;
    const problem = await pdfFileProblem(f);
    if (problem) { setFile(null); setError(problem); return; }
    setFile(f);
  };
  const handleImage = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setError(''); setDownloadUrl(null);
    if (!f) return;
    const empty = emptyImageProblem(f);
    if (empty) { setImage(null); setError(empty); return; }
    const head = new Uint8Array(await f.slice(0, 8).arrayBuffer());
    const png = head[0] === 0x89 && head[1] === 0x50, jpg = head[0] === 0xff && head[1] === 0xd8;
    if (!png && !jpg) { setImage(null); setError(`"${f.name}": ${await unreadableImageMessage(f)} The watermark image must be a PNG or a JPG.`); return; }
    setImage({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()), png });
  };

  const addWatermark = async () => {
    if (!file) return;
    if (kind === 'text' && !text.trim()) { setError('Type the watermark text.'); return; }
    if (kind === 'image' && !image) { setError('Choose the watermark image (PNG or JPG).'); return; }
    setLoading(true); setError(''); setStatus('Adding watermark...'); setDownloadUrl(null);
    try {
      const { PDFDocument, rgb, StandardFonts, degrees, PDFArray } = await import('pdf-lib'); // loaded when used, not with the page (30/09)
      const pdfDoc = await PDFDocument.load(await openablePdfBytes(await file.arrayBuffer()), { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const total = pages.length;
      const start = Math.max(1, Math.round(Number(fromPage)) || 1);
      const end = Math.min(total, toPage === '' ? total : Math.round(Number(toPage)) || total);
      if (start > end) throw new Error(`There is no page to watermark between page ${start} and page ${end} (this PDF has ${total} page${total > 1 ? 's' : ''}).`);
      const [r, g, b] = hexToRgb(color);
      const font = kind === 'text' && latin1(text) ? await pdfDoc.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica) : null;
      let embedded = null;
      if (kind === 'image') embedded = image.png ? await pdfDoc.embedPng(image.bytes) : await pdfDoc.embedJpg(image.bytes);
      const pngCache = new Map(); // text drawn as an image, one per font size
      for (let i = start - 1; i < end; i++) {
        const page = pages[i];
        const box = page.getCropBox();
        const pageRot = page.getRotation().angle;
        const { width, height } = visibleSize(box, pageRot);
        // The block to draw, in visible points: its width and height before rotation
        let draw;
        if (kind === 'text') {
          // automatic size: one large stamp, or a smaller text that repeats in a mosaic
          const size = fontSize > 0 ? fontSize : Math.max(mosaic ? 10 : 12, Math.min(width, height) / (mosaic ? 20 : 9));
          if (font) {
            draw = { w: font.widthOfTextAtSize(text, size), h: font.heightAtSize(size, { descender: false }), text, size };
          } else {
            if (!pngCache.has(size)) { const p = await textAsPng(text, size, color, bold); pngCache.set(size, { img: await pdfDoc.embedPng(p.bytes), w: p.width, h: p.height }); }
            const c = pngCache.get(size); draw = { w: c.w, h: c.h, img: c.img };
          }
        } else {
          const w = width * (mosaic ? Math.min(imageScale, 25) : imageScale) / 100;
          draw = { w, h: w * embedded.height / embedded.width, img: embedded };
        }
        // Centres of the block(s) in visible coordinates
        const centres = [];
        if (mosaic) {
          // rows staggered by half a step, like iLovePDF's mosaic
          const ext = rotatedExtent(draw.w, draw.h, rotation);
          const sx = ext.w + 36, sy = ext.h + 36;
          for (let row = 0, y = sy / 2; y < height + sy / 2; y += sy, row++) for (let x = (row % 2 ? sx : sx / 2); x < width + sx / 2; x += sx) centres.push([x, y]);
        } else {
          const [v, h] = position === 'center' ? ['middle', 'center'] : position.split('-');
          const m = 36, ext = rotatedExtent(draw.w, draw.h, rotation);
          const cx = h === 'left' ? m + ext.w / 2 : h === 'right' ? width - m - ext.w / 2 : width / 2;
          const cy = v === 'top' ? height - m - ext.h / 2 : v === 'bottom' ? m + ext.h / 2 : height / 2;
          centres.push([cx, cy]);
        }
        for (const [cx, cy] of centres) {
          // lower-left corner of the unrotated block, rotated about the block's centre
          const t = (rotation * Math.PI) / 180, cos = Math.cos(t), sin = Math.sin(t);
          const vx = cx - (draw.w / 2) * cos + (draw.h / 2) * sin;
          const vy = cy - (draw.w / 2) * sin - (draw.h / 2) * cos;
          const at = placeOnVisiblePage(box, pageRot, vx, vy);
          const rot = degrees(at.rotate + rotation);
          if (draw.text) page.drawText(draw.text, { x: at.x, y: at.y, size: draw.size, font, color: rgb(r, g, b), opacity, rotate: rot });
          else page.drawImage(draw.img, { x: at.x, y: at.y, width: draw.w, height: draw.h, opacity, rotate: rot });
        }
        if (layer === 'below') moveNewContentFirst(page, PDFArray);
      }
      const blob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus(`Watermarked pages ${start} to ${end}.`);
    } catch (err) {
      setStatus(''); setError(err?.message || 'The watermark could not be added.');
    }
    setLoading(false);
  };

  const input = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">PDF Watermark</h1>
        <p className="text-neutral-500 text-center mb-8">Add a text or image watermark to your PDF — position, mosaic, rotation, transparency</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a PDF here'}</p>
            <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Watermark type">
            {[['text', 'Text'], ['image', 'Image']].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={kind === id} onClick={() => setKind(id)} className={`rounded-lg py-2 text-sm font-medium transition ${kind === id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{label}</button>
            ))}
          </div>
          {kind === 'text' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <label className="block sm:col-span-2"><span className="block text-neutral-500 mb-1">Watermark text</span>
                <input id="wm-text" type="text" value={text} onChange={e => setText(e.target.value)} className={input} placeholder="CONFIDENTIAL" /></label>
              <label className="block"><span className="block text-neutral-500 mb-1">Font size: {fontSize > 0 ? `${fontSize} pt` : 'automatic'}</span>
                <input id="wm-size" aria-label="Font size" type="range" min="0" max="150" step="2" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" /></label>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-neutral-500">Colour <input id="wm-color" type="color" value={color} onChange={e => setColor(e.target.value)} /></label>
                <label className="flex items-center gap-2"><input id="wm-bold" type="checkbox" checked={bold} onChange={e => setBold(e.target.checked)} /> Bold</label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm items-end">
              <div>
                <button type="button" onClick={() => imageRef.current.click()} className="bg-neutral-100 hover:bg-neutral-200 rounded-lg px-3 py-2">{image ? 'Change image' : 'Choose image (PNG or JPG)'}</button>
                {image && <span className="ml-2 text-neutral-600 truncate">{image.name}</span>}
                <input ref={imageRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImage} />
              </div>
              <label className="block"><span className="block text-neutral-500 mb-1">Image width: {imageScale}% of the page</span>
                <input id="wm-scale" aria-label="Image width (%)" type="range" min="5" max="100" value={imageScale} onChange={e => setImageScale(Number(e.target.value))} className="w-full" /></label>
            </div>
          )}
          <div>
            <span className="block text-sm text-neutral-500 mb-2">Position</span>
            <div className="grid grid-cols-3 gap-2">
              {POSITIONS.map(pos => (
                <button key={pos} type="button" disabled={mosaic} onClick={() => setPosition(pos)} aria-pressed={position === pos} className={`py-2 rounded-lg text-xs font-semibold transition disabled:opacity-40 ${position === pos ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-100 hover:text-neutral-800'}`}>{pos}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm mt-2"><input id="wm-mosaic" type="checkbox" checked={mosaic} onChange={e => setMosaic(e.target.checked)} /> Mosaic (repeat across the whole page)</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <label className="block"><span className="block text-neutral-500 mb-1">Rotation</span>
              <select id="wm-rotation" value={rotation} onChange={e => setRotation(Number(e.target.value))} className={input}>
                {ROTATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">Layer</span>
              <select id="wm-layer" value={layer} onChange={e => setLayer(e.target.value)} className={input}>
                <option value="over">Over the content</option><option value="below">Below the content</option>
              </select></label>
            <label className="block"><span className="block text-neutral-500 mb-1">From page</span>
              <input id="wm-from" type="number" min="1" step="1" value={fromPage} onChange={e => setFromPage(e.target.value)} className={input} /></label>
            <label className="block"><span className="block text-neutral-500 mb-1">To page (empty = last)</span>
              <input id="wm-to" type="number" min="1" step="1" value={toPage} onChange={e => setToPage(e.target.value)} className={input} /></label>
          </div>
          <div>
            <label className="block text-sm text-neutral-500 mb-1">Opacity: {Math.round(opacity * 100)}%</label>
            <input aria-label="Opacity (%)" type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full" />
          </div>
          <button onClick={addWatermark} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">
            {loading ? 'Processing...' : 'Add Watermark'}
          </button>
          {status && <p role="status" className="text-center text-neutral-600 text-sm">{status}</p>}
          {error && <p role="alert" className="text-center text-red-600 text-sm">{error}</p>}
          {downloadUrl && (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
              <div className="text-green-400 text-xl font-bold mb-3">Done!</div>
              <FileDownload href={downloadUrl} name={file.name.replace(/\.pdf$/i, '') + '-watermarked.pdf'} />
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="PDF Watermark"
        description="PDF Watermark stamps a text or image watermark on your PDF using the pdf-lib library entirely in your browser — your file is never uploaded to a server. Choose the text (any language), its size, colour and weight, or a PNG/JPG logo and its width; one of nine positions or a mosaic across the page; no rotation, 45°, 90°, 180° or 270°; the opacity; over or below the page content; and which pages get it. The watermark is centred on its position and placed as you see the page, also on pages displayed rotated."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "Choose 'Text' and type the watermark text (defaults to \"CONFIDENTIAL\"), or choose 'Image' and pick a PNG or JPG.",
          "Pick a position or tick 'Mosaic', then set the rotation, the layer, the pages and the opacity slider.",
          "Click 'Add Watermark', then 'Download' to save the result."
        ]}
        faqs={[
          { q: "Is PDF Watermark free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Can I add an image watermark, like a logo?", a: "Yes — choose 'Image' and pick a PNG (transparency is kept) or a JPG, then set its width as a share of the page." },
          { q: "Can I change the watermark's color, angle, or position?", a: "Yes: nine positions or a mosaic, no rotation or 45°, 90°, 180°, 270°, any colour, and the opacity." },
          { q: "What does 'Below the content' do?", a: "The watermark is drawn first and the page's text and images over it, so it never hides them. On a scanned page (one big picture) it is then hidden by the picture: use 'Over the content' there." },
          { q: "Does it work with non-Latin text?", a: "Yes. Text the standard PDF font cannot write (Chinese, Arabic, Cyrillic, emoji…) is drawn by your browser as a transparent image at print resolution." },
          { q: "Can I watermark multiple PDFs at once?", a: "No, only one file at a time — upload and process additional files separately." }
        ]}
        tips={[
          "Lower opacity values (around 20-30%) keep the underlying content easy to read while still visibly marking the page.",
          "A mosaic is harder to crop out than a single stamp.",
          "Leave the font size on automatic: it scales to each page, so the watermark looks proportionate across different page sizes."
        ]}
      />
    </div>
  );
}

// Width and height of a w × h block once rotated by `deg` (its bounding box), to keep it inside the page margins.
function rotatedExtent(w, h, deg) {
  const t = (deg * Math.PI) / 180, c = Math.abs(Math.cos(t)), s = Math.abs(Math.sin(t));
  return { w: w * c + h * s, h: w * s + h * c };
}

// "Below the content": pdf-lib wraps the page's own content in q … Q and appends ONE new content stream per page (its
// drawings, each in q … Q). Moving that last stream to the front makes the page draw over the watermark.
function moveNewContentFirst(page, PDFArray) {
  const contents = page.node.Contents();
  if (!(contents instanceof PDFArray) || contents.size() < 2) return;
  const last = contents.get(contents.size() - 1);
  contents.remove(contents.size() - 1);
  contents.insert(0, last);
}
