'use client';
import { useRef, useState, useSyncExternalStore } from 'react';
import { loadPdfjs } from '../lib/pdfjs';
import { reportToolError } from '../lib/reportError';
import { rasterFromCanvas, rasterFromRGBA, imageDims, decodeToRaster } from '../lib/bigImage';
import { fitScale, freeCanvas, withTimeout, StepTimeout } from '../lib/canvasLimit';
import { encodeRaster } from '../lib/imageOutput';
import { encodeExtra } from '../tools/image-tools/image-converter/extraFormats';
import { FileDownload, DownloadGroup } from './FileDownload';
import { parsePageRange } from '../lib/pageRange';
import { useToolError } from '../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
import { serverRenderAvailable, ServerPageRenderer, ServerRenderError, LOCAL_PAGE_LIMIT_MS, LOCAL_PAGE_LIMIT_LABEL, listPages } from '../lib/serverPageRender';

// PDF → images, shared by PDF to Image and PDF to JPG (P21, 02/10).
// Market (02/10): iLovePDF "PDF to JPG" offers "Page to JPG" and "Extract images", quality Normal (recommended) / High;
// CloudConvert renders pages at a chosen pixel density (DPI) and page range. Until P21 both our tools rendered every
// page at a fixed 2× scale, PNG only or JPG only, with no way to pick pages or take the pictures out of the PDF.
// Now: both modes, five formats where the tool allows it, 72 / 150 / 300 dpi, a page range. Pages are rendered in the
// browser by PDF.js; a page too large for the device's canvas at the chosen density is rendered at the largest density
// that fits, and the row says so.

export const PDF_IMAGE_FORMATS = [
  { value: 'jpg', label: 'JPG', mime: 'image/jpeg', ext: 'jpg' },
  { value: 'png', label: 'PNG (lossless)', mime: 'image/png', ext: 'png' },
  { value: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp' },
  { value: 'tiff', label: 'TIFF', mime: 'image/tiff', ext: 'tiff' },
  { value: 'bmp', label: 'BMP', mime: 'image/bmp', ext: 'bmp' },
];
const DPIS = [[150, 'Normal — 150 dpi (recommended)'], [300, 'High — 300 dpi (print)'], [72, 'Screen — 72 dpi (smallest)']];

export { parsePageRange } from '../lib/pageRange';

// P31 (03/10): no page may keep the tool busy for ever (owner's iPhone: "Page 1 of 3…" frozen). 60 s per page is far
// above the slowest page measured (a 300 dpi photo page on a phone: a few seconds).
const PAGE_TIME_LIMIT = () => (typeof window !== 'undefined' && window.__pdfPageTimeLimitMs) || 60000; // tests shorten it
const stuck = (n, total, done) => `Page ${n} of ${total} could not be finished on this device after a minute${done ? ` (the ${done} file${done > 1 ? 's' : ''} made before it ${done > 1 ? 'are' : 'is'} below)` : ''}. Try a lower resolution or fewer pages at a time, or use a computer for this PDF.`;

// P32 (04/10): on iPhone / iPad, a page the device has not drawn within LOCAL_PAGE_LIMIT_MS is drawn by our PDF service
// (app/lib/serverPageRender.js). It makes JPG, PNG and TIFF itself; WebP and BMP are encoded here from its PNG.
// the device does not change while the page is open: nothing to subscribe to (useSyncExternalStore reads it once on
// the client, false in the server render, so hydration matches)
const noSubscribe = () => () => {};

const SERVER_FORMAT = { jpg: 'jpg', png: 'png', tiff: 'tiff', webp: 'png', bmp: 'png' };

async function encode(raster, format, quality) {
  if (format === 'tiff' || format === 'bmp') return (await encodeExtra(format, raster, quality / 100)).blob;
  const f = PDF_IMAGE_FORMATS.find((x) => x.value === format);
  return encodeRaster(raster, f.mime, quality);
}

// An image object of PDF.js (decoded pixels) → RGBA.
function rgbaOf(img) {
  const { width: w, height: h, data, kind } = img;
  if (kind === 3 || data.length === w * h * 4) return new Uint8ClampedArray(data.buffer ? data : data);
  const out = new Uint8ClampedArray(w * h * 4);
  if (kind === 2 || data.length === w * h * 3) {
    for (let i = 0, j = 0; i < w * h; i++, j += 3) { out[i * 4] = data[j]; out[i * 4 + 1] = data[j + 1]; out[i * 4 + 2] = data[j + 2]; out[i * 4 + 3] = 255; }
    return out;
  }
  // kind 1: 1 bit per pixel, rows padded to a byte
  const row = (w + 7) >> 3;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = (data[y * row + (x >> 3)] >> (7 - (x & 7))) & 1 ? 255 : 0;
    const i = (y * w + x) * 4; out[i] = out[i + 1] = out[i + 2] = v; out[i + 3] = 255;
  }
  return out;
}

