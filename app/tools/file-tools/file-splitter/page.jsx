'use client';
import { useState, useRef } from 'react';
export default function FileSplitterPage() {
  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(1);
  const [unit, setUnit] = useState('MB');
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();
  const handleFile = (e) => { setFile(e.target.files[0]); setChunks([]); };
  const split = async () => {
    if (!file) return;
    setLoading(true);
    const sizes = { B: 1, KB: 1024, MB: 1024*1024 };
    const bytesPerChunk = chunkSize * sizes[unit];
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const newChunks = [];
    for (let i = 0; i < bytes.length; i += bytesPerChunk) {
      const chunk = bytes.slice(i, i + bytesPerChunk);
      const blob = new Blob([chunk]);
      newChunks.push({ url: URL.createObjectURL(blob), size: chunk.length, index: newChunks.length + 1 });
    }
    setChunks(newChunks);
    setLoading(false);
  };
  const formatSize = (b) => b < 1024 ? b + ' B' : b < 1024*1024 ? (b/1024).toFixed(2) + ' KB' : (b/(1024*1024)).toFixed(2) + ' MB';
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">File Splitter</h1>
        <p className="text-neutral-500 text-center mb-8">Split large files into smaller parts</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="border-2 border-dashed border-neutral-200 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 transition" onClick={() => inputRef.current.click()}>
            <p className="text-neutral-500">{file ? file.name : 'Click or drop a file here'}</p>
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Chunk Size</label><input type="number" min="1" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3" /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Unit</label><select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3"><option>B</option><option>KB</option><option>MB</option></select></div>
          </div>
          <button onClick={split} disabled={!file || loading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">{loading ? 'Splitting...' : 'Split File'}</button>
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
    </div>
  );
}