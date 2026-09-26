'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { GROUPS, ALL, byId, IS_2D } from './symbologies';
import { MAX_BATCH } from './config';
import { physical, renderCanvas, contrastError, normalizeRead, cleanError, autoQuietZone, onWhite, readError, fileBytes } from './render';

// References read on 26/09/2026 (docs/audit/RAPPORT-amelioration-14.md): TEC-IT (100+ types, drawn on its server,
// 10 free codes, non-commercial use only, SVG for subscribers), barcode-maker.com (~35 types, PNG/JPG/GIF/SVG, batch
// to ZIP) and barqode.io (SVG/EPS/PDF/PNG/JPG); the last two draw with bwip-js in the browser, as this page does.
// What they do not do and this page does: every code is read back by an independent decoder (zxing-cpp) before it
// is offered, and sizes are physical (module width in mm/mil at a resolution, written into the PNG/JPG).

const FORMATS = [
  { id: 'png', label: 'PNG', mime: 'image/png' }, { id: 'svg', label: 'SVG', mime: 'image/svg+xml' },
  { id: 'pdf', label: 'PDF', mime: 'application/pdf' }, { id: 'eps', label: 'EPS', mime: 'application/postscript' },
  { id: 'jpg', label: 'JPG', mime: 'image/jpeg' }, { id: 'gif', label: 'GIF', mime: 'image/gif' },
];
const MSI_CHECKS = [['mod10', 'Mod 10'], ['mod1010', 'Mod 10 + Mod 10'], ['mod11', 'Mod 11'], ['mod1110', 'Mod 11 + Mod 10'], ['none', 'None']];
const ROTATIONS = [['N', '0°'], ['R', '90°'], ['I', '180°'], ['L', '270°']];
const safeName = (s) => s.replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'barcode';