export default function PdfToImages({ tool, formats = PDF_IMAGE_FORMATS.map((f) => f.value), defaultFormat = 'jpg' }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('pages');
  const [format, setFormat] = useState(defaultFormat);
  const [dpi, setDpi] = useState(150);
  const [quality, setQuality] = useState(92);
  const [range, setRange] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useToolError('');
  const [notice, setNotice] = useState('');
  // read after mounting (the server render does not know the device): the notice of the P32 fallback, iPhone / iPad only
  const onAppleTouch = useSyncExternalStore(noSubscribe, serverRenderAvailable, () => false);
  const inputRef = useRef();
  const base = file ? file.name.replace(/\.pdf$/i, '') : 'document';
  const lossy = format === 'jpg' || format === 'webp';

  const pick = (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; setFile(f); setResults([]); setError(''); setNotice(''); };

  const run = async () => {
    if (!file) return;
    setBusy(true); setResults([]); setError(''); setNotice('');
    const out = [];
    const canFallBack = mode === 'pages' && serverRenderAvailable();
    const drawnByServer = [];
    let renderer = null;
    let remote = false; // once a page needed our service, the next ones go there directly
    let serverReduced = 0;
    try {
      const pdfjsLib = await loadPdfjs();
      let pdf;
      try { pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise; }
      catch (e) {
        if (e && e.name === 'PasswordException') throw new Error('This PDF is protected by a password. Remove the password with our PDF Unlock tool (you need to know it), then convert the unlocked file.');
        console.warn('[pdf-to-images] getDocument failed:', e?.name, e?.message); // the reason, for support; the visitor gets the sentence
        throw new Error('This file could not be read as a PDF. It may be damaged, or not a PDF despite its name.');
      }
      const pages = parsePageRange(range, pdf.numPages);
      const ext = PDF_IMAGE_FORMATS.find((f) => f.value === format).ext;
      let reduced = 0;
      for (const n of pages) {
        setProgress(mode === 'pages' ? `Page ${n} of ${pdf.numPages}…` : `Looking for images on page ${n}…`);
        const page = await pdf.getPage(n);
        if (mode === 'pages') {
          const unit = page.getViewport({ scale: 1 });
          if (!remote) {
            // P31: the surface is capped for the device (iPhone / iPad: 16.7 MP), one page at a time, freed at once.
            const scale = fitScale(unit.width, unit.height, dpi / 72);
            const vp = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
            console.info(`[pdf-to-images] page ${n}: canvas ${canvas.width}×${canvas.height} (${(canvas.width * canvas.height / 1e6).toFixed(1)} MP)`);
            // P32: on iPhone / iPad the device gets LOCAL_PAGE_LIMIT_MS, then our service draws the page
            const limit = canFallBack ? LOCAL_PAGE_LIMIT_MS() : PAGE_TIME_LIMIT();
            try {
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error(`Page ${n} is too large for this device to draw. Choose a lower resolution.`);
              ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); // pages are white paper
              const task = page.render({ canvasContext: ctx, viewport: vp });
              await withTimeout(task.promise, limit, stuck(n, pdf.numPages, out.length), () => task.cancel());
              const blob = await withTimeout(encode(rasterFromCanvas(canvas, canvas.width, canvas.height), format, quality), limit, stuck(n, pdf.numPages, out.length));
              if (scale < dpi / 72) reduced = Math.max(reduced, Math.round(72 * scale));
              out.push({ blob, url: URL.createObjectURL(blob), name: `${base}-page-${n}.${ext}`, note: `page ${n} · ${canvas.width}×${canvas.height}` });
            } catch (e) {
              if (!canFallBack) throw e;
              console.warn(`[pdf-to-images] page ${n} not drawn on this device (${e?.name}: ${e?.message}); our PDF service draws it`);
              remote = true;
            } finally { freeCanvas(canvas); }
          }
          if (remote) {
            setProgress(`Page ${n} of ${pdf.numPages}: drawing it on our PDF service…`);
            if (!renderer) renderer = new ServerPageRenderer(file, { onStage: (st) => { if (st.stage === 'upload') setProgress(`Sending the PDF to our PDF service… ${Math.floor(st.pct || 0)}%`); } });
            let r;
            try {
              r = await renderer.render({ page: n, dpi, format: SERVER_FORMAT[format], quality });
            } catch (e) {
              throw new ServerRenderError(`Page ${n} of ${pdf.numPages} could not be drawn on this device, and our PDF service could not draw it either: ${e.message}${out.length ? ` (the ${out.length} file${out.length > 1 ? 's' : ''} made before it ${out.length > 1 ? 'are' : 'is'} below)` : ''}`);
            }
            let blob = r.blob;
            const d = await imageDims(blob).catch(() => null);
            if (format === 'webp' || format === 'bmp') blob = await encode(await decodeToRaster(blob, d), format, quality);
            if (r.reduced) serverReduced = serverReduced ? Math.min(serverReduced, r.dpi) : r.dpi;
            drawnByServer.push(n);
            out.push({ blob, url: URL.createObjectURL(blob), name: `${base}-page-${n}.${ext}`, note: `page ${n} · ${d ? `${d.width}×${d.height}` : `${r.dpi} dpi`} · drawn by our PDF service` });
          }
        } else {
          const ops = await withTimeout(page.getOperatorList(), PAGE_TIME_LIMIT(), stuck(n, pdf.numPages, out.length));
          const seen = new Set();
          let k = 0;
          for (let i = 0; i < ops.fnArray.length; i++) {
            const fn = ops.fnArray[i];
            if (fn !== pdfjsLib.OPS.paintImageXObject && fn !== pdfjsLib.OPS.paintInlineImageXObject && fn !== pdfjsLib.OPS.paintImageXObjectRepeat) continue;
            const arg = ops.argsArray[i][0];
            const id = typeof arg === 'string' ? arg : null;
            if (id && seen.has(id)) continue;
            if (id) seen.add(id);
            const img = typeof arg === 'string'
              ? await withTimeout(new Promise((resolve) => { const objs = id.startsWith('g_') ? page.commonObjs : page.objs; objs.get(id, resolve); }), PAGE_TIME_LIMIT(), stuck(n, pdf.numPages, out.length))
              : arg;
            if (!img || img.width < 16 || img.height < 16) continue; // bullets, rules, 1-px spacers
            let raster, c = null;
            console.info(`[pdf-to-images] page ${n} image: ${img.width}×${img.height}${img.bitmap ? ' (bitmap)' : ''}`);
            if (img.bitmap) {
              c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
              c.getContext('2d').drawImage(img.bitmap, 0, 0);
              raster = rasterFromCanvas(c, c.width, c.height);
            } else raster = rasterFromRGBA(rgbaOf(img), img.width, img.height);
            let blob;
            try { blob = await withTimeout(encode(raster, format, quality), PAGE_TIME_LIMIT(), stuck(n, pdf.numPages, out.length)); } finally { freeCanvas(c); }
            k++;
            out.push({ blob, url: URL.createObjectURL(blob), name: `${base}-page-${n}-image-${k}.${ext}`, note: `page ${n} · ${img.width}×${img.height}` });
          }
        }
        page.cleanup();
      }
      const notes = [];
      if (!out.length) notes.push(mode === 'images' ? 'No pictures were found in these pages: their content is text or drawings. Choose "Pages to images" to get each page as a picture.' : 'No page was converted.');
      if (drawnByServer.length) notes.push(`This device could not draw ${drawnByServer.length > 1 ? 'pages' : 'page'} ${listPages(drawnByServer)}, so our own PDF service drew ${drawnByServer.length > 1 ? 'them' : 'it'}: your PDF was sent there, then deleted.`);
      if (reduced) notes.push(`Some pages are very large, so they were rendered at ${reduced} dpi, the most this device can draw at once.`);
      if (serverReduced) notes.push(`Some pages are very large, so our PDF service drew them at ${serverReduced} dpi.`);
      setNotice(notes.join(' '));
      setResults(out);
    } catch (e) {
      reportToolError({ tool, file, error: e });
      setError(e.message || String(e));
      // what was finished before a page that could not be done is still offered (P31)
      if ((e instanceof StepTimeout || e instanceof ServerRenderError) && out.length) setResults(out);
      if (drawnByServer.length) setNotice(`Our own PDF service drew ${drawnByServer.length > 1 ? 'pages' : 'page'} ${listPages(drawnByServer)}: your PDF was sent there, then deleted.`);
    } finally {
      if (renderer) renderer.close();
    }
    setProgress(''); setBusy(false);
  };

  const sel = 'w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 min-h-[44px]';
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition" onClick={() => inputRef.current.click()}>
        <p className="text-neutral-600">{file ? file.name : <UploadPrompt what="a PDF" />}</p>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={pick} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-neutral-600">Mode
          <select aria-label="Mode" className={sel} value={mode} onChange={(e) => setMode(e.target.value)} disabled={busy}>
            <option value="pages">Pages to images (every page as a picture)</option>
            <option value="images">Extract images (the pictures inside the PDF)</option>
          </select>
        </label>
        <label className="text-xs text-neutral-600">Format
          <select aria-label="Format" className={sel} value={format} onChange={(e) => setFormat(e.target.value)} disabled={busy}>
            {PDF_IMAGE_FORMATS.filter((f) => formats.includes(f.value)).map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        {mode === 'pages' && (
          <label className="text-xs text-neutral-600">Resolution
            <select aria-label="Resolution" className={sel} value={dpi} onChange={(e) => setDpi(Number(e.target.value))} disabled={busy}>
              {DPIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
        {lossy && (
          <label className="text-xs text-neutral-600">Quality
            <select aria-label="Quality" className={sel} value={quality} onChange={(e) => setQuality(Number(e.target.value))} disabled={busy}>
              <option value={92}>High (92)</option>
              <option value={80}>Medium (80) — smaller files</option>
            </select>
          </label>
        )}
        <label className="text-xs text-neutral-600 sm:col-span-2">Pages (leave empty for all, or e.g. 1-3, 5)
          <input aria-label="Pages" className={sel} value={range} onChange={(e) => setRange(e.target.value)} placeholder="All pages" inputMode="text" disabled={busy} />
        </label>
      </div>
      <button onClick={run} disabled={!file || busy} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white min-h-[44px]">
        {busy ? (progress || 'Converting…') : mode === 'pages' ? 'Convert pages' : 'Extract images'}
      </button>
      {onAppleTouch && mode === 'pages' && <p className="text-xs text-neutral-600 text-center" data-server-render-note>On iPhone and iPad, a page your device cannot draw within {LOCAL_PAGE_LIMIT_LABEL} is drawn by our own PDF service instead: your PDF is sent there, then deleted.</p>}
      {error && <p role="alert" data-p2i-message className="text-red-600 text-center text-sm">{error}</p>}
      {notice && <p role="status" data-p2i-message className="text-neutral-700 text-center text-sm">{notice}</p>}
      {results.length > 0 && (
        <DownloadGroup zipName={`${base}-${mode === 'pages' ? 'pages' : 'images'}.zip`} className="space-y-4">
          {results.map((r) => (
            <div key={r.name} className="space-y-2">
              {r.blob.type !== 'image/tiff' && <img src={r.url} alt={r.note} className="max-w-full max-h-96 mx-auto rounded border border-neutral-200" />}
              <FileDownload blob={r.blob} name={r.name} note={r.note} />
            </div>
          ))}
        </DownloadGroup>
      )}
    </div>
  );
}
