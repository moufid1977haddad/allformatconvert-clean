'use client';
import { useRef, useState } from 'react';
import { loadPdfjs } from '../lib/pdfjs';
import { reportToolError } from '../lib/reportError';
import { rasterFromCanvas, rasterFromRGBA, CANVAS_MAX_PIXELS } from '../lib/bigImage';
import { encodeRaster } from '../lib/imageOutput';
import { encodeExtra } from '../tools/image-tools/image-converter/extraFormats';
import { FileDownload, DownloadGroup } from './FileDownload';
import { parsePageRange } from '../lib/pageRange';
import { useToolError } from '../lib/useToolError';

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
  const inputRef = useRef();
  const base = file ? file.name.replace(/\.pdf$/i, '') : 'document';
  const lossy = format === 'jpg' || format === 'webp';

  const pick = (e) => { const f = e.target.files[0]; e.target.value = ''; if (!f) return; setFile(f); setResults([]); setError(''); setNotice(''); };

  const run = async () => {
    if (!file) return;
    setBusy(true); setResults([]); setError(''); setNotice('');
    const out = [];
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
          let scale = dpi / 72;
          const fit = Math.sqrt(CANVAS_MAX_PIXELS / (unit.width * unit.height)) * 0.99;
          if (scale > fit) { scale = fit; reduced = Math.max(reduced, Math.round(72 * fit)); }
          const vp = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); // pages are white paper
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const blob = await encode(rasterFromCanvas(canvas, canvas.width, canvas.height), format, quality);
          out.push({ blob, url: URL.createObjectURL(blob), name: `${base}-page-${n}.${ext}`, note: `page ${n} · ${canvas.width}×${canvas.height}` });
          canvas.width = 1;
        } else {
          const ops = await page.getOperatorList();
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
              ? await new Promise((resolve) => { const objs = id.startsWith('g_') ? page.commonObjs : page.objs; objs.get(id, resolve); })
              : arg;
            if (!img || img.width < 16 || img.height < 16) continue; // bullets, rules, 1-px spacers
            let raster;
            if (img.bitmap) {
              const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
              c.getContext('2d').drawImage(img.bitmap, 0, 0);
              raster = rasterFromCanvas(c, c.width, c.height);
            } else raster = rasterFromRGBA(rgbaOf(img), img.width, img.height);
            const blob = await encode(raster, format, quality);
            k++;
            out.push({ blob, url: URL.createObjectURL(blob), name: `${base}-page-${n}-image-${k}.${ext}`, note: `page ${n} · ${img.width}×${img.height}` });
          }
        }
        page.cleanup();
      }
      if (!out.length) setNotice(mode === 'images' ? 'No pictures were found in these pages: their content is text or drawings. Choose "Pages to images" to get each page as a picture.' : 'No page was converted.');
      else if (reduced) setNotice(`Some pages are very large, so they were rendered at ${reduced} dpi, the most this device can draw at once.`);
      setResults(out);
    } catch (e) {
      reportToolError({ tool, file, error: e });
      setError(e.message || String(e));
    }
    setProgress(''); setBusy(false);
  };

  const sel = 'w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-800 min-h-[44px]';
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition" onClick={() => inputRef.current.click()}>
        <p className="text-neutral-600">{file ? file.name : 'Click or drop a PDF here'}</p>
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
