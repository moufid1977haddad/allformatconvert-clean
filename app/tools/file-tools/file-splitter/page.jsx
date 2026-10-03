'use client';
import { emptyFileProblem } from '../../../lib/fileChecks';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MAX_CHUNKS } from './config';
import { formatBytes } from '../../../lib/formatBytes';
import { FileDownload, DownloadGroup } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import UploadPrompt from '@/app/components/UploadPrompt';
export default function FileSplitterPage() {
  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(1);
  const [unit, setUnit] = useState('MB');
  const [chunks, setChunks] = useState([]);
  // P24 (03/10): pinetools / ezyZip split into N equal parts too, and the parts could not be joined back here (the FAQ
  // sent visitors to "copy /b"): a Join mode puts .part1 … .partN together again, in order, refusing a gap.
  const [mode, setMode] = useState('split'); // split | join
  const [by, setBy] = useState('size'); // size | parts
  const [parts, setParts] = useState(2);
  const [joined, setJoined] = useState(null);
  const joinRef = useRef();
  const join = (e) => {
    const list = Array.from(e.target.files || []); e.target.value = '';
    setError(''); setJoined(null);
    if (!list.length) return;
    const parsed = list.map((f) => { const m = /^(.*)\.part(\d+)$/i.exec(f.name); return m ? { f, base: m[1], n: Number(m[2]) } : { f, base: null, n: NaN }; });
    const bad = parsed.filter((x) => !x.base);
    if (bad.length) { setError(`"${bad[0].f.name}" is not a part made by this tool (its name must end in .part1, .part2…).`); return; }
    const bases = [...new Set(parsed.map((x) => x.base))];
    if (bases.length > 1) { setError(`These parts come from different files (${bases.slice(0, 3).map((b) => `"${b}"`).join(', ')}): choose the parts of one file only.`); return; }
    parsed.sort((a, b) => a.n - b.n);
    for (let i = 0; i < parsed.length; i++) if (parsed[i].n !== i + 1) { setError(`Part ${i + 1} is missing (or chosen twice): the file cannot be rebuilt without every part, in order.`); return; }
    // parts of one split have one size (equal parts may differ by one byte), the last one may be smaller
    const sizes = parsed.map((x) => x.f.size), top = Math.max(...sizes.slice(0, -1), 0);
    if (sizes.slice(0, -1).some((s) => s < top - 1) || sizes[sizes.length - 1] > top + 1) { setError('These parts do not have the sizes of one split (one may come from another split of the same file): choose the parts of a single split.'); return; }
    const blob = new Blob(parsed.map((x) => x.f), { type: 'application/octet-stream' });
    setJoined({ url: URL.createObjectURL(blob), name: bases[0], count: parsed.length, size: blob.size });
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useToolError('');
  const inputRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setChunks([]);
    setError('');
    if (f && emptyFileProblem(f)) { setFile(null); setError(emptyFileProblem(f, 'split')); return; } // P21
    if (f && f.size > MAX_FILE_SIZE_BYTES) {
      setError(`This file is ${formatBytes(f.size)}, which is over the ${MAX_FILE_SIZE_LABEL} limit.`);
      setFile(null);
      return;
    }
    setFile(f);
  };
  const chunkSizeValid = Number.isFinite(chunkSize) && chunkSize > 0;
  const split = () => {
    if (!file) return;
    if (by === 'size' && !chunkSizeValid) { setError('Chunk size must be a positive number.'); return; }
    setError('');
    setLoading(true);
    try {
      const sizes = { B: 1, KB: 1024, MB: 1024*1024 };
      const n = Math.round(Number(parts));
      if (by === 'parts' && !(n >= 2)) { setError('Choose at least 2 parts.'); setLoading(false); return; }
      if (by === 'parts' && n > file.size) { setError(`This file is only ${file.size} bytes: it cannot be cut into ${n} parts.`); setLoading(false); return; }
      const bytesPerChunk = by === 'parts' ? Math.ceil(file.size / n) : chunkSize * sizes[unit];
      if (by === 'parts') { // exactly n parts: the first size % n parts are one byte longer
        const base = Math.floor(file.size / n), extra = file.size % n, list = []; let at = 0;
        for (let k = 0; k < n; k++) { const len = base + (k < extra ? 1 : 0), chunk = file.slice(at, at + len); at += len; list.push({ url: URL.createObjectURL(chunk), size: chunk.size, index: k + 1 }); }
        setChunks(list); setLoading(false); return;
      }
      const expectedChunks = Math.ceil(file.size / bytesPerChunk);
      if (expectedChunks > MAX_CHUNKS) {
        setError(`That chunk size would produce ${expectedChunks.toLocaleString()} parts, over the ${MAX_CHUNKS.toLocaleString()}-part limit. Choose a larger chunk size.`);
        setChunks([]);
        setLoading(false);
        return;
      }
      // Blob.slice() is a lazy, zero-copy view -- it reads no bytes now,
      // only when a chunk is actually downloaded later. The file itself
      // is never read into memory here, so this is safe regardless of
      // file size (unlike the previous file.arrayBuffer() + manual byte
      // slicing, which fully materialized the file and then duplicated
      // it again across every chunk's own Blob).
      const newChunks = [];
      for (let i = 0; i < file.size; i += bytesPerChunk) {
        const end = Math.min(i + bytesPerChunk, file.size);
        const chunk = file.slice(i, end);
        newChunks.push({ url: URL.createObjectURL(chunk), size: chunk.size, index: newChunks.length + 1 });
      }
      setChunks(newChunks);
    } catch (err) {
      setError('Failed to split file: ' + (err?.message || 'unknown error'));
      setChunks([]);
    }
    setLoading(false);
  };
  const formatSize = formatBytes;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Splitter</h1>
        <p className="text-neutral-500 text-center mb-2">Split large files into smaller parts</p>
        <p className="text-neutral-500 text-xs text-center mb-8">Supports files up to {MAX_FILE_SIZE_LABEL} and up to {MAX_CHUNKS.toLocaleString()} parts. Splitting is instant — chunks are lazy byte-range views, not copied into memory.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          {mode === 'split' && <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : <UploadPrompt what="a file" />}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Mode">
            {[['split', 'Split a file'], ['join', 'Join parts']].map(([id, label]) => <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => { setMode(id); setError(''); }} className={`rounded-lg py-2 text-sm font-medium transition ${mode === id ? 'bg-indigo-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}>{label}</button>)}
          </div>
          {mode === 'join' && (
            <div className="space-y-2">
              <button type="button" onClick={() => joinRef.current.click()} className="w-full border-2 border-dashed border-neutral-200 rounded-xl p-6 text-neutral-500 hover:border-indigo-500">Choose all the parts (name.part1, name.part2…)</button>
              <input ref={joinRef} type="file" multiple className="hidden" onChange={join} />
              {joined && <div className="space-y-2"><p className="text-green-600 text-center text-sm">{joined.count} parts joined, {formatBytes(joined.size)}</p><FileDownload href={joined.url} name={joined.name} /></div>}
            </div>
          )}
          {mode === 'split' && <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="split-by" checked={by === 'size'} onChange={() => setBy('size')} /> By size</label>
            <label className="flex items-center gap-2"><input type="radio" name="split-by" checked={by === 'parts'} onChange={() => setBy('parts')} /> Into equal parts</label>
          </div>}
          {mode === 'split' && by === 'parts' && <label className="block text-sm"><span className="block text-neutral-500 mb-1">Number of parts</span><input id="split-parts" type="number" min="2" max={MAX_CHUNKS} value={parts} onChange={e => setParts(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2" /></label>}
          {mode === 'split' && by === 'size' && <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Chunk Size</label><input aria-label="Chunk Size" type="number" min="1" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Unit</label><select aria-label="Unit" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option>B</option><option>KB</option><option>MB</option></select></div>
          </div>}
          {mode === 'split' && <button onClick={split} disabled={!file || loading || (by === 'size' && !chunkSizeValid)} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">{loading ? 'Splitting...' : 'Split File'}</button>}
          {error && <p role="alert" className="text-red-600 text-center text-sm">{error}</p>}
          {mode === 'split' && chunks.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{chunks.length} part(s) created</p>
              <DownloadGroup zipName={file.name + '-parts.zip'}>
                {chunks.map(c => (
                  <FileDownload key={c.index} href={c.url} name={file.name + '.part' + c.index} note={`part ${c.index}`} />
                ))}
              </DownloadGroup>
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="File Splitter"
        description="File Splitter is a free online tool that divides any file into smaller, numbered parts by size — entirely in your browser, with nothing uploaded to a server. It's useful for staying under email attachment limits, upload size caps, or storage constraints."
        howTo={[
          "Click the upload area and select the file you want to split.",
          "Choose 'By size' and set the chunk size and unit (Bytes, KB, or MB), or 'Into equal parts' and the number of parts.",
          "Click \"Split File\" to divide it into numbered parts locally.",
          "Download each part individually — to rebuild the file later, choose 'Join parts' and select all of them."
        ]}
        faqs={[
          { q: "What file types can I split?", a: "Any file type — splitting works purely on raw bytes, so there are no format restrictions." },
          { q: "Does File Splitter include a way to merge the parts back together?", a: "Yes — choose 'Join parts' and select every .part file of the same file: they are put back together in order, and a missing part is pointed out. On a computer, \"copy /b\" (Windows) or \"cat\" (Mac, Linux) do the same." },
          { q: "Is there a file size limit?", a: `Files up to ${MAX_FILE_SIZE_LABEL} are supported, and a split can't produce more than ${MAX_CHUNKS.toLocaleString()} parts (pick a larger chunk size if you hit that). Splitting itself doesn't load your file into memory -- each part is a lazy byte-range view of the original, only read when you actually download it -- so file size isn't the limiting factor the way it is for tools that have to process a file's full contents.` },
          { q: "Is my data private?", a: "Yes. Splitting happens entirely in your browser — your file is never uploaded to a server." }
        ]}
        tips={[
          "Parts are numbered sequentially and automatically — keep them together in the same folder and in order for easy reassembly.",
          "Pick a chunk size just under your target limit (e.g. 24MB for a 25MB email attachment) to leave room for any encoding overhead.",
          "Splitting is instant regardless of file size, since parts are lazy views rather than copies — only downloading a part actually reads its bytes.",
          "Keep the original file until you've confirmed you can successfully rejoin and use the split parts."
        ]}
      />
    </div>
  );
}