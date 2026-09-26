'use client';
import { useState, useRef, useEffect } from 'react';
import SeoContent from '../../../components/SeoContent';
import ProgressBar from '../../../components/ProgressBar';
import { reportToolError } from '../../../lib/reportError';
import { isMobileDevice } from '../../../lib/isMobileDevice';
import { BATCH_BYTES, MOBILE_BATCH_BYTES, MAX_FILE_BYTES, MAX_FILE_LABEL, MOBILE_MAX_FILE_BYTES, MOBILE_MAX_FILE_LABEL, ZIP_IN_MEMORY_MAX, ZIP_IN_MEMORY_LABEL } from './config';

// Decimal units, like the caps shown on the page ("up to 1.9 GB" = 1 900 000 000 bytes): a file listed at 1.95 GB
// is over it, not "1.82 GB" in binary units that would look under it.
const fmtSize = (n) => (n < 1000 ? `${n} B` : n < 1e6 ? `${(n / 1e3).toFixed(1)} KB` : n < 1e9 ? `${(n / 1e6).toFixed(1)} MB` : `${(n / 1e9).toFixed(2)} GB`);
const clock = () => performance.now();

// A split archive is opened from its first part; 7-Zip finds the others by name next to it.
function firstVolume(files) {
  const names = files.map((f) => f.name);
  const pick = (re) => names.find((n) => re.test(n));
  return pick(/\.part0*1\.rar$/i) || pick(/\.(7z|zip|rar|tar|gz|xz|bz2)\.0*1$/i) || pick(/\.0*1$/) || pick(/\.rar$/i) || pick(/\.zip$/i) || names[0];
}

// Only types a browser shows without running anything are opened in a tab (never HTML or SVG: a blob URL runs
// with this site's origin).
const PREVIEW = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', bmp: 'image/bmp', pdf: 'application/pdf', txt: 'text/plain', md: 'text/plain', csv: 'text/plain', log: 'text/plain', json: 'text/plain', xml: 'text/plain', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm' };
const extOf = (p) => (p.match(/\.([^./]+)$/) || [])[1]?.toLowerCase() || '';
const saveBlob = (blob, name) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 60000); };

// Files in batches of at most `limit` extracted bytes (a bigger file goes alone).
function batches(entries, limit) {
  const out = []; let cur = [], size = 0;
  for (const e of entries) {
    if (cur.length && size + e.size > limit) { out.push(cur); cur = []; size = 0; }
    cur.push(e); size += e.size;
  }
  if (cur.length) out.push(cur);
  return out;
}

