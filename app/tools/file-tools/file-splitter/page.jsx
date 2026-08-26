'use client';
import { useState, useRef } from 'react';
import SeoContent from '../../../components/SeoContent';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_LABEL, MAX_CHUNKS } from './config';
export default function FileSplitterPage() {
  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(1);
  const [unit, setUnit] = useState('MB');
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef();
  const handleFile = (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    setChunks([]);
    setError('');
    if (f && f.size > MAX_FILE_SIZE_BYTES) {
      setError(`This file is ${(f.size / (1024 * 1024 * 1024)).toFixed(1)} GB, which is over the ${MAX_FILE_SIZE_LABEL} limit.`);
      setFile(null);
      return;
    }
    setFile(f);
  };
  const chunkSizeValid = Number.isFinite(chunkSize) && chunkSize > 0;
  const split = () => {
    if (!file) return;
    if (!chunkSizeValid) { setError('Chunk size must be a positive number.'); return; }
    setError('');
    setLoading(true);
    try {
      const sizes = { B: 1, KB: 1024, MB: 1024*1024 };
      const bytesPerChunk = chunkSize * sizes[unit];
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
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(2) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Splitter</h1>
        <p className="text-neutral-500 text-center mb-2">Split large files into smaller parts</p>
        <p className="text-neutral-400 text-xs text-center mb-8">Supports files up to {MAX_FILE_SIZE_LABEL} and up to {MAX_CHUNKS.toLocaleString()} parts. Splitting is instant — chunks are lazy byte-range views, not copied into memory.</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Chunk Size</label><input type="number" min="1" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Unit</label><select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option>B</option><option>KB</option><option>MB</option></select></div>
          </div>
          <button onClick={split} disabled={!file || loading || !chunkSizeValid} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition">{loading ? 'Splitting...' : 'Split File'}</button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          {chunks.length > 0 && (
            <div className="space-y-2">
              <p className="text-green-400 text-center">{chunks.length} part(s) created</p>
              {chunks.map(c => (
                <div key={c.index} className="flex justify-between items-center bg-neutral-50 rounded-lg border border-neutral-200 p-3">
                  <span className="text-sm">Part {c.index} — {formatSize(c.size)}</span>
                  <a href={c.url} download={file.name + '.part' + c.index} className="text-indigo-400 hover:text-indigo-300 text-sm">Download</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SeoContent
        title="File Splitter"
        description="File Splitter is a free online tool that divides any file into smaller, numbered parts by size — entirely in your browser, with nothing uploaded to a server. It's useful for staying under email attachment limits, upload size caps, or storage constraints."
        howTo={[
          "Click the upload area and select the file you want to split.",
          "Set your chunk size and unit (Bytes, KB, or MB).",
          "Click \"Split File\" to divide it into numbered parts locally.",
          "Download each part individually — you'll need all of them together to reconstruct the original file."
        ]}
        faqs={[
          { q: "What file types can I split?", a: "Any file type — splitting works purely on raw bytes, so there are no format restrictions." },
          { q: "Does File Splitter include a way to merge the parts back together?", a: "Not on this page — this tool only splits files. You'll need a separate file-joining utility, or a command like \"copy /b\" on Windows or \"cat\" on Mac/Linux, to reassemble the parts in order." },
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