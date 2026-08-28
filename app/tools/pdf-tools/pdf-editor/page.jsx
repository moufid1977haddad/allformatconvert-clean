'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import {
  MAX_PAGES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL,
  MOBILE_MAX_PAGES, MOBILE_MAX_FILE_SIZE_BYTES, MOBILE_MAX_FILE_SIZE_LABEL,
} from './config';

const THUMB_SCALE = 0.22;
const CANVAS_MAX_WIDTH = 640;
let nextId = 1;
const newId = () => nextId++;

export default function PdfEditorPage() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageMeta, setPageMeta] = useState([]); // { originalIndex, baseRotation, widthPt, heightPt, thumbUrl }
  const [order, setOrder] = useState([]); // display order: [{ originalIndex, rotationDelta }]
  const [activePos, setActivePos] = useState(0); // index into `order`
  const [selected, setSelected] = useState(new Set()); // originalIndex set, for extract

  const [tool, setTool] = useState('select'); // select | text | image | pen | highlight
  const [penColor, setPenColor] = useState([220, 38, 38]);
  const [penWidth, setPenWidth] = useState(3);
  const [highlightColor, setHighlightColor] = useState([250, 204, 21]);

  const [textItems, setTextItems] = useState([]); // { id, pageIndex(original), x, y, text, fontSize, color }
  const [imageItems, setImageItems] = useState([]); // { id, pageIndex, x, y, width, height, bytes, format, previewUrl, aspect }
  const [strokeItems, setStrokeItems] = useState([]); // { id, pageIndex, color, widthPt, points:[{x,y}] }
  const [rectItems, setRectItems] = useState([]); // { id, pageIndex, x, y, width, height, color }
  const [movingItem, setMovingItem] = useState(null); // { kind, id }

  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [lastMode, setLastMode] = useState('edit');
  const [isMobile, setIsMobile] = useState(false);

  const fileRef = useRef();
  const imageInputRef = useRef();
  const canvasRef = useRef();
  const viewportRef = useRef(null);
  const renderTaskRef = useRef(null);
  const workerRef = useRef(null);
  const drawingRef = useRef(null); // { startX, startY, points } during a pen/highlight drag

  useEffect(() => { setIsMobile(isMobileDevice()); }, []);

  const maxPages = isMobile ? MOBILE_MAX_PAGES : MAX_PAGES;
  const maxSizeBytes = isMobile ? MOBILE_MAX_FILE_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  const maxSizeLabel = isMobile ? MOBILE_MAX_FILE_SIZE_LABEL : MAX_FILE_SIZE_LABEL;

  const activeEntry = order[activePos];
  const activeMeta = activeEntry ? pageMeta[activeEntry.originalIndex] : null;

  const resetAll = () => {
    setFile(null); setPdfDoc(null); setPageMeta([]); setOrder([]); setActivePos(0);
    setSelected(new Set()); setTextItems([]); setImageItems([]); setStrokeItems([]); setRectItems([]);
    setDownloadUrl(null); setStatus(''); setError(''); setMovingItem(null);
  };

  const handleFile = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    resetAll();
    if (f.size > maxSizeBytes) {
      setError(`This file is ${(f.size / (1024 * 1024)).toFixed(0)} MB, over the ${maxSizeLabel} limit${isMobile ? ' on this device' : ''}.`);
      return;
    }
    setFile(f);
    setIsRendering(true);
    setRenderStatus('Reading PDF…');
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
      const arrayBuffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      if (pdf.numPages > maxPages) {
        setError(`This document has ${pdf.numPages.toLocaleString()} pages, over the ${maxPages.toLocaleString()}-page limit${isMobile ? ' on this device' : ''}.`);
        setIsRendering(false);
        setFile(null);
        return;
      }
      setPdfDoc(pdf);
      const meta = [];
      for (let i = 0; i < pdf.numPages; i++) {
        setRenderStatus(`Rendering previews… ${i + 1}/${pdf.numPages}`);
        const p = await pdf.getPage(i + 1);
        const baseRotation = p.rotate || 0;
        const unrotated = p.getViewport({ scale: 1, rotation: 0 });
        const thumbViewport = p.getViewport({ scale: THUMB_SCALE, rotation: baseRotation });
        const canvas = document.createElement('canvas');
        canvas.width = thumbViewport.width;
        canvas.height = thumbViewport.height;
        const ctx = canvas.getContext('2d');
        await p.render({ canvasContext: ctx, viewport: thumbViewport }).promise;
        meta.push({
          originalIndex: i,
          baseRotation,
          widthPt: unrotated.width,
          heightPt: unrotated.height,
          thumbUrl: canvas.toDataURL('image/png'),
        });
      }
      setPageMeta(meta);
      setOrder(meta.map((m) => ({ originalIndex: m.originalIndex, rotationDelta: 0 })));
      setActivePos(0);
    } catch (err) {
      setError('Failed to read PDF: ' + err.message);
      setFile(null);
    }
    setIsRendering(false);
    setRenderStatus('');
  };

  // Renders the active page (base content + every overlay belonging to it)
  // onto the single edit canvas. Re-run whenever the active page, its
  // rotation, or any overlay item changes.
  const renderActiveCanvas = useCallback(async () => {
    if (!pdfDoc || !activeEntry || !activeMeta || !canvasRef.current) return;
    const totalRotation = (activeMeta.baseRotation + activeEntry.rotationDelta) % 360;
    const pdfPage = await pdfDoc.getPage(activeMeta.originalIndex + 1);
    const unscaled = pdfPage.getViewport({ scale: 1, rotation: totalRotation });
    const scale = Math.min(CANVAS_MAX_WIDTH / unscaled.width, 1.8);
    const viewport = pdfPage.getViewport({ scale, rotation: totalRotation });
    viewportRef.current = viewport;

    const canvas = canvasRef.current;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // pdf.js refuses a second render() on the same canvas while one is
    // still in flight -- cancel any prior in-flight task first, since two
    // state changes fired close together (e.g. rotate then pick a tool)
    // would otherwise race and leave the canvas half-painted.
    if (renderTaskRef.current) renderTaskRef.current.cancel();
    const task = pdfPage.render({ canvasContext: ctx, viewport });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (err) {
      if (err?.name === 'RenderingCancelledException') return;
      throw err;
    }
    if (renderTaskRef.current !== task) return; // a newer render superseded this one
    renderTaskRef.current = null;

    const oi = activeMeta.originalIndex;
    for (const t of textItems.filter((x) => x.pageIndex === oi)) {
      const [vx, vy] = viewport.convertToViewportPoint(t.x, t.y);
      ctx.font = `${t.fontSize * scale}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = `rgb(${t.color[0]},${t.color[1]},${t.color[2]})`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(t.text, vx, vy);
    }
    for (const img of imageItems.filter((x) => x.pageIndex === oi)) {
      const [vx1, vy1] = viewport.convertToViewportPoint(img.x, img.y + img.height);
      const [vx2, vy2] = viewport.convertToViewportPoint(img.x + img.width, img.y);
      if (img._el) ctx.drawImage(img._el, vx1, vy1, vx2 - vx1, vy2 - vy1);
    }
    for (const s of strokeItems.filter((x) => x.pageIndex === oi)) {
      ctx.strokeStyle = `rgb(${s.color[0]},${s.color[1]},${s.color[2]})`;
      ctx.lineWidth = s.widthPt * scale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      s.points.forEach(([x, y], i) => {
        const [vx, vy] = viewport.convertToViewportPoint(x, y);
        if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
      });
      ctx.stroke();
    }
    for (const r of rectItems.filter((x) => x.pageIndex === oi)) {
      const [vx1, vy1] = viewport.convertToViewportPoint(r.x, r.y + r.height);
      const [vx2, vy2] = viewport.convertToViewportPoint(r.x + r.width, r.y);
      ctx.fillStyle = `rgba(${r.color[0]},${r.color[1]},${r.color[2]},0.35)`;
      ctx.fillRect(vx1, vy1, vx2 - vx1, vy2 - vy1);
    }
  }, [pdfDoc, activeEntry, activeMeta, textItems, imageItems, strokeItems, rectItems]);

  useEffect(() => { renderActiveCanvas().catch((err) => setError('Failed to render page: ' + err.message)); }, [renderActiveCanvas]);

  const canvasPointToPdf = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (clientX - rect.left) * scaleX;
    const cy = (clientY - rect.top) * scaleY;
    return viewportRef.current.convertToPdfPoint(cx, cy);
  };

  const handleCanvasClick = (e) => {
    if (!activeMeta) return;
    const [x, y] = canvasPointToPdf(e.clientX, e.clientY);
    const oi = activeMeta.originalIndex;

    if (movingItem) {
      if (movingItem.kind === 'text') setTextItems((p) => p.map((t) => (t.id === movingItem.id ? { ...t, x, y } : t)));
      if (movingItem.kind === 'image') setImageItems((p) => p.map((t) => (t.id === movingItem.id ? { ...t, x, y } : t)));
      setMovingItem(null);
      return;
    }

    if (tool === 'text') {
      setTextItems((p) => [...p, { id: newId(), pageIndex: oi, x, y, text: 'Text', fontSize: 18, color: [17, 24, 39] }]);
    } else if (tool === 'image') {
      imageInputRef.current._pendingPos = { x, y };
      imageInputRef.current.click();
    }
  };

  const handleImagePick = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f || !activeMeta) return;
    const format = /png/i.test(f.type) ? 'png' : 'jpg';
    if (!/^image\/(png|jpe?g)$/i.test(f.type)) {
      setError('Add Image only accepts PNG or JPEG files.');
      return;
    }
    const pos = imageInputRef.current._pendingPos || { x: 50, y: 700 };
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      const el = document.createElement('img');
      el.onload = () => {
        const aspect = el.naturalHeight / el.naturalWidth;
        const width = 150;
        setImageItems((p) => [...p, {
          id: newId(), pageIndex: activeMeta.originalIndex, x: pos.x, y: pos.y - width * aspect,
          width, height: width * aspect, aspect, bytes, format, _el: el,
        }]);
      };
      el.src = URL.createObjectURL(new Blob([bytes]));
    };
    reader.readAsArrayBuffer(f);
  };

  const pdfDownEvent = (e) => {
    if (tool !== 'pen' && tool !== 'highlight') return;
    const [x, y] = canvasPointToPdf(e.clientX, e.clientY);
    drawingRef.current = { start: [x, y], points: [[x, y]] };
  };
  const pdfMoveEvent = (e) => {
    if (!drawingRef.current) return;
    const [x, y] = canvasPointToPdf(e.clientX, e.clientY);
    if (tool === 'pen') {
      drawingRef.current.points.push([x, y]);
      setStrokeItems((p) => {
        const withoutLive = p.filter((s) => s.id !== 'live');
        return [...withoutLive, { id: 'live', pageIndex: activeMeta.originalIndex, color: penColor, widthPt: penWidth, points: drawingRef.current.points }];
      });
    } else if (tool === 'highlight') {
      drawingRef.current.points = [drawingRef.current.start, [x, y]];
      setRectItems((p) => {
        const withoutLive = p.filter((r) => r.id !== 'live');
        const [sx, sy] = drawingRef.current.start;
        return [...withoutLive, {
          id: 'live', pageIndex: activeMeta.originalIndex, color: highlightColor,
          x: Math.min(sx, x), y: Math.min(sy, y), width: Math.abs(x - sx), height: Math.abs(y - sy),
        }];
      });
    }
  };
  const pdfUpEvent = () => {
    if (!drawingRef.current) return;
    if (tool === 'pen') {
      setStrokeItems((p) => p.map((s) => (s.id === 'live' ? { ...s, id: newId() } : s)));
    } else if (tool === 'highlight') {
      setRectItems((p) => p.map((r) => (r.id === 'live' ? { ...r, id: newId() } : r)));
    }
    drawingRef.current = null;
  };

  const moveUp = (i) => { if (i === 0) return; setOrder((p) => { const a = [...p]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }); if (activePos === i) setActivePos(i - 1); else if (activePos === i - 1) setActivePos(i); };
  const moveDown = (i) => { setOrder((p) => { if (i === p.length - 1) return p; const a = [...p]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a; }); if (activePos === i) setActivePos(i + 1); else if (activePos === i + 1) setActivePos(i); };
  const deletePage = (i) => {
    setOrder((p) => p.filter((_, idx) => idx !== i));
    if (activePos >= i && activePos > 0) setActivePos((p) => p - 1);
  };
  const rotatePage = (i) => setOrder((p) => p.map((e, idx) => (idx === i ? { ...e, rotationDelta: (e.rotationDelta + 90) % 360 } : e)));
  const toggleSelect = (originalIndex) => setSelected((p) => { const n = new Set(p); n.has(originalIndex) ? n.delete(originalIndex) : n.add(originalIndex); return n; });

  const cancel = () => {
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }
    setLoading(false); setProgress(0); setPhase(''); setStatus('Cancelled.');
  };

  const runWorker = (payload) => {
    setLoading(true); setError(''); setProgress(0); setPhase('reading'); setDownloadUrl(null); setStatus('');
    const worker = new Worker(new URL('./pdfEditor.worker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'progress') { setProgress(msg.pct); setPhase(msg.phase); }
      else if (msg.type === 'done') {
        setProgress(100); setLoading(false); workerRef.current = null;
        setDownloadUrl(URL.createObjectURL(msg.blob));
        setStatus(`Done — ${msg.pageCount.toLocaleString()} page${msg.pageCount === 1 ? '' : 's'}.`);
      } else if (msg.type === 'limit') { setLoading(false); workerRef.current = null; setError(msg.message); }
      else if (msg.type === 'error') { setLoading(false); workerRef.current = null; setError('Error: ' + msg.message); }
    };
    worker.onerror = (err) => { setLoading(false); workerRef.current = null; setError('Error: ' + (err?.message || 'unknown worker error')); };
    worker.postMessage(payload);
  };

  const saveChanges = () => {
    if (!file || order.length === 0) return;
    const overlays = [
      ...textItems.map((t) => ({ type: 'text', ...t })),
      ...imageItems.filter((i) => i.id !== 'live').map((i) => ({ type: 'image', id: i.id, pageIndex: i.pageIndex, x: i.x, y: i.y, width: i.width, height: i.height, bytes: i.bytes, format: i.format })),
      ...strokeItems.filter((s) => s.id !== 'live').map((s) => ({ type: 'stroke', pageIndex: s.pageIndex, color: s.color, widthPt: s.widthPt, points: s.points.map(([x, y]) => ({ x, y })) })),
      ...rectItems.filter((r) => r.id !== 'live').map((r) => ({ type: 'rect', pageIndex: r.pageIndex, x: r.x, y: r.y, width: r.width, height: r.height, color: r.color })),
    ];
    setLastMode('edit');
    runWorker({ file, pageOrder: order, overlays, mode: 'edit', maxPages });
  };

  const extractSelected = () => {
    if (selected.size === 0) return;
    setLastMode('extract');
    runWorker({ file, selectedIndices: Array.from(selected).sort((a, b) => a - b), mode: 'extract', maxPages });
  };

  const outSuffix = lastMode === 'extract' ? '-extracted.pdf' : '-edited.pdf';
  const outName = file ? file.name.replace(/\.pdf$/i, outSuffix) : 'edited.pdf';
  const pageTextItems = activeMeta ? textItems.filter((t) => t.pageIndex === activeMeta.originalIndex) : [];
  const pageImageItems = activeMeta ? imageItems.filter((t) => t.pageIndex === activeMeta.originalIndex && t.id !== 'live') : [];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800 dark:text-white">PDF Editor</h1>
        <p className="text-neutral-500 text-center mb-2">Reorder, rotate, delete, and extract pages — add text, images, and annotations</p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center mb-8">
          Supports up to {maxPages.toLocaleString()} pages{isMobile ? ' on this device' : ''} (files up to {maxSizeLabel}). Everything runs in your browser — this tool cannot rewrite existing text in a PDF.
        </p>

        {!file && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6">
            <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition">
              <p className="text-neutral-500">Click to upload a PDF file</p>
            </div>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
            {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}
          </div>
        )}

        {isRendering && (
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-10 text-center text-neutral-500">{renderStatus}</div>
        )}

        {file && !isRendering && order.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
            {/* Pages panel */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-3 space-y-2 max-h-[70vh] overflow-y-auto">
              <p className="text-xs font-semibold text-neutral-500 px-1 mb-1">{order.length} page{order.length === 1 ? '' : 's'}</p>
              {order.map((entry, i) => {
                const meta = pageMeta[entry.originalIndex];
                return (
                  <div key={`${entry.originalIndex}-${i}`} className={`border rounded-lg p-2 cursor-pointer ${i === activePos ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950' : 'border-neutral-200 dark:border-neutral-700'}`} onClick={() => setActivePos(i)}>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" checked={selected.has(entry.originalIndex)} onChange={(e) => { e.stopPropagation(); toggleSelect(entry.originalIndex); }} className="mt-1" />
                      <div className="flex-1 overflow-hidden rounded border border-neutral-200 dark:border-neutral-700" style={{ aspectRatio: '1 / 1.2' }}>
                        <img src={meta.thumbUrl} alt={`Page ${entry.originalIndex + 1}`} className="w-full h-full object-contain bg-white" style={{ transform: `rotate(${entry.rotationDelta}deg)` }} />
                      </div>
                    </div>
                    <p className="text-[11px] text-center text-neutral-500 mt-1">Page {entry.originalIndex + 1}</p>
                    <div className="flex justify-center gap-1 mt-1">
                      <button onClick={(e) => { e.stopPropagation(); moveUp(i); }} className="text-xs px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">↑</button>
                      <button onClick={(e) => { e.stopPropagation(); moveDown(i); }} className="text-xs px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">↓</button>
                      <button onClick={(e) => { e.stopPropagation(); rotatePage(i); }} className="text-xs px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded">⟳</button>
                      <button onClick={(e) => { e.stopPropagation(); deletePage(i); }} className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-950 text-red-600 rounded">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit canvas */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {['select', 'text', 'image', 'pen', 'highlight'].map((t) => (
                  <button key={t} onClick={() => { setTool(t); setMovingItem(null); }} className={`text-sm px-3 py-1.5 rounded-lg font-medium capitalize transition ${tool === t ? 'bg-indigo-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}>{t}</button>
                ))}
                {tool === 'pen' && (
                  <>
                    <input type="color" value={`#${penColor.map((c) => c.toString(16).padStart(2, '0')).join('')}`} onChange={(e) => setPenColor([1, 3, 5].map((i) => parseInt(e.target.value.slice(i, i + 2), 16)))} className="w-8 h-8 rounded" />
                    <input type="range" min="1" max="10" value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value))} className="w-24" />
                  </>
                )}
                {tool === 'highlight' && (
                  <input type="color" value={`#${highlightColor.map((c) => c.toString(16).padStart(2, '0')).join('')}`} onChange={(e) => setHighlightColor([1, 3, 5].map((i) => parseInt(e.target.value.slice(i, i + 2), 16)))} className="w-8 h-8 rounded" />
                )}
                {movingItem && <span className="text-xs text-indigo-600 self-center">Click the page to place it there…</span>}
              </div>

              <div className="flex justify-center bg-neutral-50 dark:bg-neutral-950 rounded-lg p-2 overflow-auto">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onPointerDown={pdfDownEvent}
                  onPointerMove={pdfMoveEvent}
                  onPointerUp={pdfUpEvent}
                  onPointerLeave={pdfUpEvent}
                  className="border border-neutral-200 dark:border-neutral-700 rounded max-w-full"
                  style={{ cursor: tool === 'select' ? 'default' : 'crosshair', touchAction: 'none' }}
                />
              </div>
              <input ref={imageInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImagePick} />

              {(pageTextItems.length > 0 || pageImageItems.length > 0) && (
                <div className="space-y-2 border-t border-neutral-200 dark:border-neutral-700 pt-3">
                  {pageTextItems.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <input value={t.text} onChange={(e) => setTextItems((p) => p.map((x) => (x.id === t.id ? { ...x, text: e.target.value } : x)))} className="flex-1 text-sm border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded px-2 py-1" />
                      <input type="number" min="6" max="72" value={t.fontSize} onChange={(e) => setTextItems((p) => p.map((x) => (x.id === t.id ? { ...x, fontSize: Number(e.target.value) } : x)))} className="w-16 text-sm border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded px-2 py-1" />
                      <input type="color" value={`#${t.color.map((c) => c.toString(16).padStart(2, '0')).join('')}`} onChange={(e) => setTextItems((p) => p.map((x) => (x.id === t.id ? { ...x, color: [1, 3, 5].map((i) => parseInt(e.target.value.slice(i, i + 2), 16)) } : x)))} className="w-8 h-8 rounded" />
                      <button onClick={() => setMovingItem({ kind: 'text', id: t.id })} className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">Move</button>
                      <button onClick={() => setTextItems((p) => p.filter((x) => x.id !== t.id))} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-950 text-red-600 rounded">✕</button>
                    </div>
                  ))}
                  {pageImageItems.map((img) => (
                    <div key={img.id} className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 flex-1">Image</span>
                      <label className="text-xs text-neutral-500">Width</label>
                      <input type="number" min="20" max="1000" value={Math.round(img.width)} onChange={(e) => { const w = Number(e.target.value); setImageItems((p) => p.map((x) => (x.id === img.id ? { ...x, width: w, height: w * x.aspect } : x))); }} className="w-20 text-sm border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded px-2 py-1" />
                      <button onClick={() => setMovingItem({ kind: 'image', id: img.id })} className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded">Move</button>
                      <button onClick={() => setImageItems((p) => p.filter((x) => x.id !== img.id))} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-950 text-red-600 rounded">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {(strokeItems.some((s) => s.pageIndex === activeMeta?.originalIndex && s.id !== 'live') || rectItems.some((r) => r.pageIndex === activeMeta?.originalIndex && r.id !== 'live')) && (
                <button
                  onClick={() => {
                    setStrokeItems((p) => p.filter((s) => s.pageIndex !== activeMeta.originalIndex));
                    setRectItems((p) => p.filter((r) => r.pageIndex !== activeMeta.originalIndex));
                  }}
                  className="text-xs px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded"
                >
                  Clear annotations on this page
                </button>
              )}

              {error && <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>}

              {loading ? (
                <div className="space-y-3">
                  <ProgressBar pct={progress} label={phase === 'saving' ? 'Saving PDF…' : phase === 'building' ? 'Applying edits…' : phase === 'loading' ? 'Loading…' : 'Reading file…'} />
                  <button onClick={cancel} className="w-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-xl py-3 font-semibold transition">Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveChanges} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold transition">Save Changes</button>
                  <button onClick={extractSelected} disabled={selected.size === 0} className="flex-1 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-gray-500 text-white rounded-xl py-3 font-semibold transition">
                    Extract Selected ({selected.size})
                  </button>
                </div>
              )}
              {status && !loading && <p className="text-center text-green-600 dark:text-green-400 text-sm">{status}</p>}
              {downloadUrl && !loading && (
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
                  <div className="text-green-500 text-xl font-bold mb-3">Done!</div>
                  <a href={downloadUrl} download={outName} className="inline-block bg-green-600 hover:bg-green-500 text-white rounded-xl px-6 py-2 font-semibold transition">Download</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <SeoContent
        title="PDF Editor"
        description="PDF Editor lets you organize a PDF's pages (reorder, delete, rotate, and extract a subset into a new file), and add new text, images, and freehand or highlight annotations on top of any page — entirely in your browser using pdf-lib and PDF.js, in a background Web Worker. It does not, and cannot cleanly, rewrite or edit existing text already in the PDF: browsers have no reliable way to parse a PDF's content stream back into editable text and reflow it, so this tool only adds new content on top rather than pretending to change what's already there. For that, edit the original source document (Word, Google Docs, etc.) and re-export to PDF."
        howTo={[
          "Click the upload area and select a PDF file from your device.",
          "In the pages panel, reorder pages with the arrows, rotate with ⟳, delete with ✕, or check pages to extract separately.",
          "Select a tool (Text, Image, Pen, or Highlight) and click or drag on the page preview to add it — edit text, size, and color in the list below the canvas.",
          "Click 'Save Changes' to build the edited PDF, or check pages and click 'Extract Selected' to pull them into their own file.",
          "Click 'Download' once processing finishes."
        ]}
        faqs={[
          { q: "Is PDF Editor free to use?", a: "Yes, completely free with no signup required." },
          { q: "Can I edit or rewrite text that's already in the PDF?", a: "No. This tool can only add new text, images, and annotations on top of a page — it cannot parse and rewrite a PDF's existing text content. No browser-based tool can do this cleanly, since PDF text is stored as positioned drawing operations, not editable paragraphs." },
          { q: "Is my file uploaded to a server?", a: "No. Everything — reading, editing, and saving — happens locally in your browser in a background Web Worker; your PDF is never uploaded anywhere." },
          { q: `How large a PDF can I edit?`, a: `Up to ${MAX_PAGES.toLocaleString()} pages and ${MAX_FILE_SIZE_LABEL} on desktop (${MOBILE_MAX_PAGES.toLocaleString()} pages / ${MOBILE_MAX_FILE_SIZE_LABEL} on phones and tablets) — measured limits to keep editing reliable in a browser tab.` },
          { q: "What image formats can I add?", a: "PNG and JPEG. Other formats aren't supported by the underlying PDF library." },
          { q: "Can I undo a specific text, image, or annotation after adding it?", a: "Yes, each item has its own remove (✕) button, and annotations can be cleared per page. There's no undo history beyond that." },
        ]}
        tips={[
          "Reordering, rotating, and deleting pages only affects the 'Save Changes' output — 'Extract Selected' always pulls pages from the original document.",
          "Freehand pen strokes are drawn as connected straight-line segments between your pointer's sampled positions, not smoothed curves — for straight lines or boxes, use the Highlight tool instead.",
          "Placed text, images, and annotations are tied to a specific page and travel with it if you reorder pages, but not if you delete that page.",
          "For a quick single-purpose edit — just merging, splitting, watermarking, or numbering pages — the dedicated PDF tools for those tasks are faster than this full editor."
        ]}
      />
    </div>
  );
}