export default function BarcodeGeneratorPage() {
  const [bcid, setBcid] = useState('code128');
  const sym = byId(bcid);
  const [mode, setMode] = useState('single'); // single | batch
  const [text, setText] = useState('');
  const [ui, setUi] = useState({
    unit: 'mm', module: 0.33, dpi: 300, height: 15, textPt: 10, showText: true, barColor: '#000000', bgColor: '#FFFFFF',
    transparent: false, textColor: '#000000', rotate: 'N', quiet: '', checkDigit: false, msiCheck: 'mod10', qrEc: 'M',
    dmShape: 'square', pdfColumns: '', pdfEc: '', aztecEc: 23,
  });
  const [out, setOut] = useState(null); // single: { urls, read, size, name }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // batch
  const [source, setSource] = useState('list'); // list | sequence
  const [lines, setLines] = useState('');
  const [seq, setSeq] = useState({ prefix: '', start: 1, count: 100, step: 1, pad: 6, suffix: '' });
  const [batchFormat, setBatchFormat] = useState('png');
  const [progress, setProgress] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const canvasRef = useRef(null);
  const workerRef = useRef(null);
  const cancelRef = useRef(false);
  const poolRef = useRef(null);

  useEffect(() => () => { workerRef.current?.terminate(); poolRef.current?.forEach((w) => w.terminate()); }, []);
  useEffect(() => { setOut(null); setError(''); }, [bcid, text, ui]);
  useEffect(() => { setBatchResult(null); }, [bcid, ui, lines, seq, batchFormat, source]);
  const set = (k) => (e) => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setUi((u) => ({ ...u, [k]: v })); };
  const setUnit = (e) => {
    const unit = e.target.value;
    setUi((u) => {
      if (unit === u.unit) return u;
      const p = physical(u);
      const module = unit === 'mm' ? +p.xMm.toFixed(3) : unit === 'mil' ? +(p.xMm / 0.0254).toFixed(1) : Math.max(1, Math.round((p.xMm * 96) / 25.4));
      const height = unit === 'px' ? Math.round((p.heightMm * 96) / 25.4) : +p.heightMm.toFixed(1);
      return { ...u, unit, module, height };
    });
  };

  const readBack = (canvas, format) => new Promise((resolve) => {
    workerRef.current ??= new Worker(new URL('./read.worker.js', import.meta.url), { type: 'module' });
    const id = Math.random();
    const w = workerRef.current;
    const onMsg = ({ data }) => { if (data.id !== id) return; w.removeEventListener('message', onMsg); resolve(data); };
    w.addEventListener('message', onMsg);
    const image = onWhite(canvas);
    w.postMessage({ id, image, format }, [image.data.buffer]);
  });

  // Draws one code and reads it back. Returns { canvas, read: { ok, text, skipped } } or throws with a visitor message.
  const makeOne = async (value, canvas) => {
    try { await renderCanvas(sym, value, ui, canvas); } catch (e) { throw new Error(cleanError(e)); }
    if (!sym.zxing) return { read: { skipped: true } };
    const r = await readBack(canvas, sym.zxing);
    if (!r.ok) throw new Error('The check reader failed to start: ' + r.error);
    const err = readError(sym, value, ui, r.text);
    if (err) throw new Error(err);
    return { read: { ok: true, text: normalizeRead(sym, r.text) } };
  };

  const files = async (value, canvas, formats) => {
    const outp = {};
    for (const f of formats) outp[f] = await fileBytes(sym, value, ui, canvas, f);
    return outp;
  };

  const generate = async () => {
    const value = text.trim();
    if (!value) { setError('Type the value to encode (or use the example).'); return; }
    const ce = contrastError(ui.barColor, ui.bgColor, ui.transparent);
    if (ce) { setError(ce); return; }
    setBusy(true); setError(''); setOut(null);
    try {
      const canvas = canvasRef.current;
      const { read } = await makeOne(value, canvas);
      const f = await files(value, canvas, FORMATS.map((x) => x.id));
      const urls = Object.fromEntries(FORMATS.map((x) => [x.id, URL.createObjectURL(new Blob([f[x.id]], { type: x.mime }))]));
      const p = physical(ui);
      setOut({ urls, read, name: `${safeName(sym.label.split(' ')[0])}-${safeName(value)}`, w: canvas.width, h: canvas.height, p });
    } catch (e) { setError(e.message || 'The barcode could not be created.'); }
    setBusy(false);
  };

  const batchValues = () => {
    if (source === 'list') return lines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const n = Math.max(0, Math.floor(Number(seq.count) || 0)); const out = [];
    for (let i = 0; i < n; i++) out.push(`${seq.prefix}${String(Number(seq.start) + i * Number(seq.step)).padStart(Number(seq.pad) || 0, '0')}${seq.suffix}`);
    return out;
  };

  // Several Workers, each drawing, reading back and encoding whole codes (batch.worker.js); results land at their
  // index, so the ZIP keeps the list's order. Rejects with 'fallback' if a Worker cannot draw (no OffscreenCanvas).
  const inWorkers = (values, results, tick) => new Promise((resolve, reject) => {
    const n = Math.min(4, Math.max(1, (navigator.hardwareConcurrency || 2) - 1));
    poolRef.current ??= Array.from({ length: n }, () => new Worker(new URL('./batch.worker.js', import.meta.url), { type: 'module' }));
    const pool = poolRef.current; const plainUi = { ...ui };
    let next = 0; let done = 0; let over = false;
    const stop = (err) => { if (over) return; over = true; if (err) { pool.forEach((w) => w.terminate()); poolRef.current = null; reject(err); } else resolve(); };
    const feed = (w) => {
      if (over) return;
      if (cancelRef.current) { pool.forEach((x) => x.terminate()); poolRef.current = null; stop(); return; }
      if (next >= values.length) { if (done === values.length) stop(); return; }
      const i = next++;
      w.onmessage = ({ data }) => {
        if (data.fatal) { stop(new Error('fallback')); return; }
        results[i] = data.error ? { error: data.error } : { bytes: data.bytes, skipped: data.skipped };
        tick(++done); feed(w);
      };
      w.onerror = () => stop(new Error('fallback'));
      w.postMessage({ id: i, bcid, value: values[i], ui: plainUi, format: batchFormat });
    };
    pool.forEach(feed);
  });

  const runBatch = async () => {
    const values = batchValues();
    if (!values.length) { setError(source === 'list' ? 'Type one value per line.' : 'Set how many codes to make.'); return; }
    if (values.length > MAX_BATCH) { setError(`That is ${values.length} codes: one ZIP holds up to ${MAX_BATCH}. Split the list.`); return; }
    const ce = contrastError(ui.barColor, ui.bgColor, ui.transparent);
    if (ce) { setError(ce); return; }
    setBusy(true); setError(''); setBatchResult(null); cancelRef.current = false;
    const t0 = performance.now();
    const pad = String(values.length).length;
    const results = new Array(values.length); // { bytes, skipped } | { error }
    let shown = 0;
    const tick = (done) => { const now = performance.now(); if (done === values.length || now - shown > 100) { shown = now; setProgress({ pct: (done / values.length) * 100, label: `${done} of ${values.length} codes made and checked` }); } };
    try {
      let workers = typeof OffscreenCanvas !== 'undefined';
      if (workers) {
        try { await inWorkers(values, results, tick); } catch (e) { if (e.message !== 'fallback') throw e; workers = false; }
      }
      if (!workers) { // no OffscreenCanvas (older Safari): one at a time on the page
        const canvas = document.createElement('canvas'); let done = results.filter(Boolean).length;
        for (let i = 0; i < values.length; i++) {
          if (results[i]) continue;
          if (cancelRef.current) break;
          try { const { read } = await makeOne(values[i], canvas); results[i] = { bytes: (await files(values[i], canvas, [batchFormat]))[batchFormat], skipped: !!read.skipped }; } catch (e) { results[i] = { error: e.message }; }
          tick(++done); if (done % 10 === 0) await new Promise((r) => setTimeout(r, 0));
        }
      }
      if (cancelRef.current) { setError('Cancelled.'); return; }
      const failed = []; const entries = []; let skipped = 0;
      results.forEach((r, i) => {
        if (r.error) { failed.push(`line ${i + 1}: ${values[i]} — ${r.error}`); return; }
        if (r.skipped) skipped++;
        entries.push({ name: `${String(i + 1).padStart(pad, '0')}-${safeName(values[i])}.${batchFormat}`, input: r.bytes });
      });
      if (failed.length) entries.push({ name: 'errors.txt', input: failed.join('\n') + '\n' });
      const { downloadZip } = await import('client-zip');
      const blob = await downloadZip(entries).blob();
      const url = URL.createObjectURL(blob);
      const name = `barcodes-${safeName(sym.label.split(' ')[0])}-${values.length}.zip`;
      const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
      setBatchResult({ ok: entries.length - (failed.length ? 1 : 0), failed, skipped, secs: (performance.now() - t0) / 1000, name, url });
    } catch (e) { setError('The ZIP could not be made: ' + (e.message || e)); }
    finally { setBusy(false); setProgress(null); }
  };

  const input = 'w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2';
  const twoD = IS_2D(sym);
  const p = physical(ui);
  const unitLabel = ui.unit === 'px' ? 'px' : ui.unit;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">Barcode Generator</h1>
        <p className="text-neutral-500 text-center mb-8">{ALL.length} barcode types — linear, EAN/UPC/ISBN, GS1 DataBar, Data Matrix, PDF417, Aztec and more. Print sizes in mm, PNG, SVG, PDF, EPS, JPG or GIF, one code or thousands. Every code is scanned back before you download it.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mode">
            {[['single', 'One barcode'], ['batch', 'Many (ZIP)']].map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)}
                className={`rounded-lg py-2 text-sm font-medium transition ${mode === id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{label}</button>
            ))}
          </div>
          <div>
            <label htmlFor="bc-type" className="block text-sm text-neutral-500 mb-1">Barcode type</label>
            <select id="bc-type" value={bcid} onChange={(e) => setBcid(e.target.value)} className={input + ' p-3'}>
              {GROUPS.map((g) => <optgroup key={g.name} label={g.name}>{g.items.map((s) => <option key={s.bcid} value={s.bcid}>{s.label}</option>)}</optgroup>)}
            </select>
            <p className="text-xs text-neutral-500 mt-1">{sym.hint}</p>
          </div>

          {mode === 'single' ? (
            <div>
              <label htmlFor="bc-text" className="block text-sm text-neutral-500 mb-1">Value</label>
              <input id="bc-text" type="text" value={text} onChange={(e) => setText(e.target.value)} className={input + ' p-3'} placeholder={sym.sample} />
              <button type="button" onClick={() => setText(sym.sample)} className="text-xs text-indigo-600 mt-1">Use the example ({sym.sample})</button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2"><input type="radio" name="bc-src" checked={source === 'list'} onChange={() => setSource('list')} /> A list (one value per line)</label>
                <label className="flex items-center gap-2"><input type="radio" name="bc-src" checked={source === 'sequence'} onChange={() => setSource('sequence')} /> A numbered series</label>
              </div>
              {source === 'list' ? (
                <textarea id="bc-lines" value={lines} onChange={(e) => setLines(e.target.value)} placeholder={`${sym.sample}\n…`} className={input + ' h-40 font-mono text-sm'} aria-label="Values, one per line" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {[['prefix', 'Prefix', 'text'], ['start', 'First number', 'number'], ['count', 'How many', 'number'], ['step', 'Step', 'number'], ['pad', 'Digits (zero-padded)', 'number'], ['suffix', 'Suffix', 'text']].map(([k, label, type]) => (
                    <label key={k} className="block"><span className="block text-neutral-500 mb-1">{label}</span><input id={`bc-seq-${k}`} type={type} value={seq[k]} onChange={(e) => setSeq((s) => ({ ...s, [k]: e.target.value }))} className={input} /></label>
                  ))}
                  <p className="col-span-full text-xs text-neutral-500">First: <code>{batchValues()[0] ?? '—'}</code> · last: <code>{batchValues().at(-1) ?? '—'}</code></p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <label htmlFor="bc-batch-format" className="text-neutral-500">File format</label>
                <select id="bc-batch-format" value={batchFormat} onChange={(e) => setBatchFormat(e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-lg p-2">
                  {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <span className="text-xs text-neutral-500">up to {MAX_BATCH.toLocaleString('en-US')} codes per ZIP</span>
              </div>
            </div>
          )}

          <details className="border border-neutral-200 rounded-lg p-3" open>
            <summary className="cursor-pointer text-sm font-semibold text-neutral-700">Size</summary>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-sm">
              <label className="block"><span className="block text-neutral-500 mb-1">Units</span>
                <select id="bc-unit" value={ui.unit} onChange={setUnit} className={input}><option value="mm">Millimetres (print)</option><option value="mil">Mils (print)</option><option value="px">Pixels (screen)</option></select></label>
              <label className="block"><span className="block text-neutral-500 mb-1">Module width ({unitLabel})</span>
                <input id="bc-module" type="number" min="0" step={ui.unit === 'px' ? 1 : ui.unit === 'mil' ? 0.5 : 0.01} value={ui.module} onChange={set('module')} className={input} /></label>
              {ui.unit !== 'px' && <label className="block"><span className="block text-neutral-500 mb-1">Resolution (dpi)</span>
                <input id="bc-dpi" type="number" min="72" max="2400" step="1" value={ui.dpi} onChange={set('dpi')} className={input} /></label>}
              {!twoD && <label className="block"><span className="block text-neutral-500 mb-1">Bar height ({ui.unit === 'px' ? 'px' : 'mm'})</span>
                <input id="bc-height" type="number" min="1" step={ui.unit === 'px' ? 1 : 0.5} value={ui.height} onChange={set('height')} className={input} /></label>}
              <label className="block"><span className="block text-neutral-500 mb-1">Quiet zone (modules)</span>
                <input id="bc-quiet" type="number" min="0" max="50" value={ui.quiet} onChange={set('quiet')} placeholder={`auto (${autoQuietZone(sym)})`} className={input} /></label>
              <label className="block"><span className="block text-neutral-500 mb-1">Rotation</span>
                <select id="bc-rotate" value={ui.rotate} onChange={set('rotate')} className={input}>{ROTATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
              <p className="col-span-full text-xs text-neutral-500">
                {ui.unit === 'px'
                  ? `Each module is ${p.pxPerModule} px.`
                  : `PNG/JPG/GIF: ${p.pxPerModule} px per module at ${p.dpi} dpi, so the module is ${p.rasterXmm.toFixed(3)} mm${Math.abs(p.rasterXmm - p.xMm) > 0.0005 ? ` (the closest whole number of pixels to ${p.xMm.toFixed(3)} mm)` : ''}. SVG/PDF/EPS: exactly ${p.xMm.toFixed(3)} mm.`}
              </p>
              {ui.unit !== 'px' && Math.abs(p.rasterXmm - p.xMm) > 0.0005 && (
                // Measured: a 0.33 mm DataBar Expanded printed by a 300-dot device (Ghostscript, no smoothing) gets modules
                // of 3, 4 or 5 dots and no longer scans; at a whole number of dots (0.339 mm = 4 dots) it does.
                <p className="col-span-full text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">Printing on a {p.dpi} dpi printer? Bars print evenly only when the module is a whole number of printer dots; {p.xMm.toFixed(3)} mm is {((p.xMm * p.dpi) / 25.4).toFixed(2)} dots. <button type="button" id="bc-snap" onClick={() => setUi((u) => ({ ...u, module: ui.unit === 'mil' ? +(p.rasterXmm / 0.0254).toFixed(2) : +p.rasterXmm.toFixed(4) }))} className="text-indigo-700 underline">Use {ui.unit === 'mil' ? `${(p.rasterXmm / 0.0254).toFixed(2)} mil` : `${p.rasterXmm.toFixed(3)} mm`} ({p.pxPerModule} dots)</button></p>
              )}
            </div>
          </details>

          <details className="border border-neutral-200 rounded-lg p-3">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-700">Text and colours{sym.checkOption || sym.msi || sym.twoD ? ' · options for this type' : ''}</summary>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
              {!twoD && <label className="flex items-center gap-2"><input id="bc-show-text" type="checkbox" checked={ui.showText} onChange={set('showText')} /> Show the value under the bars</label>}
              {!twoD && ui.showText && <label className="flex items-center justify-between gap-2">Text size (pt) <input id="bc-text-pt" type="number" min="4" max="36" value={ui.textPt} onChange={set('textPt')} className="w-20 bg-neutral-50 border border-neutral-200 rounded-lg p-1" /></label>}
              <label className="flex items-center justify-between gap-2">Bar colour <input id="bc-bar-color" type="color" value={ui.barColor} onChange={set('barColor')} aria-label="Bar colour" /></label>
              <label className="flex items-center justify-between gap-2">Background <input id="bc-bg-color" type="color" value={ui.bgColor} onChange={set('bgColor')} disabled={ui.transparent} aria-label="Background colour" /></label>
              {!twoD && ui.showText && <label className="flex items-center justify-between gap-2">Text colour <input id="bc-text-color" type="color" value={ui.textColor} onChange={set('textColor')} aria-label="Text colour" /></label>}
              <label className="flex items-center gap-2"><input id="bc-transparent" type="checkbox" checked={ui.transparent} onChange={set('transparent')} /> Transparent background (PNG, GIF, SVG, PDF, EPS)</label>
              {sym.checkOption && <label className="flex items-center gap-2"><input id="bc-check" type="checkbox" checked={ui.checkDigit} onChange={set('checkDigit')} /> Add the optional check digit</label>}
              {sym.msi && <label className="block"><span className="block text-neutral-500 mb-1">Check digit scheme</span><select id="bc-msi" value={ui.msiCheck} onChange={set('msiCheck')} className={input}>{MSI_CHECKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>}
              {sym.twoD === 'qr' && <label className="block"><span className="block text-neutral-500 mb-1">Error correction</span><select id="bc-qr-ec" value={ui.qrEc} onChange={set('qrEc')} className={input}><option value="L">Low (7 %)</option><option value="M">Medium (15 %)</option><option value="Q">Quartile (25 %)</option><option value="H">High (30 %)</option></select></label>}
              {sym.twoD === 'dm' && <label className="block"><span className="block text-neutral-500 mb-1">Shape</span><select id="bc-dm-shape" value={ui.dmShape} onChange={set('dmShape')} className={input}><option value="square">Square</option><option value="rectangle">Rectangle</option></select></label>}
              {sym.twoD === 'pdf417' && <>
                <label className="block"><span className="block text-neutral-500 mb-1">Columns (1-30)</span><input id="bc-pdf-cols" type="number" min="1" max="30" value={ui.pdfColumns} onChange={set('pdfColumns')} placeholder="auto" className={input} /></label>
                <label className="block"><span className="block text-neutral-500 mb-1">Error correction level (0-8)</span><input id="bc-pdf-ec" type="number" min="0" max="8" value={ui.pdfEc} onChange={set('pdfEc')} placeholder="auto" className={input} /></label>
              </>}
              {sym.twoD === 'aztec' && <label className="block"><span className="block text-neutral-500 mb-1">Error correction (% of symbol)</span><input id="bc-aztec-ec" type="number" min="5" max="95" value={ui.aztecEc} onChange={set('aztecEc')} className={input} /></label>}
            </div>
          </details>

          {mode === 'single' ? (
            <button onClick={generate} disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{busy ? 'Creating and checking…' : 'Generate Barcode'}</button>
          ) : (
            <div className="space-y-2">
              <button onClick={runBatch} disabled={busy} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{busy ? 'Creating and checking…' : 'Generate all as ZIP'}</button>
              {busy && progress && <><ProgressBar pct={progress.pct} label={progress.label} /><button type="button" onClick={() => { cancelRef.current = true; }} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-2 font-semibold">Cancel</button></>}
            </div>
          )}
          {error && <p className="text-center text-red-600 text-sm" role="alert">{error}</p>}

          <div className={`flex justify-center bg-white rounded-xl p-4 ${out && mode === 'single' ? '' : 'hidden'}`}>
            <canvas ref={canvasRef} className="max-w-full h-auto" style={{ maxHeight: 320 }} />
          </div>
          {out && mode === 'single' && (
            <>
              <p className="text-center text-sm font-semibold" data-status>{out.read.skipped
                ? <span className="text-amber-700">Created, but not scanned back: no independent reader exists for {sym.label} in a browser. Test it with your scanner before printing a batch.</span>
                : <span className="text-green-700">✓ Scanned back by an independent reader (zxing-cpp): {out.read.text}</span>}</p>
              <p className="text-center text-xs text-neutral-500">Image {out.w} × {out.h} px{ui.unit === 'px' ? '' : ` = ${((out.w * 25.4) / out.p.dpi).toFixed(1)} × ${((out.h * 25.4) / out.p.dpi).toFixed(1)} mm at ${out.p.dpi} dpi`}</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {FORMATS.map((f) => <a key={f.id} href={out.urls[f.id]} download={`${out.name}.${f.id}`} data-format={f.id} className="block text-center bg-green-600 hover:bg-green-500 text-white rounded-xl py-2 font-semibold transition">{f.label}</a>)}
              </div>
            </>
          )}
          {batchResult && mode === 'batch' && (
            <div className="text-sm space-y-1" data-status>
              <p className="text-green-700 font-semibold">{batchResult.ok} code{batchResult.ok === 1 ? '' : 's'} in {batchResult.name} ({batchResult.secs.toFixed(1)} s){batchResult.skipped ? ` — ${batchResult.skipped} not scanned back (no independent reader for ${sym.label})` : ', each scanned back'}.</p>
              {batchResult.failed.length > 0 && <p className="text-red-600">{batchResult.failed.length} left out (listed in errors.txt inside the ZIP): {batchResult.failed.slice(0, 3).join(' · ')}{batchResult.failed.length > 3 ? ' …' : ''}</p>}
              <a href={batchResult.url} download={batchResult.name} className="text-indigo-600">Download the ZIP again</a>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="Barcode Generator"
        description={`Barcode Generator creates ${ALL.length} kinds of barcodes in your browser — Code 128, GS1-128, Code 39, Code 93, Codabar, Interleaved 2 of 5, ITF-14, MSI Plessey, Pharmacode, Code 11, Telepen, PZN, EAN-13, EAN-8, UPC-A, UPC-E, ISBN, ISMN, ISSN, the GS1 DataBar family, QR Code, Micro QR, Data Matrix, GS1 DataMatrix, PDF417, MicroPDF417, Aztec and MaxiCode — with print sizes in millimetres or mils, colours, rotation and quiet zones. Download PNG, JPG or GIF with the resolution written in, or vector SVG, PDF and EPS for print; or generate thousands at once from a list or a numbered series into one ZIP. Every code is read back by an independent decoder before it is offered, and nothing is uploaded.`}
        howTo={[
          'Choose the barcode type; the hint under it says what it accepts.',
          'Type the value, or switch to "Many (ZIP)" and paste one value per line or set up a numbered series.',
          'Set the size — module width and bar height in millimetres (or mils, or pixels) and the print resolution — and, if you like, colours, rotation and the quiet zone.',
          'Click Generate: each code is drawn, then scanned back by a separate reader. Download PNG, SVG, PDF, EPS, JPG or GIF, or the ZIP.',
        ]}
        faqs={[
          { q: 'Is Barcode Generator free?', a: 'Yes — no signup, no watermark, no limit on how many barcodes you make, and you may use them commercially. Up to 5,000 codes fit in one ZIP.' },
          { q: 'Which barcode types are supported?', a: `${ALL.length} types: ${ALL.map((s) => s.label).join(', ')}.` },
          { q: 'How do I know the barcode scans?', a: 'After drawing it, the page decodes it with zxing-cpp, an open-source reader independent of the engine that drew it, and only offers the files if it reads exactly what you entered (check digits included). MSI Plessey, Pharmacode and Code 11 have no such reader in a browser: they are marked as not scanned back. Test with your own scanner before printing large runs.' },
          { q: 'What size should I choose for print?', a: 'Retail EAN/UPC codes are nominally 0.33 mm per module (100 %), from 0.264 mm (80 %) to 0.66 mm (200 %). Vector files (SVG, PDF, EPS) have exactly the module width you set. PNG, JPG and GIF use a whole number of pixels per module so bars stay sharp: the page shows the closest size it can make at your resolution, and writes that resolution into the file.' },
          { q: 'Does it add the check digit?', a: 'For EAN-13, EAN-8, UPC-A, UPC-E and ITF-14, type the number without its last digit and it is calculated; type it in full and it is verified. GS1 codes check the digits of each Application Identifier. Code 93 always includes its two check characters, as its standard requires; Code 39 and Interleaved 2 of 5 can add an optional one; MSI offers the usual schemes.' },
          { q: 'Can I make many barcodes at once?', a: 'Yes. Paste one value per line, or set a prefix, a first number, a count, a step, zero-padding and a suffix to number a series; every code is checked and they come as one ZIP, with any value that could not be encoded listed in errors.txt.' },
          { q: 'Is my data private?', a: 'Yes. Everything is drawn and checked in your browser; nothing you type is sent to a server.' },
        ]}
        tips={[
          'Use PDF, EPS or SVG for packaging and labels: they print at exactly the size you set.',
          'Keep the quiet zone (the blank margin); scanners need it — "auto" uses the size each standard recommends.',
          'Dark bars on a light background: the page refuses inverted or low-contrast colours.',
          'For GS1 codes, write each Application Identifier in brackets, like (01)09501101530003(17)261231.',
        ]}
      />
    </div>
  );
}