export default function ZipExtractorPage() {
  const [archive, setArchive] = useState(null); // { files, main }
  const [listing, setListing] = useState(null); // { entries, format, volumes, links }
  const [phase, setPhase] = useState('idle'); // idle | opening | password | ready | busy
  const [password, setPassword] = useState('');
  const [pwRetry, setPwRetry] = useState(false);
  const [progress, setProgress] = useState(null); // { pct, label }
  const [rowBusy, setRowBusy] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [status, setStatus] = useState('');
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [canSaveFolder, setCanSaveFolder] = useState(false);
  const inputRef = useRef(null);
  const workerRef = useRef(null);
  const pwRef = useRef(''); // the password that opened the archive, reused for every extraction
  const pendingRef = useRef(null); // an extraction waiting for a password (data-only encrypted 7z/RAR)
  const cancelledRef = useRef(false);

  useEffect(() => { setIsMobile(isMobileDevice()); setCanSaveFolder(typeof window !== 'undefined' && 'showDirectoryPicker' in window); }, []);
  useEffect(() => () => { workerRef.current?.terminate(); }, []);
  const maxFile = isMobile ? MOBILE_MAX_FILE_BYTES : MAX_FILE_BYTES;
  const maxFileLabel = isMobile ? MOBILE_MAX_FILE_LABEL : MAX_FILE_LABEL;
  const batchBytes = isMobile ? MOBILE_BATCH_BYTES : BATCH_BYTES;

  const worker = () => {
    if (!workerRef.current) workerRef.current = new Worker(new URL('./extract.worker.js', import.meta.url), { type: 'module' });
    return workerRef.current;
  };
  const pendingAskRef = useRef(null); // resolves the request in flight when Cancel kills the engine
  const ask = (msg, onPct) => new Promise((resolve) => {
    const w = worker();
    pendingAskRef.current = resolve;
    w.onmessage = ({ data }) => { if (data.type === 'progress') onPct?.(data.pct); else { pendingAskRef.current = null; resolve(data); } };
    w.onerror = (e) => resolve({ type: 'error', message: e?.message || 'The extraction engine stopped unexpectedly.' });
    w.postMessage(msg);
  });

  const choose = async (list) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setListing(null); setError(''); setWarning(''); setStatus(''); setPassword(''); setPwRetry(false); pwRef.current = '';
    const a = { files, main: firstVolume(files) };
    setArchive(a);
    await openArchive(a, '');
  };

  const openArchive = async (a, pw) => {
    setPhase('opening'); setError('');
    const t0 = clock();
    const r = await ask({ type: 'open', files: a.files, main: a.main, password: pw, maxTarBytes: maxFile }, (pct) => setProgress({ pct, label: 'Reading the archive…' }));
    setProgress(null);
    if (r.type === 'password') { setPhase('password'); setPwRetry(r.retry); return; }
    if (r.type === 'error') { setPhase('idle'); setError(r.message); reportToolError({ tool: 'zip-extractor', file: a.files[0], error: new Error(r.message) }); return; }
    pwRef.current = pw;
    setListing(r); setPhase('ready');
    const total = r.entries.reduce((s, e) => s + e.size, 0);
    setStatus(`${r.entries.length} file${r.entries.length === 1 ? '' : 's'}, ${fmtSize(total)} in all — listed in ${((clock() - t0) / 1000).toFixed(1)} s. Nothing is extracted until you ask.`);
    if (r.links) setWarning(`${r.links} symbolic link${r.links > 1 ? 's are' : ' is'} not listed: a link has no content of its own to download.`);
  };

  // Extract some entries; asks for the password if 7-Zip needs one only now (file data encrypted, names not).
  const get = async (entries, onPct) => {
    const r = await ask({ type: 'get', paths: entries.map((e) => e.path), raws: entries.map((e) => e.raw ?? e.path), password: pwRef.current }, onPct);
    if (r.type === 'password') return { needPassword: true, retry: r.retry };
    if (r.type === 'error') throw new Error(r.message);
    const byRaw = new Map(entries.map((e) => [e.raw ?? e.path, e.path]));
    return { files: r.files.map((f) => ({ path: f.path ?? byRaw.get(f.raw), blob: f.blob, size: f.size })), warning: r.warning };
  };

  const withPassword = async (action) => {
    const r = await action();
    if (r?.needPassword) { pendingRef.current = action; setPhase('password'); setPwRetry(r.retry); }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!password) return;
    if (pendingRef.current) { pwRef.current = password; const action = pendingRef.current; pendingRef.current = null; setPhase('ready'); await withPassword(action); return; }
    await openArchive(archive, password);
  };

  const tooBig = (e) => e.size > maxFile;

  const downloadOne = (entry, open) => withPassword(async () => {
    setRowBusy(entry.path); setError('');
    try {
      const r = await get([entry]);
      if (r.needPassword) return r;
      const f = r.files[0];
      if (!f) { setError(r.warning || `${entry.path} could not be extracted.`); return null; }
      if (f.size !== entry.size) { setError(`${entry.path} came out at ${fmtSize(f.size)} instead of ${fmtSize(entry.size)}: the archive may be damaged.`); return null; }
      if (open) { const u = URL.createObjectURL(new Blob([f.blob], { type: PREVIEW[extOf(f.path)] })); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000); }
      else saveBlob(f.blob, f.path.split('/').pop());
      if (r.warning) setWarning(r.warning);
      return null;
    } catch (err) { setError(err.message); return null; } finally { setRowBusy(''); }
  });

  // Every file, batch by batch, handed to `sink` as it comes out; the tab never holds more than one batch.
  const eachBatch = async (sink) => {
    const wanted = listing.entries.filter((e) => !tooBig(e));
    const skipped = listing.entries.length - wanted.length;
    const total = wanted.reduce((s, e) => s + e.size, 0) || 1;
    let done = 0, n = 0;
    cancelledRef.current = false;
    for (const group of batches(wanted, batchBytes)) {
      if (cancelledRef.current) return { cancelled: true };
      const gsize = group.reduce((s, e) => s + e.size, 0);
      const r = await get(group, (pct) => setProgress({ pct: ((done + (gsize * pct) / 100) / total) * 100, label: `Extracting… ${n} of ${wanted.length} files` }));
      if (r.needPassword) return r;
      for (const f of r.files) { await sink(f); n++; }
      done += gsize;
      setProgress({ pct: (done / total) * 100, label: `Extracting… ${n} of ${wanted.length} files` });
    }
    return { n, skipped, missing: wanted.length - n };
  };
  const summary = (r, where) => `${r.n} file${r.n === 1 ? '' : 's'} ${where}.${r.skipped ? ` ${r.skipped} file${r.skipped > 1 ? 's' : ''} over ${maxFileLabel} left out (too large to extract in a browser tab).` : ''}${r.missing ? ` ${r.missing} could not be extracted.` : ''}`;

  const downloadAll = () => withPassword(async () => {
    setError(''); setStatus('');
    const name = `${(archive.main || 'archive').replace(/(\.part0*1)?\.[^.]+$/i, '').replace(/\.(tar|7z|zip|rar)$/i, '') || 'archive'}.zip`;
    const { makeZip } = await import('client-zip');
    const total = listing.entries.filter((e) => !tooBig(e)).reduce((s, e) => s + e.size, 0);
    // Chrome and Edge: the ZIP streams straight into the file the visitor picks (no copy in memory).
    let writable = null, handle = null;
    if ('showSaveFilePicker' in window) {
      try { handle = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: 'ZIP archive', accept: { 'application/zip': ['.zip'] } }] }); } catch { return null; } // dismissed
      writable = await handle.createWritable();
    } else if (total > ZIP_IN_MEMORY_MAX) {
      setError(`These files add up to ${fmtSize(total)}: over the ${ZIP_IN_MEMORY_LABEL} this browser can build into one ZIP (it has to hold it in memory). Download the files one by one, or use Chrome or Edge, which write the ZIP straight to disk.`);
      return null;
    }
    setPhase('busy');
    // client-zip pulls files from this queue as the batches come out
    const queue = []; let wake = null, finished = false, result = null;
    const feed = (async function* () { for (;;) { if (queue.length) yield queue.shift(); else if (finished) return; else await new Promise((r) => { wake = r; }); } })();
    const push = (f) => { queue.push({ name: f.path, input: f.blob, size: f.size }); wake?.(); };
    const zipStream = makeZip(feed);
    const target = writable ? zipStream.pipeTo(writable) : new Response(zipStream).blob();
    try {
      result = await eachBatch(async (f) => { push(f); while (queue.length > 2) await new Promise((r) => setTimeout(r, 20)); });
      finished = true; wake?.();
      if (result.needPassword || result.cancelled) { await writable?.abort?.().catch(() => {}); return result.needPassword ? result : null; }
      const blob = await target;
      if (!writable) saveBlob(blob, name);
      setStatus(summary(result, writable ? `written to "${handle.name}"` : `in ${name}`));
      return null;
    } catch (err) { finished = true; wake?.(); await writable?.abort?.().catch(() => {}); if (!cancelledRef.current) setError('The ZIP could not be written: ' + err.message); return null; }
    finally { setProgress(null); setPhase('ready'); }
  });

  // Chrome and Edge: every file written into a folder the visitor picks, keeping the archive's folders.
  const saveAll = () => withPassword(async () => {
    let root;
    try { root = await window.showDirectoryPicker({ mode: 'readwrite' }); } catch { return null; } // dismissed
    setError(''); setStatus(''); setPhase('busy');
    try {
      const r = await eachBatch(async (f) => {
        const parts = f.path.split('/');
        let dir = root;
        for (const p of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(p, { create: true });
        const w = await (await dir.getFileHandle(parts[parts.length - 1], { create: true })).createWritable();
        await w.write(f.blob); await w.close();
      });
      if (r.needPassword) return r;
      if (!r.cancelled) setStatus(summary(r, `saved to the folder "${root.name}"`));
      return null;
    } catch (err) { if (!cancelledRef.current) setError('Saving to the folder failed: ' + err.message); return null; }
    finally { setProgress(null); setPhase('ready'); }
  });

  const cancel = async () => {
    cancelledRef.current = true;
    workerRef.current?.terminate(); workerRef.current = null;
    pendingAskRef.current?.({ type: 'error', message: 'Cancelled.' }); pendingAskRef.current = null;
    setProgress(null); setRowBusy('');
    if (phase === 'opening') { setPhase('idle'); setError('Cancelled.'); return; }
    await openArchive(archive, pwRef.current); // a fresh engine needs the archive opened again (quick: listing only)
    setError('Cancelled.');
  };

  const busy = phase === 'opening' || phase === 'busy';
  const bigOnes = listing ? listing.entries.filter(tooBig).length : 0;

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">ZIP Extractor</h1>
        <p className="text-neutral-500 text-center mb-2">Open ZIP, RAR, 7Z, TAR, GZ, ISO and 40+ other archive formats — password-protected and split archives included</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Extracted in your browser with 7-Zip and zip.js: the archive is never uploaded. Any archive size; each file up to {maxFileLabel}{isMobile ? ' on this device' : ''}.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-neutral-200 hover:border-indigo-500'}`}
            onClick={() => !busy && inputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) choose(e.dataTransfer.files); }}
          >
            <p className="text-neutral-600">Drop an archive here, or click to choose</p>
            <p className="text-neutral-400 text-xs mt-1">For a split archive (.part1.rar, .7z.001, .z01…), choose all of its parts together</p>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { choose(e.target.files); e.target.value = ''; }} />
          </div>

          {archive && <p className="text-sm text-neutral-600 break-all">{archive.main}{archive.files.length > 1 ? ` + ${archive.files.length - 1} more part${archive.files.length > 2 ? 's' : ''}` : ''}{listing ? ` · ${listing.format}${listing.volumes > 1 ? `, ${listing.volumes} volumes` : ''}` : ''}</p>}

          {phase === 'password' && (
            <form onSubmit={submitPassword} className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <label className="block text-sm font-semibold text-amber-900" htmlFor="archive-password">{pwRetry ? 'Wrong password — try again' : 'This archive is password-protected'}</label>
              <div className="flex gap-2">
                <input id="archive-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus autoComplete="off" className="flex-1 border border-amber-300 rounded-lg px-3 py-2" />
                <button type="submit" disabled={!password} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-300 text-white rounded-lg px-4 font-semibold">Unlock</button>
              </div>
              <p className="text-xs text-amber-800">The password is used only inside this tab; it is never sent anywhere.</p>
            </form>
          )}

          {(busy || progress) && (
            <div className="space-y-3">
              <ProgressBar pct={progress?.pct ?? 0} label={progress?.label || 'Reading the archive…'} />
              <button onClick={cancel} className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-800 rounded-xl py-3 font-semibold transition">Cancel</button>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3" role="alert">{error}</div>}
          {warning && <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3">{warning}</div>}
          {status && <p className="text-center text-sm text-green-700" data-status>{status}</p>}

          {listing && listing.entries.length > 0 && (
            <>
              <div className={`grid gap-2 ${canSaveFolder ? 'sm:grid-cols-2' : ''}`}>
                <button onClick={downloadAll} disabled={busy || !!rowBusy || phase === 'password'} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-300 text-white rounded-xl py-2 font-semibold">Download all as ZIP</button>
                {canSaveFolder && <button onClick={saveAll} disabled={busy || !!rowBusy || phase === 'password'} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-300 text-white rounded-xl py-2 font-semibold">Save all to a folder</button>}
              </div>
              {bigOnes > 0 && <p className="text-xs text-amber-700">{bigOnes} file{bigOnes > 1 ? 's are' : ' is'} over {maxFileLabel}{isMobile ? ' on this device' : ''}: too large to extract inside a browser tab. Use a desktop app such as 7-Zip for {bigOnes > 1 ? 'them' : 'it'}.</p>}
              <div className="space-y-1 max-h-[32rem] overflow-y-auto">
                {listing.entries.map((e) => (
                  <div key={e.path} data-entry={e.path} className="flex justify-between items-center gap-2 bg-neutral-50 rounded-lg border border-neutral-200 px-3 py-2">
                    <span className="text-sm break-all flex-1">{e.path} <span className="text-neutral-400">· {fmtSize(e.size)}{e.encrypted ? ' · 🔒' : ''}</span></span>
                    {rowBusy === e.path ? <span className="text-xs text-neutral-500">Extracting…</span> : tooBig(e) ? <span className="text-xs text-amber-700">too large</span> : (
                      <>
                        {PREVIEW[extOf(e.path)] && <button onClick={() => downloadOne(e, true)} disabled={busy || !!rowBusy} className="text-neutral-500 hover:text-neutral-700 text-sm">Open</button>}
                        <button onClick={() => downloadOne(e, false)} disabled={busy || !!rowBusy} data-download className="text-indigo-600 hover:text-indigo-500 text-sm">Download</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {listing && listing.entries.length === 0 && <p className="text-sm text-neutral-500">This archive contains no files.</p>}
        </div>
      </div>
      <SeoContent
        title="ZIP Extractor"
        description="ZIP Extractor opens ZIP, RAR (including RAR5), 7Z, TAR, TAR.GZ, TGZ, GZ, BZ2, XZ, ZST, ISO, CAB, WIM, DMG, ARJ, LZH, CPIO, RPM, DEB and many more archive formats directly in your browser, using 7-Zip compiled to WebAssembly and zip.js — nothing is uploaded. Password-protected archives (including encrypted file names) and split archives (.part1.rar, .7z.001, .z01) are supported. The archive is listed first; download any single file, open images, PDFs and text in a new tab, get everything as one ZIP, or save the whole folder structure to your computer."
        howTo={[
          "Drop the archive on the page, or click to choose it. For a split archive, select all of its parts at once.",
          "If the archive is password-protected, type the password when asked.",
          "The archive's files are listed with their folders and sizes — nothing is extracted yet.",
          "Click Download on any file, or Open to view an image, PDF or text file; or get everything with \"Download all as ZIP\" or (Chrome and Edge) \"Save all to a folder\"."
        ]}
        faqs={[
          { q: "Which archive formats can it open?", a: "ZIP (with zip.js) and every format the 7-Zip program reads: RAR and RAR5, 7Z, TAR, GZ/TGZ, BZ2, XZ, ZST, LZMA, ISO, CAB, WIM, DMG, VHD, ARJ, LZH, CPIO, RPM, DEB, CHM, MSI and more. The format is detected from the file's contents, not its name." },
          { q: "Can it open password-protected archives?", a: "Yes — ZIP (AES and the older ZipCrypto), RAR and 7Z, even when the file names themselves are encrypted. You are asked for the password; it stays inside your browser tab." },
          { q: "How do I extract a split (multi-part) archive?", a: "Select every part together — for example archive.part1.rar, archive.part2.rar… or archive.7z.001, archive.7z.002… or archive.z01, archive.z02, archive.zip. The tool starts from the first part and reads the others automatically. If a part is missing, it says so." },
          { q: "Is there a size limit?", a: `Not on the archive: it is read from your disk piece by piece, and files are extracted only when you ask for them. Each file must fit in the tab's memory: up to ${MAX_FILE_LABEL} per file on a computer (${MOBILE_MAX_FILE_LABEL} on phones and tablets). "Download all as ZIP" streams to disk in Chrome and Edge; other browsers build the ZIP in memory, up to ${ZIP_IN_MEMORY_LABEL}.` },
          { q: "Are my files uploaded?", a: "No. The archive is opened and extracted entirely in your browser; nothing is sent to a server." },
          { q: "Why are ZIP file names sometimes garbled elsewhere but not here?", a: "Older tools (including Windows' built-in compressed folders) store names in a legacy code page without saying so. This tool reads them the way the ZIP specification says (UTF-8 when valid, otherwise IBM code page 437), so accented names come out right." },
          { q: "What engines does it use?", a: "zip.js for ZIP files, and 7-Zip 24.09 by Igor Pavlov compiled to WebAssembly (the 7z-wasm package, GNU LGPL with the unRAR restriction — see /wasm/7zz-LICENSE.txt) for everything else." }
        ]}
        tips={[
          "Only need one file from a big archive? Click its Download: only that file is extracted.",
          "\"Save all to a folder\" (Chrome and Edge) writes the files straight to your disk with their folder structure.",
          "If extraction fails, check that the file is really an archive: the contents are read, so a renamed file is recognised anyway."
        ]}
      />
    </div>
  );
}
